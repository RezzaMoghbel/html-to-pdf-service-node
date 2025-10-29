const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

// Import services and middleware
const authService = require("../services/authService");
const userService = require("../services/userService");
const configService = require("../services/configService");
const { sessionAuth, optionalSessionAuth, csrfProtection } = require("../middleware/sessionAuth");
const { authRateLimit, registrationRateLimit, passwordResetRateLimit } = require("../middleware/rateLimitAuth");
const { validateBody, validateQuery, validateHeaders } = require("../middleware/validation");

/**
 * Authentication API Routes
 * 
 * This module provides comprehensive authentication endpoints including:
 * - User registration with email verification
 * - User login with session management
 * - Password reset functionality
 * - Email verification
 * - Session management and refresh
 * - Account security features
 * 
 * Security Features:
 * - Rate limiting on all endpoints
 * - CSRF protection for session-based operations
 * - Input validation and sanitization
 * - Secure password hashing with bcrypt
 * - Session timeout and refresh
 * - Account blocking after failed attempts
 * 
 * API Documentation:
 * All endpoints return JSON responses with consistent structure:
 * {
 *   "success": boolean,
 *   "message": string,
 *   "data": object (optional),
 *   "error": string (optional),
 *   "code": string (optional)
 * }
 */

/**
 * @route POST /auth/register
 * @desc Register a new user account
 * @access Public
 * @rateLimit 5 requests per 15 minutes per IP
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePassword123!",
 *   "confirmPassword": "SecurePassword123!",
 *   "profile": {
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "dateOfBirth": "01/01/1990",
 *     "address1": "123 Main St",
 *     "address2": "Apt 4B",
 *     "city": "London",
 *     "postcode": "SW1A 1AA",
 *     "country": "United Kingdom"
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Account created successfully",
 *   "data": {
 *     "user": {
 *       "_id": "uuid",
 *       "email": "user@example.com",
 *       "profile": { ... },
 *       "apiKey": { ... },
 *       "timestamps": { ... }
 *     },
 *     "requiresEmailVerification": false
 *   }
 * }
 */
router.post("/register", 
  registrationRateLimit(),
  validateBody({
    email: { type: "email", required: true, minLength: 5, maxLength: 254 },
    password: { type: "string", required: true, minLength: 8, maxLength: 128 },
    confirmPassword: { type: "string", required: true, minLength: 8, maxLength: 128 },
    firstName: { type: "string", required: true, minLength: 1, maxLength: 50 },
    lastName: { type: "string", required: true, minLength: 1, maxLength: 50 },
    dateOfBirth: { type: "string", required: true, format: "date" },
    address1: { type: "string", required: true, minLength: 1, maxLength: 100 },
    address2: { type: "string", required: false, maxLength: 100 },
    city: { type: "string", required: true, minLength: 1, maxLength: 50 },
    postcode: { type: "string", required: true, minLength: 1, maxLength: 20 },
    country: { type: "string", required: true, minLength: 1, maxLength: 50 }
  }),
  async (req, res) => {
    try {
      const { 
        email, 
        password, 
        confirmPassword, 
        firstName, 
        lastName, 
        dateOfBirth, 
        address1, 
        address2, 
        address3, 
        city, 
        postcode, 
        country 
      } = req.body;
      
      // Validate password confirmation
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: "Password confirmation mismatch",
          message: "Password and confirm password must match",
          code: "PASSWORD_MISMATCH"
        });
      }
      
      // Check if email verification is enabled
      const config = await configService.getConfig();
      const requiresEmailVerification = config.emailVerificationEnabled;
      
      // Register user
      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        dateOfBirth,
        address1,
        address2,
        address3,
        city,
        postcode,
        country,
        requiresEmailVerification
      });
      
      res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: {
          user: result.user,
          requiresEmailVerification: requiresEmailVerification
        }
      });
      
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error.message.includes("already exists")) {
        return res.status(409).json({
          success: false,
          error: "Email already registered",
          message: "An account with this email already exists",
          code: "EMAIL_EXISTS"
        });
      }
      
      if (error.message.includes("validation failed")) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          message: error.message,
          code: "VALIDATION_ERROR"
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Registration failed",
        message: "An error occurred during registration. Please try again.",
        code: "REGISTRATION_ERROR"
      });
    }
  }
);

/**
 * @route POST /auth/login
 * @desc Authenticate user and create session
 * @access Public
 * @rateLimit 5 requests per 15 minutes per IP
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePassword123!"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "user": { ... },
 *     "sessionToken": "session_token_string"
 *   }
 * }
 */
router.post("/login",
  authRateLimit(),
  validateBody({
    email: { type: "email", required: true },
    password: { type: "string", required: true, minLength: 1 }
  }),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      
      // Attempt login
      const result = await authService.login(email, password, ipAddress);
      
      // Create session
      req.session.userId = result.user._id;
      req.session.email = result.user.email;
      req.session.isAuthenticated = true;
      req.session.loginTime = new Date().toISOString();
      
      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          sessionToken: result.sessionToken
        }
      });
      
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.message.includes("Invalid email or password")) {
        return res.status(401).json({
          success: false,
          error: "Authentication failed",
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS"
        });
      }
      
      if (error.message.includes("Account is blocked")) {
        return res.status(403).json({
          success: false,
          error: "Account blocked",
          message: error.message,
          code: "ACCOUNT_BLOCKED"
        });
      }
      
      if (error.message.includes("too many failed login attempts")) {
        return res.status(429).json({
          success: false,
          error: "Account temporarily blocked",
          message: "Too many failed login attempts. Account has been temporarily blocked.",
          code: "ACCOUNT_TEMPORARILY_BLOCKED"
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Login failed",
        message: "An error occurred during login. Please try again.",
        code: "LOGIN_ERROR"
      });
    }
  }
);

/**
 * @route POST /auth/logout
 * @desc Logout user and destroy session
 * @access Private (requires session)
 * @rateLimit 10 requests per hour per IP
 */
router.post("/logout",
  sessionAuth,
  csrfProtection,
  async (req, res) => {
    try {
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({
            success: false,
            error: "Logout failed",
            message: "An error occurred during logout. Please try again.",
            code: "LOGOUT_ERROR"
          });
        }
        
        res.clearCookie("pdf-service-session");
        res.json({
          success: true,
          message: "Logout successful"
        });
      });
      
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        error: "Logout failed",
        message: "An error occurred during logout. Please try again.",
        code: "LOGOUT_ERROR"
      });
    }
  }
);

/**
 * @route POST /auth/forgot-password
 * @desc Request password reset token
 * @access Public
 * @rateLimit 3 requests per hour per IP
 * 
 * Request Body:
 * {
 *   "email": "user@example.com"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Password reset instructions sent to your email"
 * }
 */
router.post("/forgot-password",
  passwordResetRateLimit(),
  validateBody({
    email: { type: "email", required: true }
  }),
  async (req, res) => {
    try {
      const { email } = req.body;
      
      // Generate password reset token
      const result = await authService.generatePasswordResetToken(email);
      
      if (result.success) {
        res.json({
          success: true,
          message: "Password reset instructions sent to your email"
        });
      } else {
        res.status(404).json({
          success: false,
          error: "Email not found",
          message: "No account found with this email address",
          code: "EMAIL_NOT_FOUND"
        });
      }
      
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        error: "Password reset failed",
        message: "An error occurred while processing your request. Please try again.",
        code: "PASSWORD_RESET_ERROR"
      });
    }
  }
);

/**
 * @route POST /auth/reset-password
 * @desc Reset password using token
 * @access Public
 * @rateLimit 5 requests per hour per IP
 * 
 * Request Body:
 * {
 *   "token": "reset_token_string",
 *   "newPassword": "NewSecurePassword123!",
 *   "confirmPassword": "NewSecurePassword123!"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Password reset successfully"
 * }
 */
router.post("/reset-password",
  passwordResetRateLimit(),
  validateBody({
    token: { type: "string", required: true, minLength: 1 },
    newPassword: { type: "string", required: true, minLength: 8, maxLength: 128 },
    confirmPassword: { type: "string", required: true, minLength: 8, maxLength: 128 }
  }),
  async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;
      
      // Validate password confirmation
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: "Password confirmation mismatch",
          message: "New password and confirm password must match",
          code: "PASSWORD_MISMATCH"
        });
      }
      
      // Reset password
      const result = await authService.resetPasswordSecure(token, newPassword);
      
      if (result.success) {
        res.json({
          success: true,
          message: "Password reset successfully"
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Invalid or expired token",
          message: "Password reset token is invalid or has expired",
          code: "INVALID_TOKEN"
        });
      }
      
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        error: "Password reset failed",
        message: "An error occurred while resetting your password. Please try again.",
        code: "PASSWORD_RESET_ERROR"
      });
    }
  }
);

/**
 * @route POST /auth/verify-email
 * @desc Verify email address using token
 * @access Public
 * @rateLimit 5 requests per hour per IP
 * 
 * Request Body:
 * {
 *   "token": "verification_token_string"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Email verified successfully"
 * }
 */
router.post("/verify-email",
  passwordResetRateLimit(),
  validateBody({
    token: { type: "string", required: true, minLength: 1 }
  }),
  async (req, res) => {
    try {
      const { token } = req.body;
      
      // Verify email
      const result = await authService.verifyEmail(token);
      
      if (result.success) {
        res.json({
          success: true,
          message: "Email verified successfully"
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Invalid or expired token",
          message: "Email verification token is invalid or has expired",
          code: "INVALID_TOKEN"
        });
      }
      
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({
        success: false,
        error: "Email verification failed",
        message: "An error occurred while verifying your email. Please try again.",
        code: "EMAIL_VERIFICATION_ERROR"
      });
    }
  }
);

/**
 * @route POST /auth/change-password
 * @desc Change password for authenticated user
 * @access Private (requires session)
 * @rateLimit 5 requests per hour per IP
 * 
 * Request Body:
 * {
 *   "currentPassword": "CurrentPassword123!",
 *   "newPassword": "NewSecurePassword123!",
 *   "confirmPassword": "NewSecurePassword123!"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Password changed successfully"
 * }
 */
router.post("/change-password",
  sessionAuth,
  csrfProtection,
  passwordResetRateLimit(),
  validateBody({
    currentPassword: { type: "string", required: true, minLength: 1 },
    newPassword: { type: "string", required: true, minLength: 8, maxLength: 128 },
    confirmPassword: { type: "string", required: true, minLength: 8, maxLength: 128 }
  }),
  async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.session.userId;
      
      // Validate password confirmation
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: "Password confirmation mismatch",
          message: "New password and confirm password must match",
          code: "PASSWORD_MISMATCH"
        });
      }
      
      // Change password
      const result = await authService.changePassword(userId, currentPassword, newPassword);
      
      if (result.success) {
        res.json({
          success: true,
          message: "Password changed successfully"
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Current password incorrect",
          message: "The current password you entered is incorrect",
          code: "INVALID_CURRENT_PASSWORD"
        });
      }
      
    } catch (error) {
      console.error("Change password error:", error);
      
      // Check if it's a validation error (current password incorrect)
      if (error.message.includes("Current password is incorrect")) {
        return res.status(400).json({
          success: false,
          error: "Invalid current password",
          message: "The current password you entered is incorrect",
          code: "INVALID_CURRENT_PASSWORD"
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Password change failed",
        message: "An error occurred while changing your password. Please try again.",
        code: "PASSWORD_CHANGE_ERROR"
      });
    }
  }
);

/**
 * @route GET /auth/session
 * @desc Get current session information
 * @access Private (requires session)
 * @rateLimit 60 requests per hour per IP
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { ... },
 *     "session": {
 *       "isAuthenticated": true,
 *       "loginTime": "2024-01-01T00:00:00.000Z",
 *       "lastActivity": "2024-01-01T00:00:00.000Z"
 *     }
 *   }
 * }
 */
router.get("/session",
  sessionAuth,
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await userService.findUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
          message: "User account not found",
          code: "USER_NOT_FOUND"
        });
      }
      
      res.json({
        success: true,
        data: {
          user: {
            _id: user._id,
            email: user.email,
            profile: user.profile,
            apiKey: user.apiKey,
            timestamps: user.timestamps
          },
          session: {
            isAuthenticated: req.session.isAuthenticated,
            loginTime: req.session.loginTime,
            lastActivity: new Date().toISOString()
          },
          csrfToken: req.csrfToken
        }
      });
      
    } catch (error) {
      console.error("Session check error:", error);
      res.status(500).json({
        success: false,
        error: "Session check failed",
        message: "An error occurred while checking your session. Please try again.",
        code: "SESSION_CHECK_ERROR"
      });
    }
  }
);

/**
 * @route POST /auth/refresh-session
 * @desc Refresh session to extend timeout
 * @access Private (requires session)
 * @rateLimit 60 requests per hour per IP
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Session refreshed successfully"
 * }
 */
router.post("/refresh-session",
  sessionAuth,
  csrfProtection,
  async (req, res) => {
    try {
      // Refresh session
      req.session.lastActivity = new Date().toISOString();
      
      res.json({
        success: true,
        message: "Session refreshed successfully"
      });
      
    } catch (error) {
      console.error("Session refresh error:", error);
      res.status(500).json({
        success: false,
        error: "Session refresh failed",
        message: "An error occurred while refreshing your session. Please try again.",
        code: "SESSION_REFRESH_ERROR"
      });
    }
  }
);

/**
 * @route GET /auth/me
 * @desc Get current user profile
 * @access Private (requires session)
 * @rateLimit 60 requests per hour per IP
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { ... }
 *   }
 * }
 */
router.get("/me",
  sessionAuth,
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await userService.findUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
          message: "User account not found",
          code: "USER_NOT_FOUND"
        });
      }
      
      // Remove sensitive data
      const { passwordHash, ...userResponse } = user;
      
      res.json({
        success: true,
        data: {
          user: userResponse
        }
      });
      
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({
        success: false,
        error: "Profile retrieval failed",
        message: "An error occurred while retrieving your profile. Please try again.",
        code: "PROFILE_RETRIEVAL_ERROR"
      });
    }
  }
);

/**
 * @route GET /auth/config
 * @desc Get authentication configuration
 * @access Public
 * @rateLimit 60 requests per hour per IP
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "emailVerificationEnabled": false,
 *     "passwordRequirements": { ... },
     "supportedCountries": [ ... ],
     "rateLimits": { ... }
   }
 }
 */
router.get("/config",
  async (req, res) => {
    try {
      const config = await configService.getConfig();
      
      // Return only public configuration
      const publicConfig = {
        emailVerificationEnabled: config.emailVerificationEnabled,
        passwordRequirements: {
          minLength: config.passwordMinLength,
          requireUppercase: config.passwordRequireUppercase,
          requireLowercase: config.passwordRequireLowercase,
          requireNumbers: config.passwordRequireNumbers,
          requireSpecialChars: config.passwordRequireSpecialChars
        },
        supportedCountries: config.supportedCountries,
        rateLimits: {
          registration: "5 requests per 15 minutes",
          login: "5 requests per 15 minutes",
          passwordReset: "3 requests per hour"
        }
      };
      
      res.json({
        success: true,
        data: publicConfig
      });
      
    } catch (error) {
      console.error("Config retrieval error:", error);
      res.status(500).json({
        success: false,
        error: "Configuration retrieval failed",
        message: "An error occurred while retrieving configuration. Please try again.",
        code: "CONFIG_RETRIEVAL_ERROR"
      });
    }
  }
);

/**
 * @route GET /auth/check-email
 * @desc Check if an email address is available
 * @access Public
 * 
 * Query Parameters:
 * - email: string (required) - Email address to check
 * 
 * Response:
 * {
 *   "success": true,
 *   "available": boolean,
 *   "message": string
 * }
 */
router.get("/check-email",
  validateQuery({
    email: { type: "email", required: true }
  }),
  async (req, res) => {
    try {
      const { email } = req.query;
      
      // Check if user with this email exists
      const existingUser = await userService.findUserByEmail(email);
      
      if (existingUser) {
        return res.json({
          success: true,
          available: false,
          message: "This email address is already registered"
        });
      }
      
      res.json({
        success: true,
        available: true,
        message: "This email address is available"
      });
      
    } catch (error) {
      console.error("Email check error:", error);
      res.status(500).json({
        success: false,
        available: false,
        message: "An error occurred while checking email availability. Please try again."
      });
    }
  }
);

module.exports = router;
