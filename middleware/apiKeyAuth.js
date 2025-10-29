/**
 * API Key Authentication Middleware
 *
 * Validates API keys and tracks usage for all protected endpoints.
 * Provides comprehensive security checks including rate limiting,
 * user blocking, and usage tracking.
 *
 * @fileoverview API key authentication and usage tracking middleware
 * @author PDF Service Team
 * @version 1.0.0
 */

const {
  validateApiKeyFormat,
  trackApiUsage,
  isRateLimitExceeded,
} = require("../services/apiKeyService");
const { getConfig } = require("../services/configService");

/**
 * API Key Authentication Middleware
 *
 * Flow:
 * 1. Extract API key from X-API-Key header or Authorization: Bearer <key>
 * 2. Validate key format (sk_live_...)
 * 3. Find user by API key
 * 4. Check if user account is blocked
 * 5. Check rate limits (requests per period)
 * 6. Track usage (increment counter, log IP)
 * 7. Attach user data to req.user
 * 8. Continue to next middleware
 *
 * Error Responses:
 * - 401: Missing or invalid API key
 * - 403: Account blocked or rate limit exceeded
 * - 500: Server error
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 *
 * @example
 * app.use('/api/v1', apiKeyAuth);
 *
 * // In route handler:
 * app.get('/api/v1/protected', (req, res) => {
 *   console.log(`User: ${req.user.email}`);
 *   res.json({ message: 'Access granted' });
 * });
 */
async function apiKeyAuth(req, res, next) {
  try {
    // Step 1: Extract API key from headers
    let apiKey = null;

    // Check X-API-Key header first
    if (req.headers["x-api-key"]) {
      apiKey = req.headers["x-api-key"];
    }
    // Check Authorization header (Bearer token)
    else if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    // Check query parameter (less secure, for testing only)
    else if (req.query.apiKey) {
      apiKey = req.query.apiKey;
    }

    // Step 2: Validate API key presence
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: "API key required",
        message:
          "Please provide an API key in the X-API-Key header or Authorization header",
        code: "MISSING_API_KEY",
      });
    }

    // Step 3: Validate API key format and find user
    const validation = await validateApiKeyFormat(apiKey);
    if (!validation.isValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
        message: validation.error,
        code: "INVALID_API_KEY",
      });
    }

    const user = validation.user;

    // Step 4: Check if user account is blocked
    if (user.security && user.security.isBlocked) {
      return res.status(403).json({
        success: false,
        error: "Account blocked",
        message: `Your account has been blocked: ${
          user.security.blockReason || "No reason provided"
        }`,
        code: "ACCOUNT_BLOCKED",
      });
    }

    // Step 5: Check rate limits
    const rateLimitExceeded = await isRateLimitExceeded(apiKey);
    if (rateLimitExceeded) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        message:
          "You have exceeded your API rate limit. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
      });
    }

    // Step 6: Track API usage
    const clientIP = getClientIP(req);
    await trackApiUsage(apiKey, clientIP);

    // Step 7: Attach user data to request object
    req.user = {
      _id: user._id,
      email: user.email,
      profile: user.profile,
      apiKey: {
        key: user.apiKey.key,
        createdAt: user.apiKey.createdAt,
        lastUsedAt: user.apiKey.lastUsedAt,
      },
      usage: user.usage,
      timestamps: user.timestamps,
    };

    // Step 8: Add request metadata
    req.apiKey = apiKey;
    req.clientIP = clientIP;
    req.requestId = generateRequestId();

    // Continue to next middleware
    next();
  } catch (error) {
    console.error("API Key Authentication Error:", error);

    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      message: "An error occurred during authentication. Please try again.",
      code: "AUTH_ERROR",
    });
  }
}

/**
 * Get client IP address from request
 *
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 *
 * @example
 * const ip = getClientIP(req);
 * console.log(`Client IP: ${ip}`);
 */
function getClientIP(req) {
  // Check for forwarded IP (from proxy/load balancer)
  if (req.headers["x-forwarded-for"]) {
    const forwardedIPs = req.headers["x-forwarded-for"].split(",");
    return forwardedIPs[0].trim();
  }

  // Check for real IP header
  if (req.headers["x-real-ip"]) {
    return req.headers["x-real-ip"];
  }

  // Check for CF-Connecting-IP (Cloudflare)
  if (req.headers["cf-connecting-ip"]) {
    return req.headers["cf-connecting-ip"];
  }

  // Fallback to connection remote address
  return (
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    "127.0.0.1"
  );
}

/**
 * Generate unique request ID for tracking
 *
 * @returns {string} Unique request ID
 *
 * @example
 * const requestId = generateRequestId();
 * console.log(`Request ID: ${requestId}`);
 */
function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * Optional API Key Authentication Middleware
 *
 * Similar to apiKeyAuth but doesn't require API key.
 * If API key is provided, it validates and attaches user data.
 * If no API key, continues without user data.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 *
 * @example
 * app.use('/api/v1/public', optionalApiKeyAuth);
 *
 * // In route handler:
 * app.get('/api/v1/public/data', (req, res) => {
 *   if (req.user) {
 *     // User is authenticated, provide enhanced data
 *     res.json({ data: enhancedData, user: req.user.email });
 *   } else {
 *     // No authentication, provide basic data
 *     res.json({ data: basicData });
 *   }
 * });
 */
async function optionalApiKeyAuth(req, res, next) {
  try {
    // Extract API key (same logic as apiKeyAuth)
    let apiKey = null;

    if (req.headers["x-api-key"]) {
      apiKey = req.headers["x-api-key"];
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      apiKey = req.headers.authorization.substring(7);
    } else if (req.query.apiKey) {
      apiKey = req.query.apiKey;
    }

    // If no API key provided, continue without authentication
    if (!apiKey) {
      req.user = null;
      req.apiKey = null;
      req.clientIP = getClientIP(req);
      req.requestId = generateRequestId();
      return next();
    }

    // Validate API key if provided
    const validation = await validateApiKeyFormat(apiKey);
    if (!validation.isValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
        message: validation.error,
        code: "INVALID_API_KEY",
      });
    }

    const user = validation.user;

    // Check if user is blocked
    if (user.security && user.security.isBlocked) {
      return res.status(403).json({
        success: false,
        error: "Account blocked",
        message: `Your account has been blocked: ${
          user.security.blockReason || "No reason provided"
        }`,
        code: "ACCOUNT_BLOCKED",
      });
    }

    // Track usage if API key is valid
    const clientIP = getClientIP(req);
    await trackApiUsage(apiKey, clientIP);

    // Attach user data
    req.user = {
      _id: user._id,
      email: user.email,
      profile: user.profile,
      apiKey: {
        key: user.apiKey.key,
        createdAt: user.apiKey.createdAt,
        lastUsedAt: user.apiKey.lastUsedAt,
      },
      usage: user.usage,
      timestamps: user.timestamps,
    };

    req.apiKey = apiKey;
    req.clientIP = clientIP;
    req.requestId = generateRequestId();

    next();
  } catch (error) {
    console.error("Optional API Key Authentication Error:", error);

    // For optional auth, don't fail the request on error
    req.user = null;
    req.apiKey = null;
    req.clientIP = getClientIP(req);
    req.requestId = generateRequestId();

    next();
  }
}

/**
 * Admin API Key Authentication Middleware
 *
 * Requires API key AND admin privileges.
 * Used for administrative endpoints.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 *
 * @example
 * app.use('/api/v1/admin', adminApiKeyAuth);
 *
 * // In route handler:
 * app.get('/api/v1/admin/users', (req, res) => {
 *   console.log(`Admin user: ${req.user.email}`);
 *   res.json({ users: allUsers });
 * });
 */
async function adminApiKeyAuth(req, res, next) {
  try {
    // First run regular API key authentication
    await apiKeyAuth(req, res, (err) => {
      if (err) {
        return next(err);
      }

      // Check if user has admin privileges
      if (!req.user || !req.user.profile || !req.user.profile.isAdmin) {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
          message: "This endpoint requires administrator privileges",
          code: "ADMIN_REQUIRED",
        });
      }

      // Add admin flag to request
      req.isAdmin = true;

      next();
    });
  } catch (error) {
    console.error("Admin API Key Authentication Error:", error);

    return res.status(500).json({
      success: false,
      error: "Admin authentication failed",
      message:
        "An error occurred during admin authentication. Please try again.",
      code: "ADMIN_AUTH_ERROR",
    });
  }
}

/**
 * Rate Limit Check Middleware
 *
 * Checks rate limits without tracking usage.
 * Useful for endpoints that need to check limits
 * before processing expensive operations.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 *
 * @example
 * app.use('/api/v1/expensive', rateLimitCheck);
 *
 * // In route handler:
 * app.post('/api/v1/expensive/process', (req, res) => {
 *   // Expensive operation here
 *   res.json({ result: processedData });
 * });
 */
async function rateLimitCheck(req, res, next) {
  try {
    if (!req.user || !req.apiKey) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "Please authenticate first",
        code: "AUTH_REQUIRED",
      });
    }

    const rateLimitExceeded = await isRateLimitExceeded(req.apiKey);
    if (rateLimitExceeded) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        message:
          "You have exceeded your API rate limit. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
      });
    }

    next();
  } catch (error) {
    console.error("Rate Limit Check Error:", error);

    return res.status(500).json({
      success: false,
      error: "Rate limit check failed",
      message: "An error occurred during rate limit check. Please try again.",
      code: "RATE_LIMIT_ERROR",
    });
  }
}

/**
 * API Key Validation Middleware (No Usage Tracking)
 *
 * Validates API key format and user status without tracking usage.
 * Useful for endpoints that don't count against rate limits.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 *
 * @example
 * app.use('/api/v1/status', apiKeyValidationOnly);
 *
 * // In route handler:
 * app.get('/api/v1/status', (req, res) => {
 *   res.json({ status: 'ok', user: req.user.email });
 * });
 */
async function apiKeyValidationOnly(req, res, next) {
  try {
    // Extract API key
    let apiKey = null;

    if (req.headers["x-api-key"]) {
      apiKey = req.headers["x-api-key"];
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      apiKey = req.headers.authorization.substring(7);
    } else if (req.query.apiKey) {
      apiKey = req.query.apiKey;
    }

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: "API key required",
        message: "Please provide an API key",
        code: "MISSING_API_KEY",
      });
    }

    // Validate API key format and find user
    const validation = await validateApiKeyFormat(apiKey);
    if (!validation.isValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
        message: validation.error,
        code: "INVALID_API_KEY",
      });
    }

    const user = validation.user;

    // Check if user account is blocked
    if (user.security && user.security.isBlocked) {
      return res.status(403).json({
        success: false,
        error: "Account blocked",
        message: `Your account has been blocked: ${
          user.security.blockReason || "No reason provided"
        }`,
        code: "ACCOUNT_BLOCKED",
      });
    }

    // Attach user data (no usage tracking)
    req.user = {
      _id: user._id,
      email: user.email,
      profile: user.profile,
      apiKey: {
        key: user.apiKey.key,
        createdAt: user.apiKey.createdAt,
        lastUsedAt: user.apiKey.lastUsedAt,
      },
      usage: user.usage,
      timestamps: user.timestamps,
    };

    req.apiKey = apiKey;
    req.clientIP = getClientIP(req);
    req.requestId = generateRequestId();

    next();
  } catch (error) {
    console.error("API Key Validation Error:", error);

    return res.status(500).json({
      success: false,
      error: "API key validation failed",
      message: "An error occurred during API key validation. Please try again.",
      code: "VALIDATION_ERROR",
    });
  }
}

module.exports = {
  apiKeyAuth,
  optionalApiKeyAuth,
  adminApiKeyAuth,
  rateLimitCheck,
  apiKeyValidationOnly,
  getClientIP,
  generateRequestId,
};
