/**
 * Session Authentication Middleware
 *
 * Manages user sessions using express-session with JSON file storage.
 * Provides secure session handling with CSRF protection and
 * comprehensive session management features.
 *
 * @fileoverview Session management and authentication middleware
 * @author PDF Service Team
 * @version 1.0.0
 */

const session = require("express-session");
const FileStore = require("session-file-store")(session);
const path = require("path");
const { generateCSRFToken } = require("../utils/encryption");
const { findUserById, updateUser } = require("../services/userService");
const { getConfig } = require("../services/configService");

// Session store configuration
const SESSIONS_DIR = path.join(process.cwd(), "database", "sessions");

/**
 * Configure session middleware
 *
 * @param {Object} app - Express application instance
 * @returns {Object} Configured session middleware
 *
 * @example
 * const sessionMiddleware = configureSession(app);
 * app.use(sessionMiddleware);
 */
function configureSession(app) {
  return session({
    store: new FileStore({
      path: SESSIONS_DIR,
      ttl: 86400, // 24 hours
      retries: 5,
      logFn: (message) => {
        console.log(`Session Store: ${message}`);
      },
    }),
    secret:
      process.env.SESSION_SECRET ||
      "your-super-secret-session-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevent XSS
      maxAge: 86400000, // 24 hours
      sameSite: "strict", // CSRF protection
    },
    name: "pdf-service-session", // Custom session name
  });
}

/**
 * Session Authentication Middleware
 *
 * Flow:
 * 1. Check if session exists and is valid
 * 2. Verify session user ID
 * 3. Check if user account is still active
 * 4. Update session activity timestamp
 * 5. Attach user data to req.user
 * 6. Generate CSRF token if needed
 * 7. Continue to next middleware
 *
 * Error Responses:
 * - 401: No valid session
 * - 403: User account blocked
 * - 500: Server error
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 *
 * @example
 * app.use('/dashboard', sessionAuth);
 *
 * // In route handler:
 * app.get('/dashboard/profile', (req, res) => {
 *   console.log(`User: ${req.user.email}`);
 *   res.render('profile', { user: req.user });
 * });
 */
async function sessionAuth(req, res, next) {
  try {
    // Step 1: Check if session exists
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "Please log in to access this resource",
        code: "NO_SESSION",
      });
    }

    const userId = req.session.userId;

    // Step 2: Find user by ID
    const user = await findUserById(userId);
    if (!user) {
      // User not found, destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });

      return res.status(401).json({
        success: false,
        error: "Invalid session",
        message: "User not found. Please log in again.",
        code: "INVALID_SESSION",
      });
    }

    // Step 3: Check if user account is blocked
    if (user.security && user.security.isBlocked) {
      // Destroy session for blocked user
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });

      return res.status(403).json({
        success: false,
        error: "Account blocked",
        message: `Your account has been blocked: ${
          user.security.blockReason || "No reason provided"
        }`,
        code: "ACCOUNT_BLOCKED",
      });
    }

    // Step 4: Update session activity
    req.session.lastActivity = Date.now();

    // Step 5: Attach user data to request
    req.user = {
      _id: user._id,
      email: user.email,
      profile: user.profile,
      timestamps: user.timestamps,
      emailVerification: user.emailVerification,
    };

    // Step 6: Generate CSRF token if not exists
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCSRFToken(req.sessionID);
    }

    // Step 7: Add session metadata
    req.sessionId = req.sessionID;
    req.csrfToken = req.session.csrfToken;

    next();
  } catch (error) {
    console.error("Session Authentication Error:", error);

    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      message: "An error occurred during authentication. Please try again.",
      code: "AUTH_ERROR",
    });
  }
}

/**
 * Optional Session Authentication Middleware
 *
 * Similar to sessionAuth but doesn't require authentication.
 * If session exists, it validates and attaches user data.
 * If no session, continues without user data.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 *
 * @example
 * app.use('/public', optionalSessionAuth);
 *
 * // In route handler:
 * app.get('/public/data', (req, res) => {
 *   if (req.user) {
 *     // User is logged in, provide personalized data
 *     res.json({ data: personalizedData, user: req.user.email });
 *   } else {
 *     // No session, provide general data
 *     res.json({ data: generalData });
 *   }
 * });
 */
async function optionalSessionAuth(req, res, next) {
  try {
    // Check if session exists
    if (!req.session || !req.session.userId) {
      req.user = null;
      req.sessionId = null;
      req.csrfToken = null;
      return next();
    }

    const userId = req.session.userId;

    // Find user by ID
    const user = await findUserById(userId);
    if (!user) {
      // User not found, destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });

      req.user = null;
      req.sessionId = null;
      req.csrfToken = null;
      return next();
    }

    // Check if user account is blocked
    if (user.security && user.security.isBlocked) {
      // Destroy session for blocked user
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });

      req.user = null;
      req.sessionId = null;
      req.csrfToken = null;
      return next();
    }

    // Update session activity
    req.session.lastActivity = Date.now();

    // Attach user data
    req.user = {
      _id: user._id,
      email: user.email,
      profile: user.profile,
      timestamps: user.timestamps,
      emailVerification: user.emailVerification,
    };

    // Generate CSRF token if not exists
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCSRFToken(req.sessionID);
    }

    req.sessionId = req.sessionID;
    req.csrfToken = req.session.csrfToken;

    next();
  } catch (error) {
    console.error("Optional Session Authentication Error:", error);

    // For optional auth, don't fail the request on error
    req.user = null;
    req.sessionId = null;
    req.csrfToken = null;

    next();
  }
}

/**
 * CSRF Protection Middleware
 *
 * Validates CSRF tokens for state-changing operations.
 * Protects against Cross-Site Request Forgery attacks.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 *
 * @example
 * app.use('/api/v1/update', csrfProtection);
 *
 * // In route handler:
 * app.post('/api/v1/update/profile', (req, res) => {
 *   // CSRF token validated, safe to process
 *   res.json({ success: true });
 * });
 */
function csrfProtection(req, res, next) {
  try {
    // Skip CSRF check for GET, HEAD, OPTIONS requests
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return next();
    }

    // Get CSRF token from header or body
    const token = req.headers["x-csrf-token"] || req.body._csrf;

    if (!token) {
      return res.status(403).json({
        success: false,
        error: "CSRF token required",
        message: "CSRF token is required for this operation",
        code: "MISSING_CSRF_TOKEN",
      });
    }

    // Validate CSRF token
    if (!req.session || !req.session.csrfToken) {
      return res.status(403).json({
        success: false,
        error: "Invalid session",
        message: "No valid session found",
        code: "INVALID_SESSION",
      });
    }

    if (token !== req.session.csrfToken) {
      return res.status(403).json({
        success: false,
        error: "Invalid CSRF token",
        message: "CSRF token does not match",
        code: "INVALID_CSRF_TOKEN",
      });
    }

    next();
  } catch (error) {
    console.error("CSRF Protection Error:", error);

    return res.status(500).json({
      success: false,
      error: "CSRF validation failed",
      message: "An error occurred during CSRF validation. Please try again.",
      code: "CSRF_ERROR",
    });
  }
}

/**
 * Session Timeout Middleware
 *
 * Checks session timeout and destroys expired sessions.
 * Provides automatic session cleanup.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 *
 * @example
 * app.use(sessionTimeout);
 *
 * // Sessions will be automatically cleaned up
 */
function sessionTimeout(req, res, next) {
  try {
    if (!req.session) {
      return next();
    }

    const config = getConfig();
    const sessionMaxAge = config.sessionMaxAge || 86400000; // 24 hours
    const now = Date.now();

    // Check if session has expired
    if (
      req.session.lastActivity &&
      now - req.session.lastActivity > sessionMaxAge
    ) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session timeout destruction error:", err);
        }
      });

      return res.status(401).json({
        success: false,
        error: "Session expired",
        message: "Your session has expired. Please log in again.",
        code: "SESSION_EXPIRED",
      });
    }

    next();
  } catch (error) {
    console.error("Session Timeout Error:", error);
    next();
  }
}

/**
 * Login Session Middleware
 *
 * Creates a new session for authenticated user.
 * Used after successful login.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 *
 * @example
 * app.post('/login', loginSession);
 *
 * // After successful authentication:
 * req.session.userId = user._id;
 * req.session.lastActivity = Date.now();
 * res.json({ success: true, user: req.user });
 */
function loginSession(req, res, next) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(400).json({
        success: false,
        error: "User data required",
        message: "User data must be attached to request",
        code: "USER_DATA_REQUIRED",
      });
    }

    // Create session
    req.session.userId = req.user._id;
    req.session.lastActivity = Date.now();
    req.session.loginTime = Date.now();
    req.session.csrfToken = generateCSRFToken(req.sessionID);

    // Update user last login
    updateUser(req.user._id, {
      timestamps: {
        lastLoginAt: new Date().toISOString(),
      },
    }).catch((err) => {
      console.error("Failed to update last login:", err);
    });

    next();
  } catch (error) {
    console.error("Login Session Error:", error);

    return res.status(500).json({
      success: false,
      error: "Session creation failed",
      message: "An error occurred during session creation. Please try again.",
      code: "SESSION_CREATION_ERROR",
    });
  }
}

/**
 * Logout Session Middleware
 *
 * Destroys user session.
 * Used for logout functionality.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 *
 * @example
 * app.post('/logout', logoutSession);
 *
 * // Session will be destroyed
 * res.json({ success: true, message: 'Logged out successfully' });
 */
function logoutSession(req, res, next) {
  try {
    if (!req.session) {
      return res.status(400).json({
        success: false,
        error: "No active session",
        message: "No active session to logout",
        code: "NO_SESSION",
      });
    }

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({
          success: false,
          error: "Logout failed",
          message: "An error occurred during logout. Please try again.",
          code: "LOGOUT_ERROR",
        });
      }

      // Clear session cookie
      res.clearCookie("pdf-service-session");

      next();
    });
  } catch (error) {
    console.error("Logout Session Error:", error);

    return res.status(500).json({
      success: false,
      error: "Logout failed",
      message: "An error occurred during logout. Please try again.",
      code: "LOGOUT_ERROR",
    });
  }
}

/**
 * Session Refresh Middleware
 *
 * Refreshes session expiration time.
 * Used to keep sessions alive during activity.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 *
 * @example
 * app.use('/api/v1', sessionRefresh);
 *
 * // Sessions will be refreshed on each request
 */
function sessionRefresh(req, res, next) {
  try {
    if (req.session && req.session.userId) {
      req.session.lastActivity = Date.now();
    }

    next();
  } catch (error) {
    console.error("Session Refresh Error:", error);
    next();
  }
}

/**
 * Get Session Information
 *
 * @param {Object} req - Express request object
 * @returns {Object} Session information
 *
 * @example
 * const sessionInfo = getSessionInfo(req);
 * console.log(`Session ID: ${sessionInfo.sessionId}`);
 */
function getSessionInfo(req) {
  if (!req.session) {
    return null;
  }

  return {
    sessionId: req.sessionID,
    userId: req.session.userId,
    lastActivity: req.session.lastActivity,
    loginTime: req.session.loginTime,
    csrfToken: req.session.csrfToken,
  };
}

module.exports = {
  configureSession,
  sessionAuth,
  optionalSessionAuth,
  csrfProtection,
  sessionTimeout,
  loginSession,
  logoutSession,
  sessionRefresh,
  getSessionInfo,
};
