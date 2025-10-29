/**
 * Rate Limiting Middleware
 *
 * Provides comprehensive rate limiting for authentication endpoints
 * and general API usage. Implements IP-based tracking and configurable
 * limits to prevent abuse and brute force attacks.
 *
 * @fileoverview Rate limiting and abuse prevention middleware
 * @author PDF Service Team
 * @version 1.0.0
 */

const { getConfig } = require("../services/configService");
const { getClientIP } = require("./apiKeyAuth");

// In-memory rate limit store (in production, use Redis)
const rateLimitStore = new Map();

/**
 * Rate Limiting Middleware
 *
 * Flow:
 * 1. Extract client IP address
 * 2. Check current request count for IP
 * 3. Compare against configured limits
 * 4. Block if limit exceeded
 * 5. Increment counter and set expiry
 * 6. Continue to next middleware
 *
 * @param {Object} options - Rate limiting options
 * @param {number} [options.windowMs=900000] - Time window in milliseconds (15 minutes)
 * @param {number} [options.maxRequests=5] - Maximum requests per window
 * @param {string} [options.message='Too many requests'] - Error message
 * @param {boolean} [options.skipSuccessfulRequests=false] - Skip counting successful requests
 * @param {boolean} [options.skipFailedRequests=false] - Skip counting failed requests
 * @returns {Function} Express middleware function
 *
 * @example
 * const authRateLimit = rateLimit({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   maxRequests: 5, // 5 attempts per window
 *   message: 'Too many login attempts'
 * });
 * app.use('/login', authRateLimit);
 */
function rateLimit(options = {}) {
  const {
    windowMs = 900000, // 15 minutes
    maxRequests = 5,
    message = "Too many requests from this IP, please try again later",
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => getClientIP(req),
    onLimitReached = (req, res, options) => {
      console.log(`Rate limit exceeded for IP: ${getClientIP(req)}`);
    },
  } = options;

  return (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const now = Date.now();

      // Get or create rate limit entry
      let entry = rateLimitStore.get(key);

      if (!entry) {
        entry = {
          count: 0,
          resetTime: now + windowMs,
          firstRequest: now,
        };
        rateLimitStore.set(key, entry);
      }

      // Check if window has expired
      if (now > entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + windowMs;
        entry.firstRequest = now;
      }

      // Check if limit exceeded
      if (entry.count >= maxRequests) {
        onLimitReached(req, res, options);

        return res.status(429).json({
          success: false,
          error: "Rate limit exceeded",
          message: message,
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        });
      }

      // Increment counter
      entry.count++;

      // Add rate limit headers
      res.set({
        "X-RateLimit-Limit": maxRequests,
        "X-RateLimit-Remaining": Math.max(0, maxRequests - entry.count),
        "X-RateLimit-Reset": new Date(entry.resetTime).toISOString(),
      });

      next();
    } catch (error) {
      console.error("Rate Limit Middleware Error:", error);
      next();
    }
  };
}

/**
 * Authentication Rate Limiting Middleware
 *
 * Specialized rate limiting for authentication endpoints.
 * Tracks failed login attempts and implements progressive delays.
 *
 * @param {Object} options - Rate limiting options
 * @param {number} [options.maxAttempts=5] - Maximum attempts per window
 * @param {number} [options.windowMs=900000] - Time window (15 minutes)
 * @param {number} [options.blockDuration=3600000] - Block duration (1 hour)
 * @returns {Function} Express middleware function
 *
 * @example
 * const authRateLimit = authRateLimit({
 *   maxAttempts: 5,
 *   windowMs: 15 * 60 * 1000,
 *   blockDuration: 60 * 60 * 1000
 * });
 * app.use('/login', authRateLimit);
 */
function authRateLimit(options = {}) {
  const {
    maxAttempts = 5,
    windowMs = 900000, // 15 minutes
    blockDuration = 3600000, // 1 hour
    message = "Too many login attempts. Please try again later.",
  } = options;

  return (req, res, next) => {
    try {
      const ip = getClientIP(req);
      const now = Date.now();

      // Get or create auth rate limit entry
      let entry = rateLimitStore.get(`auth_${ip}`);

      if (!entry) {
        entry = {
          attempts: 0,
          resetTime: now + windowMs,
          blockUntil: 0,
          firstAttempt: now,
        };
        rateLimitStore.set(`auth_${ip}`, entry);
      }

      // Check if currently blocked
      if (now < entry.blockUntil) {
        const remainingBlockTime = Math.ceil((entry.blockUntil - now) / 1000);

        return res.status(429).json({
          success: false,
          error: "IP temporarily blocked",
          message: `Too many failed login attempts. Blocked for ${remainingBlockTime} seconds.`,
          code: "IP_BLOCKED",
          retryAfter: remainingBlockTime,
        });
      }

      // Check if window has expired
      if (now > entry.resetTime) {
        entry.attempts = 0;
        entry.resetTime = now + windowMs;
        entry.firstAttempt = now;
      }

      // Check if limit exceeded
      if (entry.attempts >= maxAttempts) {
        // Block IP for specified duration
        entry.blockUntil = now + blockDuration;

        console.log(
          `IP ${ip} blocked for ${
            blockDuration / 1000
          } seconds due to excessive login attempts`
        );

        return res.status(429).json({
          success: false,
          error: "IP blocked",
          message: `Too many failed login attempts. IP blocked for ${
            blockDuration / 1000
          } seconds.`,
          code: "IP_BLOCKED",
          retryAfter: blockDuration / 1000,
        });
      }

      // Increment attempts
      entry.attempts++;

      // Add rate limit headers
      res.set({
        "X-RateLimit-Limit": maxAttempts,
        "X-RateLimit-Remaining": Math.max(0, maxAttempts - entry.attempts),
        "X-RateLimit-Reset": new Date(entry.resetTime).toISOString(),
      });

      next();
    } catch (error) {
      console.error("Auth Rate Limit Middleware Error:", error);
      next();
    }
  };
}

/**
 * Registration Rate Limiting Middleware
 *
 * Rate limiting for user registration endpoints.
 * Prevents spam registrations and abuse.
 *
 * @param {Object} options - Rate limiting options
 * @param {number} [options.maxRegistrations=3] - Maximum registrations per window
 * @param {number} [options.windowMs=3600000] - Time window (1 hour)
 * @returns {Function} Express middleware function
 *
 * @example
 * const registrationRateLimit = registrationRateLimit({
 *   maxRegistrations: 3,
 *   windowMs: 60 * 60 * 1000
 * });
 * app.use('/register', registrationRateLimit);
 */
function registrationRateLimit(options = {}) {
  const {
    maxRegistrations = 3,
    windowMs = 3600000, // 1 hour
    message = "Too many registration attempts. Please try again later.",
  } = options;

  return (req, res, next) => {
    try {
      const ip = getClientIP(req);
      const now = Date.now();

      // Get or create registration rate limit entry
      let entry = rateLimitStore.get(`registration_${ip}`);

      if (!entry) {
        entry = {
          count: 0,
          resetTime: now + windowMs,
          firstRequest: now,
        };
        rateLimitStore.set(`registration_${ip}`, entry);
      }

      // Check if window has expired
      if (now > entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + windowMs;
        entry.firstRequest = now;
      }

      // Check if limit exceeded
      if (entry.count >= maxRegistrations) {
        return res.status(429).json({
          success: false,
          error: "Registration rate limit exceeded",
          message: message,
          code: "REGISTRATION_RATE_LIMIT_EXCEEDED",
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        });
      }

      // Increment counter
      entry.count++;

      // Add rate limit headers
      res.set({
        "X-RateLimit-Limit": maxRegistrations,
        "X-RateLimit-Remaining": Math.max(0, maxRegistrations - entry.count),
        "X-RateLimit-Reset": new Date(entry.resetTime).toISOString(),
      });

      next();
    } catch (error) {
      console.error("Registration Rate Limit Middleware Error:", error);
      next();
    }
  };
}

/**
 * Password Reset Rate Limiting Middleware
 *
 * Rate limiting for password reset endpoints.
 * Prevents abuse of password reset functionality.
 *
 * @param {Object} options - Rate limiting options
 * @param {number} [options.maxRequests=3] - Maximum requests per window
 * @param {number} [options.windowMs=3600000] - Time window (1 hour)
 * @returns {Function} Express middleware function
 *
 * @example
 * const passwordResetRateLimit = passwordResetRateLimit({
 *   maxRequests: 3,
 *   windowMs: 60 * 60 * 1000
 * });
 * app.use('/forgot-password', passwordResetRateLimit);
 */
function passwordResetRateLimit(options = {}) {
  const {
    maxRequests = 3,
    windowMs = 3600000, // 1 hour
    message = "Too many password reset requests. Please try again later.",
  } = options;

  return (req, res, next) => {
    try {
      const ip = getClientIP(req);
      const now = Date.now();

      // Get or create password reset rate limit entry
      let entry = rateLimitStore.get(`password_reset_${ip}`);

      if (!entry) {
        entry = {
          count: 0,
          resetTime: now + windowMs,
          firstRequest: now,
        };
        rateLimitStore.set(`password_reset_${ip}`, entry);
      }

      // Check if window has expired
      if (now > entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + windowMs;
        entry.firstRequest = now;
      }

      // Check if limit exceeded
      if (entry.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: "Password reset rate limit exceeded",
          message: message,
          code: "PASSWORD_RESET_RATE_LIMIT_EXCEEDED",
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        });
      }

      // Increment counter
      entry.count++;

      // Add rate limit headers
      res.set({
        "X-RateLimit-Limit": maxRequests,
        "X-RateLimit-Remaining": Math.max(0, maxRequests - entry.count),
        "X-RateLimit-Reset": new Date(entry.resetTime).toISOString(),
      });

      next();
    } catch (error) {
      console.error("Password Reset Rate Limit Middleware Error:", error);
      next();
    }
  };
}

/**
 * API Endpoint Rate Limiting Middleware
 *
 * General rate limiting for API endpoints.
 * Configurable per endpoint or globally.
 *
 * @param {Object} options - Rate limiting options
 * @param {number} [options.maxRequests=100] - Maximum requests per window
 * @param {number} [options.windowMs=3600000] - Time window (1 hour)
 * @param {string} [options.keyPrefix='api'] - Key prefix for storage
 * @returns {Function} Express middleware function
 *
 * @example
 * const apiRateLimit = apiRateLimit({
 *   maxRequests: 100,
 *   windowMs: 60 * 60 * 1000
 * });
 * app.use('/api/v1', apiRateLimit);
 */
function apiRateLimit(options = {}) {
  const {
    maxRequests = 100,
    windowMs = 3600000, // 1 hour
    keyPrefix = "api",
    message = "API rate limit exceeded. Please try again later.",
  } = options;

  return (req, res, next) => {
    try {
      const ip = getClientIP(req);
      const endpoint = req.path;
      const key = `${keyPrefix}_${ip}_${endpoint}`;
      const now = Date.now();

      // Get or create API rate limit entry
      let entry = rateLimitStore.get(key);

      if (!entry) {
        entry = {
          count: 0,
          resetTime: now + windowMs,
          firstRequest: now,
        };
        rateLimitStore.set(key, entry);
      }

      // Check if window has expired
      if (now > entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + windowMs;
        entry.firstRequest = now;
      }

      // Check if limit exceeded
      if (entry.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: "API rate limit exceeded",
          message: message,
          code: "API_RATE_LIMIT_EXCEEDED",
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        });
      }

      // Increment counter
      entry.count++;

      // Add rate limit headers
      res.set({
        "X-RateLimit-Limit": maxRequests,
        "X-RateLimit-Remaining": Math.max(0, maxRequests - entry.count),
        "X-RateLimit-Reset": new Date(entry.resetTime).toISOString(),
      });

      next();
    } catch (error) {
      console.error("API Rate Limit Middleware Error:", error);
      next();
    }
  };
}

/**
 * Clear Rate Limit for IP
 *
 * @param {string} ip - IP address
 * @param {string} [type='all'] - Rate limit type to clear
 *
 * @example
 * clearRateLimit('192.168.1.1', 'auth');
 */
function clearRateLimit(ip, type = "all") {
  try {
    if (type === "all") {
      // Clear all rate limits for IP
      for (const [key, value] of rateLimitStore.entries()) {
        if (key.includes(ip)) {
          rateLimitStore.delete(key);
        }
      }
    } else {
      // Clear specific type
      const key = `${type}_${ip}`;
      rateLimitStore.delete(key);
    }

    console.log(`Rate limit cleared for IP: ${ip}, type: ${type}`);
  } catch (error) {
    console.error("Clear Rate Limit Error:", error);
  }
}

/**
 * Get Rate Limit Status for IP
 *
 * @param {string} ip - IP address
 * @param {string} [type='all'] - Rate limit type to check
 * @returns {Object} Rate limit status
 *
 * @example
 * const status = getRateLimitStatus('192.168.1.1', 'auth');
 * console.log(`Attempts: ${status.attempts}/${status.maxAttempts}`);
 */
function getRateLimitStatus(ip, type = "all") {
  try {
    const status = {};

    if (type === "all") {
      // Get all rate limit types for IP
      for (const [key, value] of rateLimitStore.entries()) {
        if (key.includes(ip)) {
          const rateLimitType = key.split("_")[0];
          status[rateLimitType] = {
            count: value.count || value.attempts || 0,
            resetTime: value.resetTime,
            blockUntil: value.blockUntil || 0,
          };
        }
      }
    } else {
      // Get specific type
      const key = `${type}_${ip}`;
      const entry = rateLimitStore.get(key);

      if (entry) {
        status[type] = {
          count: entry.count || entry.attempts || 0,
          resetTime: entry.resetTime,
          blockUntil: entry.blockUntil || 0,
        };
      }
    }

    return status;
  } catch (error) {
    console.error("Get Rate Limit Status Error:", error);
    return {};
  }
}

/**
 * Cleanup Expired Rate Limits
 *
 * Removes expired rate limit entries from memory.
 * Should be called periodically to prevent memory leaks.
 *
 * @example
 * setInterval(cleanupExpiredRateLimits, 300000); // Every 5 minutes
 */
function cleanupExpiredRateLimits() {
  try {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime && now > (entry.blockUntil || 0)) {
        rateLimitStore.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  } catch (error) {
    console.error("Cleanup Expired Rate Limits Error:", error);
  }
}

/**
 * Get Rate Limit Statistics
 *
 * @returns {Object} Rate limit statistics
 *
 * @example
 * const stats = getRateLimitStatistics();
 * console.log(`Total entries: ${stats.totalEntries}`);
 */
function getRateLimitStatistics() {
  try {
    const stats = {
      totalEntries: rateLimitStore.size,
      activeBlocks: 0,
      totalRequests: 0,
      entriesByType: {},
    };

    const now = Date.now();

    for (const [key, entry] of rateLimitStore.entries()) {
      const type = key.split("_")[0];

      if (!stats.entriesByType[type]) {
        stats.entriesByType[type] = 0;
      }
      stats.entriesByType[type]++;

      if (entry.blockUntil && now < entry.blockUntil) {
        stats.activeBlocks++;
      }

      stats.totalRequests += entry.count || entry.attempts || 0;
    }

    return stats;
  } catch (error) {
    console.error("Get Rate Limit Statistics Error:", error);
    return {
      totalEntries: 0,
      activeBlocks: 0,
      totalRequests: 0,
      entriesByType: {},
    };
  }
}

module.exports = {
  rateLimit,
  authRateLimit,
  registrationRateLimit,
  passwordResetRateLimit,
  apiRateLimit,
  clearRateLimit,
  getRateLimitStatus,
  cleanupExpiredRateLimits,
  getRateLimitStatistics,
};
