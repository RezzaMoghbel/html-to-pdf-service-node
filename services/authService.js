/**
 * Authentication Service
 *
 * Handles user authentication, registration, password management,
 * and session handling. Provides comprehensive security features
 * including failed login tracking and account blocking.
 *
 * @fileoverview User authentication and session management service
 * @author PDF Service Team
 * @version 1.0.0
 */

const {
  generateToken,
  generatePasswordResetToken: generateResetToken,
  generateEmailVerificationToken,
  generateCSRFToken,
} = require("../utils/encryption");
const {
  validateUserRegistration,
  validateEmail,
} = require("../utils/validation");
const {
  createUser,
  findUserByEmail,
  findUserById,
  validatePassword,
  incrementFailedLogin,
  resetFailedLoginAttempts,
  blockUser,
  updateUser,
  updateUserPassword,
} = require("./userService");
const { getConfig } = require("./configService");
const { listFiles, readJSONFile } = require("../utils/fileSystem");
const path = require("path");

const USERS_DIR = path.join(process.cwd(), "database", "users");

/**
 * Register a new user account
 *
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration result with user data and verification token
 * @throws {Error} If registration fails
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
 * const result = await register(userData);
 * console.log(`User registered: ${result.user.email}`);
 */
async function register(userData) {
  if (!userData || typeof userData !== "object") {
    throw new Error("User data is required and must be an object");
  }

  try {
    // Get configuration
    const config = await getConfig();

    // Check if registration is enabled
    if (!config.features.enableRegistration) {
      throw new Error("User registration is currently disabled");
    }

    // Create user account
    console.log("DEBUG: About to create user with data:", JSON.stringify(userData, null, 2));
    const user = await createUser(userData);
    console.log("DEBUG: User created successfully:", user._id);

    // Generate email verification token if enabled
    let verificationToken = null;
    if (config.emailVerificationEnabled) {
      verificationToken = generateEmailVerificationToken(user.email);

      // Update user with verification token
      await updateUser(user._id, {
        emailVerification: {
          isVerified: false,
          verificationToken: verificationToken,
          verificationExpiry: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(), // 24 hours
        },
      });
    }

    return {
      success: true,
      user: user,
      verificationToken: verificationToken,
      message: config.emailVerificationEnabled
        ? "Registration successful. Please check your email to verify your account."
        : "Registration successful. You can now log in.",
    };
  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
}

/**
 * Authenticate user login
 *
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} [ipAddress] - Client IP address
 * @returns {Promise<Object>} Login result with user data and session info
 * @throws {Error} If login fails
 *
 * @example
 * const result = await login('user@example.com', 'MyPassword123!', '192.168.1.1');
 * if (result.success) {
 *   console.log(`Login successful: ${result.user.email}`);
 * }
 */
async function login(email, password, ipAddress = null) {
  if (!email || typeof email !== "string") {
    throw new Error("Email is required and must be a string");
  }

  if (!password || typeof password !== "string") {
    throw new Error("Password is required and must be a string");
  }

  try {
    // Get configuration
    const config = await getConfig();

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check if user is blocked
    if (user.security && user.security.isBlocked) {
      throw new Error(
        `Account is blocked: ${
          user.security.blockReason || "No reason provided"
        }`
      );
    }

    // Check failed login attempts
    const maxFailedLogins = config.maxFailedLogins || 30;
    if (user.security && user.security.failedLoginAttempts >= maxFailedLogins) {
      // Auto-block user after too many failed attempts
      await blockUser(
        user._id,
        `Too many failed login attempts (${user.security.failedLoginAttempts})`
      );
      throw new Error(
        "Account has been blocked due to too many failed login attempts"
      );
    }

    // Validate password
    const isPasswordValid = await validatePassword(email, password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await incrementFailedLogin(email);
      throw new Error("Invalid email or password");
    }

    // Reset failed login attempts on successful login
    await resetFailedLoginAttempts(email);

    // Update last login timestamp
    await updateUser(user._id, {
      timestamps: {
        ...user.timestamps,
        lastLoginAt: new Date().toISOString(),
      },
    });

    // Fetch updated user data to ensure we return the latest information
    const updatedUser = await findUserById(user._id);

    // Generate session token
    const sessionToken = generateToken(32, "hex");

    // Return user data without sensitive information
    const { passwordHash: _, ...userResponse } = updatedUser;

    return {
      success: true,
      user: userResponse,
      sessionToken: sessionToken,
      message: "Login successful",
    };
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
}

/**
 * Logout user (invalidate session)
 *
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if logout successful
 * @throws {Error} If logout fails
 *
 * @example
 * const success = await logout('user-uuid-123');
 * if (success) {
 *   console.log('Logout successful');
 * }
 */
async function logout(userId) {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update last logout timestamp
    await updateUser(userId, {
      timestamps: {
        ...user.timestamps,
        lastLogoutAt: new Date().toISOString(),
      },
    });

    return true;
  } catch (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }
}

/**
 * Generate password reset token
 *
 * @param {string} email - User email
 * @returns {Promise<Object>} Reset token result
 * @throws {Error} If token generation fails
 *
 * @example
 * const result = await generatePasswordResetToken('user@example.com');
 * console.log(`Reset token generated: ${result.success}`);
 */
async function generatePasswordResetToken(email) {
  if (!email || typeof email !== "string") {
    throw new Error("Email is required and must be a string");
  }

  try {
    // Get configuration
    const config = await getConfig();

    // Check if password reset is enabled
    if (!config.features.enablePasswordReset) {
      throw new Error("Password reset is currently disabled");
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not
      return {
        success: true,
        message: "If the email exists, a password reset link has been sent.",
      };
    }

    // Check if user is blocked
    if (user.security && user.security.isBlocked) {
      throw new Error("Cannot reset password for blocked account");
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const expiryTime = new Date(Date.now() + config.passwordResetTokenExpiry);

    // Update user with reset token
    await updateUser(user._id, {
      security: {
        ...user.security,
        passwordResetToken: resetToken,
        passwordResetExpiry: expiryTime.toISOString(),
      },
    });

    return {
      success: true,
      resetToken: resetToken,
      expiryTime: expiryTime.toISOString(),
      message: "Password reset token generated successfully",
    };
  } catch (error) {
    throw new Error(`Password reset token generation failed: ${error.message}`);
  }
}

/**
 * Validate password reset token
 *
 * @param {string} token - Reset token
 * @returns {Promise<Object>} Validation result
 * @throws {Error} If validation fails
 *
 * @example
 * const result = await validateResetToken('reset-token-123');
 * if (result.isValid) {
 *   console.log('Token is valid');
 * }
 */
async function validateResetToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Reset token is required and must be a string");
  }

  try {
    // Find user by reset token
    const userFiles = await listFiles(USERS_DIR, ".json");

    for (const filePath of userFiles) {
      const user = await readJSONFile(filePath);

      if (
        user.security &&
        user.security.passwordResetToken === token &&
        user.security.passwordResetExpiry
      ) {
        // Check if token is expired
        const expiryTime = new Date(user.security.passwordResetExpiry);
        if (expiryTime > new Date()) {
          return {
            isValid: true,
            user: user,
            message: "Token is valid",
          };
        } else {
          return {
            isValid: false,
            user: null,
            message: "Reset token has expired",
          };
        }
      }
    }

    return {
      isValid: false,
      user: null,
      message: "Invalid reset token",
    };
  } catch (error) {
    throw new Error(`Reset token validation failed: ${error.message}`);
  }
}

/**
 * Reset password using token
 *
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Reset result
 * @throws {Error} If reset fails
 *
 * @example
 * const result = await resetPassword('reset-token-123', 'NewPassword123!');
 * if (result.success) {
 *   console.log('Password reset successful');
 * }
 */
async function resetPassword(token, newPassword) {
  if (!token || typeof token !== "string") {
    throw new Error("Reset token is required and must be a string");
  }

  if (!newPassword || typeof newPassword !== "string") {
    throw new Error("New password is required and must be a string");
  }

  try {
    // Validate reset token
    const validation = await validateResetToken(token);
    if (!validation.isValid) {
      throw new Error(`Invalid reset token: ${validation.message}`);
    }

    const user = validation.user;

    // Update password
    await updateUserPassword(user._id, newPassword);

    // Clear reset token
    await updateUser(user._id, {
      security: {
        ...user.security,
        passwordResetToken: "",
        passwordResetExpiry: "",
      },
    });

    return {
      success: true,
      message: "Password reset successful",
    };
  } catch (error) {
    throw new Error(`Password reset failed: ${error.message}`);
  }
}

/**
 * Reset password using security questions (DOB and postcode)
 *
 * @param {string} email - User email
 * @param {string} dob - Date of birth (DD/MM/YYYY)
 * @param {string} postcode - User postcode
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Reset result
 * @throws {Error} If reset fails
 *
 * @example
 * const result = await resetPasswordSecure('user@example.com', '15/03/1990', 'SW1A 1AA', 'NewPassword123!');
 * if (result.success) {
 *   console.log('Password reset successful');
 * }
 */
async function resetPasswordSecure(email, dob, postcode, newPassword) {
  if (!email || typeof email !== "string") {
    throw new Error("Email is required and must be a string");
  }

  if (!dob || typeof dob !== "string") {
    throw new Error("Date of birth is required and must be a string");
  }

  if (!postcode || typeof postcode !== "string") {
    throw new Error("Postcode is required and must be a string");
  }

  if (!newPassword || typeof newPassword !== "string") {
    throw new Error("New password is required and must be a string");
  }

  try {
    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is blocked
    if (user.security && user.security.isBlocked) {
      throw new Error("Cannot reset password for blocked account");
    }

    // Verify security information
    if (user.profile.dob !== dob.trim()) {
      throw new Error("Invalid date of birth");
    }

    if (user.profile.address.postcode !== postcode.trim().toUpperCase()) {
      throw new Error("Invalid postcode");
    }

    // Update password
    await updateUserPassword(user._id, newPassword);

    return {
      success: true,
      message: "Password reset successful",
    };
  } catch (error) {
    throw new Error(`Secure password reset failed: ${error.message}`);
  }
}

/**
 * Send email verification (if enabled)
 *
 * @param {string} email - User email
 * @returns {Promise<Object>} Verification result
 * @throws {Error} If verification fails
 *
 * @example
 * const result = await sendVerificationEmail('user@example.com');
 * console.log(`Verification email sent: ${result.success}`);
 */
async function sendVerificationEmail(email) {
  if (!email || typeof email !== "string") {
    throw new Error("Email is required and must be a string");
  }

  try {
    // Get configuration
    const config = await getConfig();

    // Check if email verification is enabled
    if (
      !config.emailVerificationEnabled ||
      !config.features.enableEmailVerification
    ) {
      throw new Error("Email verification is not enabled");
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if already verified
    if (user.emailVerification && user.emailVerification.isVerified) {
      throw new Error("Email is already verified");
    }

    // Generate verification token
    const verificationToken = generateEmailVerificationToken(email);

    // Update user with verification token
    await updateUser(user._id, {
      emailVerification: {
        isVerified: false,
        verificationToken: verificationToken,
        verificationExpiry: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(), // 24 hours
      },
    });

    return {
      success: true,
      verificationToken: verificationToken,
      message: "Verification email sent successfully",
    };
  } catch (error) {
    throw new Error(`Email verification failed: ${error.message}`);
  }
}

/**
 * Verify email using token
 *
 * @param {string} token - Verification token
 * @returns {Promise<Object>} Verification result
 * @throws {Error} If verification fails
 *
 * @example
 * const result = await verifyEmail('verification-token-123');
 * if (result.success) {
 *   console.log('Email verified successfully');
 * }
 */
async function verifyEmail(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Verification token is required and must be a string");
  }

  try {
    // Find user by verification token
    const userFiles = await listFiles(USERS_DIR, ".json");

    for (const filePath of userFiles) {
      const user = await readJSONFile(filePath);

      if (
        user.emailVerification &&
        user.emailVerification.verificationToken === token &&
        user.emailVerification.verificationExpiry
      ) {
        // Check if token is expired
        const expiryTime = new Date(user.emailVerification.verificationExpiry);
        if (expiryTime > new Date()) {
          // Mark email as verified
          await updateUser(user._id, {
            emailVerification: {
              isVerified: true,
              verificationToken: "",
              verificationExpiry: "",
            },
          });

          return {
            success: true,
            message: "Email verified successfully",
          };
        } else {
          return {
            success: false,
            message: "Verification token has expired",
          };
        }
      }
    }

    return {
      success: false,
      message: "Invalid verification token",
    };
  } catch (error) {
    throw new Error(`Email verification failed: ${error.message}`);
  }
}

/**
 * Refresh user session
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Session refresh result
 * @throws {Error} If refresh fails
 *
 * @example
 * const result = await refreshSession('user-uuid-123');
 * if (result.success) {
 *   console.log('Session refreshed');
 * }
 */
async function refreshSession(userId) {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is blocked
    if (user.security && user.security.isBlocked) {
      throw new Error("Cannot refresh session for blocked user");
    }

    // Generate new session token
    const sessionToken = generateToken(32, "hex");

    // Update last activity timestamp
    await updateUser(userId, {
      timestamps: {
        ...user.timestamps,
        lastActivityAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      sessionToken: sessionToken,
      user: user,
      message: "Session refreshed successfully",
    };
  } catch (error) {
    throw new Error(`Session refresh failed: ${error.message}`);
  }
}

/**
 * Change user password (authenticated user)
 *
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Password change result
 * @throws {Error} If password change fails
 *
 * @example
 * const result = await changePassword('user-uuid-123', 'OldPassword123!', 'NewPassword123!');
 * if (result.success) {
 *   console.log('Password changed successfully');
 * }
 */
async function changePassword(userId, currentPassword, newPassword) {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  if (!currentPassword || typeof currentPassword !== "string") {
    throw new Error("Current password is required and must be a string");
  }

  if (!newPassword || typeof newPassword !== "string") {
    throw new Error("New password is required and must be a string");
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await validatePassword(
      user.email,
      currentPassword
    );
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Update password
    await updateUserPassword(userId, newPassword);

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    throw new Error(`Password change failed: ${error.message}`);
  }
}

module.exports = {
  register,
  login,
  logout,
  generatePasswordResetToken,
  validateResetToken,
  resetPassword,
  resetPasswordSecure,
  sendVerificationEmail,
  verifyEmail,
  refreshSession,
  changePassword,
};
