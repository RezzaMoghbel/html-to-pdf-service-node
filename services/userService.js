/**
 * User Service
 *
 * Manages user account operations including CRUD operations,
 * authentication, and security features. All operations are
 * designed to be thread-safe and maintain data integrity.
 *
 * @fileoverview User account management service
 * @author PDF Service Team
 * @version 1.0.0
 */

const path = require("path");
const { v4: uuidv4 } = require("uuid");
const {
  readJSONFile,
  writeJSONFile,
  fileExists,
  listFiles,
  ensureDirectory,
  deleteFile,
} = require("../utils/fileSystem");
const {
  hashEmail,
  hashPassword,
  comparePassword,
} = require("../utils/encryption");
const {
  validateUserRegistration,
  validateEmail,
} = require("../utils/validation");

// File paths
const USERS_DIR = path.join(process.cwd(), "database", "users");

/**
 * Create a new user account
 *
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Created user object (without password hash)
 * @throws {Error} If user creation fails or user already exists
 *
 * @example
 * const userData = {
 *   email: 'user@example.com',
 *   password: 'MyPassword123!',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   dob: '15/03/1990',
 *   address: { ... }
 * };
 * const user = await createUser(userData);
 * console.log(`User created: ${user.email}`);
 */
async function createUser(userData) {
  if (!userData || typeof userData !== "object") {
    throw new Error("User data is required and must be an object");
  }

  // Validate user data
  console.log("DEBUG: userService.createUser - userData:", JSON.stringify(userData, null, 2));
  const validation = validateUserRegistration(userData);
  console.log("DEBUG: userService.createUser - validation result:", JSON.stringify(validation, null, 2));
  if (!validation.isValid) {
    throw new Error(`User validation failed: ${validation.errors.join(", ")}`);
  }

  const { email, password, ...profileData } = validation.sanitizedData;

  // Check if user already exists
  if (await findUserByEmail(email)) {
    throw new Error("User with this email already exists");
  }

  try {
    // Ensure users directory exists
    await ensureDirectory(USERS_DIR);

    // Generate user ID and hash password
    const userId = uuidv4();
    const passwordHash = await hashPassword(password);
    const emailHash = hashEmail(email);

    // Create user object
    const user = {
      _id: userId,
      email: email,
      passwordHash: passwordHash,
      profile: {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        dob: profileData.dob,
        address: profileData.address,
      },
      apiKey: {
        key: null,
        createdAt: null,
        lastUsedAt: null,
      },
      security: {
        isBlocked: false,
        blockReason: "",
        failedLoginAttempts: 0,
        lastFailedLogin: null,
        passwordResetToken: "",
        passwordResetExpiry: "",
      },
      usage: {
        totalRequests: 0,
        requestsByIP: [],
        rateLimit: 1000,
        rateLimitPeriod: "day",
      },
      timestamps: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null,
      },
      emailVerification: {
        isVerified: false,
        verificationToken: "",
        verificationExpiry: "",
      },
    };

    // Write user file
    const userFilePath = path.join(USERS_DIR, `${emailHash}.json`);
    await writeJSONFile(userFilePath, user);

    // Return user without sensitive data
    const { passwordHash: _, ...userResponse } = user;
    return userResponse;
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

/**
 * Find user by email address
 *
 * @param {string} email - User email address
 * @returns {Promise<Object|null>} User object or null if not found
 * @throws {Error} If lookup fails
 *
 * @example
 * const user = await findUserByEmail('user@example.com');
 * if (user) {
 *   console.log(`Found user: ${user.profile.firstName}`);
 * }
 */
async function findUserByEmail(email) {
  if (!email || typeof email !== "string") {
    throw new Error("Email is required and must be a string");
  }

  try {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(`Invalid email format: ${emailValidation.error}`);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailHash = hashEmail(normalizedEmail);
    const userFilePath = path.join(USERS_DIR, `${emailHash}.json`);

    if (await fileExists(userFilePath)) {
      return await readJSONFile(userFilePath);
    }

    return null;
  } catch (error) {
    if (error.message.includes("File not found")) {
      return null;
    }
    throw new Error(`Failed to find user by email: ${error.message}`);
  }
}

/**
 * Find user by user ID
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 * @throws {Error} If lookup fails
 *
 * @example
 * const user = await findUserById('user-uuid-123');
 * if (user) {
 *   console.log(`Found user: ${user.email}`);
 * }
 */
async function findUserById(userId) {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  try {
    const userFiles = await listFiles(USERS_DIR, ".json");

    for (const filePath of userFiles) {
      const user = await readJSONFile(filePath);
      if (user._id === userId) {
        return user;
      }
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to find user by ID: ${error.message}`);
  }
}

/**
 * Find user by API key
 *
 * @param {string} apiKey - API key
 * @returns {Promise<Object|null>} User object or null if not found
 * @throws {Error} If lookup fails
 *
 * @example
 * const user = await findUserByApiKey('sk_live_...');
 * if (user) {
 *   console.log(`Found user: ${user.email}`);
 * }
 */
async function findUserByApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("API key is required and must be a string");
  }

  try {
    const userFiles = await listFiles(USERS_DIR, ".json");

    for (const filePath of userFiles) {
      const user = await readJSONFile(filePath);
      if (user.apiKey && user.apiKey.key === apiKey) {
        return user;
      }
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to find user by API key: ${error.message}`);
  }
}

/**
 * Update user data
 *
 * @param {string} userId - User ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated user object (without password hash)
 * @throws {Error} If update fails or user not found
 *
 * @example
 * const updates = {
 *   profile: {
 *     firstName: 'Jane'
 *   }
 * };
 * const updatedUser = await updateUser('user-uuid-123', updates);
 * console.log(`Updated user: ${updatedUser.profile.firstName}`);
 */
async function updateUser(userId, updates) {
  debugger
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  if (!updates || typeof updates !== "object") {
    throw new Error("Updates must be a valid object");
  }

  try {
    console.log("DEBUG: userService.updateUser - userId:", userId);
    console.log("DEBUG: userService.updateUser - updates:", JSON.stringify(updates, null, 2));
    
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    console.log("DEBUG: userService.updateUser - current user before update:", JSON.stringify(user, null, 2));

    // Apply updates with proper nested object merging
    // Extract profile and timestamps from updates to handle them separately
    const { profile: updatesProfile, timestamps: updatesTimestamps, ...otherUpdates } = updates;
    
    console.log("DEBUG: userService.updateUser - updatesProfile:", JSON.stringify(updatesProfile, null, 2));
    console.log("DEBUG: userService.updateUser - updatesTimestamps:", JSON.stringify(updatesTimestamps, null, 2));
    console.log("DEBUG: userService.updateUser - otherUpdates:", JSON.stringify(otherUpdates, null, 2));
    
    const updatedUser = {
      ...user,
      ...otherUpdates, // Apply non-profile, non-timestamps updates first
      profile: {
        ...(user.profile || {}),
        ...(updatesProfile || {}),
        address: {
          ...(user.profile?.address || {}),
          ...(updatesProfile?.address || {}),
        },
      },
      timestamps: {
        ...user.timestamps,
        ...(updatesTimestamps || {}),
        updatedAt: new Date().toISOString(),
      },
    };
    
    console.log("DEBUG: userService.updateUser - updated user after merge:", JSON.stringify(updatedUser, null, 2));

    // Write updated user file
    const emailHash = hashEmail(user.email);
    const userFilePath = path.join(USERS_DIR, `${emailHash}.json`);
    console.log("DEBUG: userService.updateUser - writing to file:", userFilePath);
    
    await writeJSONFile(userFilePath, updatedUser);
    
    console.log("DEBUG: userService.updateUser - file written successfully");

    // Return user without sensitive data
    const { passwordHash: _, ...userResponse } = updatedUser;
    return userResponse;
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
}

/**
 * Delete user account (soft delete)
 *
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user was deleted
 * @throws {Error} If deletion fails or user not found
 *
 * @example
 * const deleted = await deleteUser('user-uuid-123');
 * if (deleted) {
 *   console.log('User deleted successfully');
 * }
 */
async function deleteUser(userId) {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Soft delete by marking as deleted and blocking
    const deletedUser = {
      ...user,
      security: {
        ...user.security,
        isBlocked: true,
        blockReason: "Account deleted",
      },
      timestamps: {
        ...user.timestamps,
        updatedAt: new Date().toISOString(),
        deletedAt: new Date().toISOString(),
      },
    };

    // Write updated user file
    const emailHash = hashEmail(user.email);
    const userFilePath = path.join(USERS_DIR, `${emailHash}.json`);
    await writeJSONFile(userFilePath, deletedUser);

    return true;
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * Validate user password
 *
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<boolean>} True if password is correct
 * @throws {Error} If validation fails
 *
 * @example
 * const isValid = await validatePassword('user@example.com', 'MyPassword123!');
 * if (isValid) {
 *   console.log('Password is correct');
 * }
 */
async function validatePassword(email, password) {
  if (!email || typeof email !== "string") {
    throw new Error("Email is required and must be a string");
  }

  if (!password || typeof password !== "string") {
    throw new Error("Password is required and must be a string");
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return false;
    }

    return await comparePassword(password, user.passwordHash);
  } catch (error) {
    throw new Error(`Password validation failed: ${error.message}`);
  }
}

/**
 * Increment failed login attempts
 *
 * @param {string} email - User email
 * @returns {Promise<Object>} Updated user object
 * @throws {Error} If update fails
 *
 * @example
 * const user = await incrementFailedLogin('user@example.com');
 * console.log(`Failed attempts: ${user.security.failedLoginAttempts}`);
 */
async function incrementFailedLogin(email) {
  if (!email || typeof email !== "string") {
    throw new Error("Email is required and must be a string");
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await updateUser(user._id, {
      security: {
        ...user.security,
        failedLoginAttempts: user.security.failedLoginAttempts + 1,
        lastFailedLogin: new Date().toISOString(),
      },
    });

    return updatedUser;
  } catch (error) {
    throw new Error(
      `Failed to increment failed login attempts: ${error.message}`
    );
  }
}

/**
 * Reset failed login attempts
 *
 * @param {string} email - User email
 * @returns {Promise<Object>} Updated user object
 * @throws {Error} If update fails
 *
 * @example
 * const user = await resetFailedLoginAttempts('user@example.com');
 * console.log(`Failed attempts reset: ${user.security.failedLoginAttempts}`);
 */
async function resetFailedLoginAttempts(email) {
  if (!email || typeof email !== "string") {
    throw new Error("Email is required and must be a string");
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await updateUser(user._id, {
      security: {
        ...user.security,
        failedLoginAttempts: 0,
        lastFailedLogin: null,
      },
    });

    return updatedUser;
  } catch (error) {
    throw new Error(`Failed to reset failed login attempts: ${error.message}`);
  }
}

/**
 * Block user account
 *
 * @param {string} userId - User ID
 * @param {string} reason - Block reason
 * @returns {Promise<Object>} Updated user object
 * @throws {Error} If update fails
 *
 * @example
 * const user = await blockUser('user-uuid-123', 'Suspicious activity');
 * console.log(`User blocked: ${user.security.isBlocked}`);
 */
async function blockUser(userId, reason) {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  if (!reason || typeof reason !== "string") {
    throw new Error("Block reason is required and must be a string");
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await updateUser(userId, {
      security: {
        ...user.security,
        isBlocked: true,
        blockReason: reason.trim(),
      },
    });

    return updatedUser;
  } catch (error) {
    throw new Error(`Failed to block user: ${error.message}`);
  }
}

/**
 * Unblock user account
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user object
 * @throws {Error} If update fails
 *
 * @example
 * const user = await unblockUser('user-uuid-123');
 * console.log(`User unblocked: ${!user.security.isBlocked}`);
 */
async function unblockUser(userId) {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await updateUser(userId, {
      security: {
        ...user.security,
        isBlocked: false,
        blockReason: "",
        failedLoginAttempts: 0,
        lastFailedLogin: null,
      },
    });

    return updatedUser;
  } catch (error) {
    throw new Error(`Failed to unblock user: ${error.message}`);
  }
}

/**
 * Get all users (admin only)
 *
 * @param {Object} [options] - Query options
 * @param {number} [options.limit=100] - Maximum number of users to return
 * @param {number} [options.offset=0] - Number of users to skip
 * @param {boolean} [options.includeBlocked=false] - Include blocked users
 * @returns {Promise<Object[]>} Array of user objects (without password hashes)
 * @throws {Error} If retrieval fails
 *
 * @example
 * const users = await getAllUsers({ limit: 50, includeBlocked: true });
 * console.log(`Found ${users.length} users`);
 */
async function getAllUsers(options = {}) {
  const { limit = 100, offset = 0, includeBlocked = false } = options;

  try {
    const userFiles = await listFiles(USERS_DIR, ".json");
    const users = [];

    for (const filePath of userFiles) {
      const user = await readJSONFile(filePath);

      // Skip deleted users
      if (user.timestamps && user.timestamps.deletedAt) {
        continue;
      }

      // Skip blocked users if not requested
      if (!includeBlocked && user.security && user.security.isBlocked) {
        continue;
      }

      // Remove password hash
      const { passwordHash: _, ...userResponse } = user;
      users.push(userResponse);
    }

    // Sort by creation date (newest first)
    users.sort(
      (a, b) =>
        new Date(b.timestamps.createdAt) - new Date(a.timestamps.createdAt)
    );

    // Apply pagination
    return users.slice(offset, offset + limit);
  } catch (error) {
    throw new Error(`Failed to get all users: ${error.message}`);
  }
}

/**
 * Get user statistics
 *
 * @returns {Promise<Object>} User statistics
 * @throws {Error} If retrieval fails
 *
 * @example
 * const stats = await getUserStats();
 * console.log(`Total users: ${stats.totalUsers}`);
 */
async function getUserStats() {
  try {
    const userFiles = await listFiles(USERS_DIR, ".json");
    let totalUsers = 0;
    let activeUsers = 0;
    let blockedUsers = 0;
    let verifiedUsers = 0;
    let usersWithApiKeys = 0;

    for (const filePath of userFiles) {
      const user = await readJSONFile(filePath);

      // Skip deleted users
      if (user.timestamps && user.timestamps.deletedAt) {
        continue;
      }

      totalUsers++;

      if (!user.security || !user.security.isBlocked) {
        activeUsers++;
      } else {
        blockedUsers++;
      }

      if (user.emailVerification && user.emailVerification.isVerified) {
        verifiedUsers++;
      }

      if (user.apiKey && user.apiKey.key) {
        usersWithApiKeys++;
      }
    }

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      verifiedUsers,
      usersWithApiKeys,
      blockedPercentage: totalUsers > 0 ? (blockedUsers / totalUsers) * 100 : 0,
      verifiedPercentage:
        totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
      apiKeyPercentage:
        totalUsers > 0 ? (usersWithApiKeys / totalUsers) * 100 : 0,
    };
  } catch (error) {
    throw new Error(`Failed to get user statistics: ${error.message}`);
  }
}

/**
 * Update user password
 *
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Updated user object
 * @throws {Error} If update fails
 *
 * @example
 * const user = await updateUserPassword('user-uuid-123', 'NewPassword123!');
 * console.log('Password updated successfully');
 */
async function updateUserPassword(userId, newPassword) {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  if (!newPassword || typeof newPassword !== "string") {
    throw new Error("New password is required and must be a string");
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const passwordHash = await hashPassword(newPassword);

    const updatedUser = await updateUser(userId, {
      passwordHash: passwordHash,
      security: {
        ...user.security,
        passwordResetToken: "",
        passwordResetExpiry: "",
      },
    });

    return updatedUser;
  } catch (error) {
    throw new Error(`Failed to update user password: ${error.message}`);
  }
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByApiKey,
  updateUser,
  deleteUser,
  validatePassword,
  incrementFailedLogin,
  resetFailedLoginAttempts,
  blockUser,
  unblockUser,
  getAllUsers,
  getUserStats,
  updateUserPassword,
};
