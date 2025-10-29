/**
 * API Key Service
 *
 * Manages API key generation, validation, and usage tracking.
 * Provides rate limiting and usage analytics for API keys.
 *
 * @fileoverview API key management and usage tracking service
 * @author PDF Service Team
 * @version 1.0.0
 */

const { generateApiKey, generateToken } = require("../utils/encryption");
const { validateApiKey } = require("../utils/validation");
const { findUserByApiKey, updateUser, findUserById } = require("./userService");
const { getConfig } = require("./configService");

/**
 * Generate a new API key for a user
 *
 * @param {string} userId - User ID
 * @returns {Promise<string>} Generated API key
 * @throws {Error} If generation fails or user not found
 *
 * @example
 * const apiKey = await generateApiKeyForUser('user-uuid-123');
 * console.log(`Generated API key: ${apiKey}`);
 */
async function generateApiKeyForUser(userId) {
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
      throw new Error("Cannot generate API key for blocked user");
    }

    // Get configuration
    const config = await getConfig();
    const apiKeyPrefix = config.apiKeyPrefix || "sk_live_";
    const apiKeyLength = config.apiKeyLength || 32;

    // Generate new API key
    const newApiKey = generateApiKey(apiKeyPrefix, apiKeyLength);

    // Update user with new API key
    const apiKeyData = {
      key: newApiKey,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      isActive: true
    };

    await updateUser(userId, {
      apiKey: apiKeyData,
    });

    return apiKeyData;
  } catch (error) {
    throw new Error(`Failed to generate API key: ${error.message}`);
  }
}

/**
 * Regenerate API key for a user (invalidates old key)
 *
 * @param {string} userId - User ID
 * @returns {Promise<string>} New API key
 * @throws {Error} If regeneration fails or user not found
 *
 * @example
 * const newApiKey = await regenerateApiKey('user-uuid-123');
 * console.log(`Regenerated API key: ${newApiKey}`);
 */
async function regenerateApiKey(userId) {
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
      throw new Error("Cannot regenerate API key for blocked user");
    }

    // Generate new API key (this will replace the old one)
    return await generateApiKeyForUser(userId);
  } catch (error) {
    throw new Error(`Failed to regenerate API key: ${error.message}`);
  }
}

/**
 * Validate API key format and existence
 *
 * @param {string} apiKey - API key to validate
 * @returns {Promise<Object>} Validation result with isValid, user, and error
 * @throws {Error} If validation fails
 *
 * @example
 * const result = await validateApiKeyFormat('sk_live_...');
 * if (result.isValid) {
 *   console.log(`Valid API key for user: ${result.user.email}`);
 * }
 */
async function validateApiKeyFormat(apiKey) {
  if (!apiKey || typeof apiKey !== "string") {
    return {
      isValid: false,
      user: null,
      error: "API key is required and must be a string",
    };
  }

  try {
    // Get configuration for validation
    const config = await getConfig();
    const apiKeyPrefix = config.apiKeyPrefix || "sk_live_";

    // Validate format
    const formatValidation = validateApiKey(apiKey, apiKeyPrefix);
    if (!formatValidation.isValid) {
      return {
        isValid: false,
        user: null,
        error: formatValidation.error,
      };
    }

    // Find user by API key
    const user = await findUserByApiKey(apiKey);
    if (!user) {
      return {
        isValid: false,
        user: null,
        error: "API key not found",
      };
    }

    // Check if user is blocked
    if (user.security && user.security.isBlocked) {
      return {
        isValid: false,
        user: null,
        error: "User account is blocked",
      };
    }

    return {
      isValid: true,
      user: user,
      error: null,
    };
  } catch (error) {
    return {
      isValid: false,
      user: null,
      error: `API key validation failed: ${error.message}`,
    };
  }
}

/**
 * Track API usage for a user
 *
 * @param {string} apiKey - API key
 * @param {string} ipAddress - Client IP address
 * @returns {Promise<Object>} Updated usage statistics
 * @throws {Error} If tracking fails
 *
 * @example
 * const usage = await trackApiUsage('sk_live_...', '192.168.1.1');
 * console.log(`Total requests: ${usage.totalRequests}`);
 */
async function trackApiUsage(apiKey, ipAddress) {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("API key is required and must be a string");
  }

  if (!ipAddress || typeof ipAddress !== "string") {
    throw new Error("IP address is required and must be a string");
  }

  try {
    // Validate API key and get user
    const validation = await validateApiKeyFormat(apiKey);
    if (!validation.isValid) {
      throw new Error(`Invalid API key: ${validation.error}`);
    }

    const user = validation.user;
    const userId = user._id;

    // Update API key last used timestamp
    await updateUser(userId, {
      apiKey: {
        ...user.apiKey,
        lastUsedAt: new Date().toISOString(),
      },
    });

    // Update usage statistics
    const currentUsage = user.usage || { totalRequests: 0, requestsByIP: [] };
    const requestsByIP = currentUsage.requestsByIP || [];

    // Find existing IP entry or create new one
    let ipEntry = requestsByIP.find((entry) => entry.ip === ipAddress);
    if (ipEntry) {
      ipEntry.count += 1;
      ipEntry.lastRequest = new Date().toISOString();
    } else {
      requestsByIP.push({
        ip: ipAddress,
        count: 1,
        lastRequest: new Date().toISOString(),
      });
    }

    // Update user with new usage data
    const updatedUser = await updateUser(userId, {
      usage: {
        ...currentUsage,
        totalRequests: currentUsage.totalRequests + 1,
        requestsByIP: requestsByIP,
      },
    });

    return updatedUser.usage;
  } catch (error) {
    throw new Error(`Failed to track API usage: ${error.message}`);
  }
}

/**
 * Get rate limit status for a user
 *
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} Rate limit status
 * @throws {Error} If status retrieval fails
 *
 * @example
 * const status = await getRateLimitStatus('sk_live_...');
 * console.log(`Requests used: ${status.used}/${status.limit}`);
 */
async function getRateLimitStatus(apiKey) {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("API key is required and must be a string");
  }

  try {
    // Validate API key and get user
    const validation = await validateApiKeyFormat(apiKey);
    if (!validation.isValid) {
      throw new Error(`Invalid API key: ${validation.error}`);
    }

    const user = validation.user;
    const usage = user.usage || {
      totalRequests: 0,
      rateLimit: 1000,
      rateLimitPeriod: "day",
    };

    // Get configuration
    const config = await getConfig();
    const rateLimitPeriods = config.rateLimitPeriods || {
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000,
    };

    const periodMs =
      rateLimitPeriods[usage.rateLimitPeriod] || rateLimitPeriods.day;
    const periodStart = new Date(Date.now() - periodMs);

    // Count requests in current period
    let requestsInPeriod = 0;
    if (usage.requestsByIP && Array.isArray(usage.requestsByIP)) {
      for (const ipEntry of usage.requestsByIP) {
        if (new Date(ipEntry.lastRequest) > periodStart) {
          requestsInPeriod += ipEntry.count;
        }
      }
    }

    const limit = usage.rateLimit || config.defaultRateLimit || 1000;
    const used = Math.min(requestsInPeriod, limit);
    const remaining = Math.max(0, limit - used);
    const resetTime = new Date(Date.now() + periodMs);

    return {
      limit: limit,
      used: used,
      remaining: remaining,
      period: usage.rateLimitPeriod,
      resetTime: resetTime.toISOString(),
      isExceeded: used >= limit,
    };
  } catch (error) {
    throw new Error(`Failed to get rate limit status: ${error.message}`);
  }
}

/**
 * Check if rate limit is exceeded
 *
 * @param {string} apiKey - API key
 * @returns {Promise<boolean>} True if rate limit is exceeded
 * @throws {Error} If check fails
 *
 * @example
 * const isExceeded = await isRateLimitExceeded('sk_live_...');
 * if (isExceeded) {
 *   console.log('Rate limit exceeded');
 * }
 */
async function isRateLimitExceeded(apiKey) {
  try {
    const status = await getRateLimitStatus(apiKey);
    return status.isExceeded;
  } catch (error) {
    throw new Error(`Failed to check rate limit: ${error.message}`);
  }
}

/**
 * Reset rate limit for a user
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user object
 * @throws {Error} If reset fails
 *
 * @example
 * const user = await resetRateLimit('user-uuid-123');
 * console.log('Rate limit reset successfully');
 */
async function resetRateLimit(userId) {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Reset usage statistics
    const updatedUser = await updateUser(userId, {
      usage: {
        ...user.usage,
        totalRequests: 0,
        requestsByIP: [],
      },
    });

    return updatedUser;
  } catch (error) {
    throw new Error(`Failed to reset rate limit: ${error.message}`);
  }
}

/**
 * Delete API key for a user
 *
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if API key was deleted
 * @throws {Error} If deletion fails
 *
 * @example
 * const deleted = await deleteApiKey('user-uuid-123');
 * if (deleted) {
 *   console.log('API key deleted successfully');
 * }
 */
async function deleteApiKey(userId) {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Remove API key
    await updateUser(userId, {
      apiKey: {
        key: null,
        createdAt: null,
        lastUsedAt: null,
      },
    });

    return true;
  } catch (error) {
    throw new Error(`Failed to delete API key: ${error.message}`);
  }
}

/**
 * Get API key information for a user
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} API key information or null if no key
 * @throws {Error} If retrieval fails
 *
 * @example
 * const apiKeyInfo = await getApiKeyInfo('user-uuid-123');
 * if (apiKeyInfo) {
 *   console.log(`API key created: ${apiKeyInfo.createdAt}`);
 * }
 */
async function getApiKeyInfo(userId) {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.apiKey || !user.apiKey.key) {
      return null;
    }

    return {
      key: user.apiKey.key,
      createdAt: user.apiKey.createdAt,
      lastUsedAt: user.apiKey.lastUsedAt,
      maskedKey: maskApiKey(user.apiKey.key),
    };
  } catch (error) {
    throw new Error(`Failed to get API key info: ${error.message}`);
  }
}

/**
 * Mask API key for display purposes
 *
 * @param {string} apiKey - API key to mask
 * @returns {string} Masked API key
 *
 * @example
 * const masked = maskApiKey('sk_live_example_key_replace');
 * console.log(`Masked key: ${masked}`);
 */
function maskApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== "string") {
    return "";
  }

  if (apiKey.length < 8) {
    return "••••••••";
  }

  const prefix = apiKey.substring(0, 8);
  const suffix = apiKey.substring(apiKey.length - 4);
  const middle = "•".repeat(Math.max(8, apiKey.length - 12));

  return `${prefix}${middle}${suffix}`;
}

/**
 * Get usage statistics for a user
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Usage statistics
 * @throws {Error} If retrieval fails
 *
 * @example
 * const stats = await getUserUsageStats('user-uuid-123');
 * console.log(`Total requests: ${stats.totalRequests}`);
 */
async function getUserUsageStats(userId) {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const usage = user.usage || { totalRequests: 0, requestsByIP: [] };
    const requestsByIP = usage.requestsByIP || [];

    // Calculate statistics
    const totalRequests = usage.totalRequests || 0;
    const uniqueIPs = requestsByIP.length;
    const topIPs = requestsByIP.sort((a, b) => b.count - a.count).slice(0, 10);

    // Calculate requests by time period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(
      today.getTime() - today.getDay() * 24 * 60 * 60 * 1000
    );
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let requestsToday = 0;
    let requestsThisWeek = 0;
    let requestsThisMonth = 0;

    for (const ipEntry of requestsByIP) {
      const lastRequest = new Date(ipEntry.lastRequest);

      if (lastRequest >= today) {
        requestsToday += ipEntry.count;
      }
      if (lastRequest >= thisWeek) {
        requestsThisWeek += ipEntry.count;
      }
      if (lastRequest >= thisMonth) {
        requestsThisMonth += ipEntry.count;
      }
    }

    return {
      totalRequests,
      requestsToday,
      requestsThisWeek,
      requestsThisMonth,
      uniqueIPs,
      topIPs,
      rateLimit: usage.rateLimit || 1000,
      rateLimitPeriod: usage.rateLimitPeriod || "day",
    };
  } catch (error) {
    throw new Error(`Failed to get user usage stats: ${error.message}`);
  }
}

/**
 * Update user rate limit settings
 *
 * @param {string} userId - User ID
 * @param {number} limit - New rate limit
 * @param {string} period - Rate limit period
 * @returns {Promise<Object>} Updated user object
 * @throws {Error} If update fails
 *
 * @example
 * const user = await updateUserRateLimit('user-uuid-123', 2000, 'day');
 * console.log(`Rate limit updated: ${user.usage.rateLimit}`);
 */
async function updateUserRateLimit(userId, limit, period) {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required and must be a string");
  }

  if (typeof limit !== "number" || limit < 1) {
    throw new Error("Rate limit must be a positive number");
  }

  const validPeriods = ["hour", "day", "week", "month"];
  if (!validPeriods.includes(period)) {
    throw new Error(
      `Rate limit period must be one of: ${validPeriods.join(", ")}`
    );
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await updateUser(userId, {
      usage: {
        ...user.usage,
        rateLimit: limit,
        rateLimitPeriod: period,
      },
    });

    return updatedUser;
  } catch (error) {
    throw new Error(`Failed to update user rate limit: ${error.message}`);
  }
}

module.exports = {
  generateApiKeyForUser,
  regenerateApiKey,
  validateApiKeyFormat,
  trackApiUsage,
  getRateLimitStatus,
  isRateLimitExceeded,
  resetRateLimit,
  deleteApiKey,
  getApiKeyInfo,
  maskApiKey,
  getUserUsageStats,
  updateUserRateLimit,
};
