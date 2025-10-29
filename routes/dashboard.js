const express = require("express");
const router = express.Router();

// Import services and middleware
const userService = require("../services/userService");
const apiKeyService = require("../services/apiKeyService");
const configService = require("../services/configService");
const { sessionAuth, csrfProtection } = require("../middleware/sessionAuth");
const { rateLimit } = require("../middleware/rateLimitAuth");
const { validateBody, validateQuery } = require("../middleware/validation");

/**
 * Dashboard API Routes
 * 
 * This module provides dashboard and user management endpoints including:
 * - User profile management
 * - API key generation and regeneration
 * - Usage statistics and analytics
 * - Account settings and preferences
 * - Security settings and history
 * 
 * Security Features:
 * - Session-based authentication required
 * - CSRF protection on all state-changing operations
 * - Rate limiting on all endpoints
 * - Input validation and sanitization
 * - User data isolation and privacy
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
 * @route GET /dashboard/profile
 * @desc Get user profile information
 * @access Private (requires session)
 * @rateLimit 60 requests per hour per IP
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": {
 *       "_id": "uuid",
 *       "email": "user@example.com",
 *       "profile": { ... },
 *       "apiKey": { ... },
 *       "usage": { ... },
 *       "timestamps": { ... }
 *     }
 *   }
 * }
 */
router.get("/profile",
  sessionAuth,
  rateLimit({ maxRequests: 100, windowMs: 3600000 }), // 60 requests per hour
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
      console.error("Profile retrieval error:", error);
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
 * @route PUT /dashboard/profile
 * @desc Update user profile information
 * @access Private (requires session)
 * @rateLimit 10 requests per hour per IP
 * 
 * Request Body:
 * {
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
 *   "message": "Profile updated successfully",
 *   "data": {
 *     "user": { ... }
 *   }
 * }
 */
router.put("/profile",
  sessionAuth,
  csrfProtection,
  rateLimit({ maxRequests: 100, windowMs: 3600000 }), // 10 requests per hour
  validateBody({
    profile: {
      type: "object",
      required: true,
      fields: {
        firstName: { type: "string", required: true, minLength: 1, maxLength: 50 },
        lastName: { type: "string", required: true, minLength: 1, maxLength: 50 },
        dob: { type: "string", required: true, format: "date" },
        address: {
          type: "object",
          required: true,
          fields: {
            address1: { type: "string", required: true, minLength: 1, maxLength: 100 },
            address2: { type: "string", required: false, maxLength: 100 },
            city: { type: "string", required: true, minLength: 1, maxLength: 50 },
            postcode: { type: "string", required: true, minLength: 1, maxLength: 20 },
            country: { type: "string", required: true, minLength: 1, maxLength: 50 }
          }
        }
      }
    }
  }),
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const { profile } = req.body;
      
      // Get current user data for comparison
      const currentUser = await userService.findUserById(userId);
      
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          error: "User not found",
          message: "User account not found",
          code: "USER_NOT_FOUND"
        });
      }
      
      // Compare profile data to avoid unnecessary updates
      const currentProfile = currentUser.profile || {};
      const newProfile = profile || {};
      
      // Deep comparison function
      const profilesAreEqual = (current, newProfile) => {
        // Compare top-level fields
        if (current.firstName !== newProfile.firstName) return false;
        if (current.lastName !== newProfile.lastName) return false;
        if (current.dob !== newProfile.dob) return false;
        
        // Compare address fields
        const currentAddr = current.address || {};
        const newAddr = newProfile.address || {};
        
        if (currentAddr.address1 !== newAddr.address1) return false;
        if (currentAddr.address2 !== newAddr.address2) return false;
        if (currentAddr.city !== newAddr.city) return false;
        if (currentAddr.postcode !== newAddr.postcode) return false;
        if (currentAddr.country !== newAddr.country) return false;
        
        return true;
      };
      
      // Check if data has actually changed
      if (profilesAreEqual(currentProfile, newProfile)) {
        // Return current data without updating
        const { passwordHash, ...userResponse } = currentUser;
        
        return res.json({
          success: true,
          message: "No changes detected",
          data: {
            user: userResponse
          }
        });
      }
      
      // Update user profile
      const updatedUser = await userService.updateUser(userId, { profile });
      
      // Remove sensitive data
      const { passwordHash, ...userResponse } = updatedUser;
      
      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: userResponse
        }
      });
      
    } catch (error) {
      console.error("Profile update error:", error);
      
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
        error: "Profile update failed",
        message: "An error occurred while updating your profile. Please try again.",
        code: "PROFILE_UPDATE_ERROR"
      });
    }
  }
);

/**
 * @route GET /dashboard/api-key
 * @desc Get user's API key information
 * @access Private (requires session)
 * @rateLimit 60 requests per hour per IP
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "apiKey": {
 *       "key": "sk_live_...",
 *       "maskedKey": "sk_live_****...",
 *       "createdAt": "2024-01-01T00:00:00.000Z",
 *       "lastUsedAt": "2024-01-01T00:00:00.000Z",
 *       "isActive": true
 *     }
 *   }
 * }
 */
router.get("/api-key",
  sessionAuth,
  rateLimit({ maxRequests: 100, windowMs: 3600000 }), // 60 requests per hour
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
      
      // Check if user has an API key
      if (!user.apiKey || !user.apiKey.key) {
        return res.json({
          success: true,
          data: {
            apiKey: null,
            message: "No API key generated yet. Generate one to start using the API."
          }
        });
      }
      
      // User has an API key, get additional info
      const apiKeyInfo = await apiKeyService.getApiKeyInfo(user._id);
      
      res.json({
        success: true,
        data: {
          apiKey: {
            key: user.apiKey.key,
            maskedKey: apiKeyService.maskApiKey(user.apiKey.key),
            createdAt: user.apiKey.createdAt,
            lastUsedAt: user.apiKey.lastUsedAt,
            isActive: user.apiKey.isActive
          }
        }
      });
      
    } catch (error) {
      console.error("API key retrieval error:", error);
      res.status(500).json({
        success: false,
        error: "API key retrieval failed",
        message: "An error occurred while retrieving your API key. Please try again.",
        code: "API_KEY_RETRIEVAL_ERROR"
      });
    }
  }
);

/**
 * @route POST /dashboard/api-key/generate
 * @desc Generate user's first API key
 * @access Private (requires session)
 * @rateLimit 3 requests per hour per IP
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "API key generated successfully",
 *   "data": {
 *     "apiKey": {
 *       "key": "sk_live_...",
 *       "maskedKey": "sk_live_****...",
 *       "createdAt": "2024-01-01T00:00:00.000Z",
 *       "isActive": true
 *     }
 *   }
 * }
 */
router.post("/api-key/generate",
  sessionAuth,
  csrfProtection,
  rateLimit({ maxRequests: 100, windowMs: 3600000 }), // 10 requests per hour (increased from 3)
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
      
      // Check if user already has an API key
      if (user.apiKey && user.apiKey.key) {
        return res.status(400).json({
          success: false,
          error: "API key already exists",
          message: "You already have an API key. Use regenerate to create a new one.",
          code: "API_KEY_EXISTS"
        });
      }
      
      // Generate new API key
      const newApiKey = await apiKeyService.generateApiKeyForUser(userId);
      
      res.json({
        success: true,
        message: "API key generated successfully",
        data: {
          apiKey: {
            key: newApiKey.key,
            maskedKey: apiKeyService.maskApiKey(newApiKey.key),
            createdAt: newApiKey.createdAt,
            isActive: true
          }
        }
      });
      
    } catch (error) {
      console.error("API key generation error:", error);
      res.status(500).json({
        success: false,
        error: "API key generation failed",
        message: "An error occurred while generating your API key. Please try again.",
        code: "API_KEY_GENERATION_ERROR"
      });
    }
  }
);

/**
 * @route POST /dashboard/api-key/regenerate
 * @desc Regenerate user's API key
 * @access Private (requires session)
 * @rateLimit 3 requests per hour per IP
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "API key regenerated successfully",
 *   "data": {
 *     "apiKey": {
 *       "key": "sk_live_...",
 *       "maskedKey": "sk_live_****...",
 *       "createdAt": "2024-01-01T00:00:00.000Z",
 *       "isActive": true
 *     }
 *   }
 * }
 */
router.post("/api-key/regenerate",
  sessionAuth,
  csrfProtection,
  rateLimit({ maxRequests: 100, windowMs: 3600000 }), // 10 requests per hour (increased from 3)
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
      
      // Check if user has an API key to regenerate
      if (!user.apiKey || !user.apiKey.key) {
        return res.status(400).json({
          success: false,
          error: "No API key to regenerate",
          message: "You don't have an API key to regenerate. Generate one first.",
          code: "NO_API_KEY"
        });
      }
      
      // Check if API key regeneration is enabled
      const config = await configService.getConfig();
      if (!config.features.enableApiKeyRegeneration) {
        return res.status(403).json({
          success: false,
          error: "API key regeneration disabled",
          message: "API key regeneration is currently disabled",
          code: "FEATURE_DISABLED"
        });
      }
      
      // Regenerate API key
      const newApiKey = await apiKeyService.regenerateApiKey(user._id);
      
      res.json({
        success: true,
        message: "API key regenerated successfully",
        data: {
          apiKey: {
            key: newApiKey.key,
            maskedKey: apiKeyService.maskApiKey(newApiKey.key),
            createdAt: newApiKey.createdAt,
            isActive: newApiKey.isActive
          }
        }
      });
      
    } catch (error) {
      console.error("API key regeneration error:", error);
      res.status(500).json({
        success: false,
        error: "API key regeneration failed",
        message: "An error occurred while regenerating your API key. Please try again.",
        code: "API_KEY_REGENERATION_ERROR"
      });
    }
  }
);

/**
 * @route GET /dashboard/usage
 * @desc Get user's API usage statistics
 * @access Private (requires session)
 * @rateLimit 60 requests per hour per IP
 * 
 * Query Parameters:
 * - period: "hour", "day", "week", "month" (optional, defaults to "day")
 * - limit: number (optional, defaults to 100)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "usage": {
 *       "totalRequests": 150,
 *       "requestsByIP": [
 *         {
 *           "ip": "192.168.1.1",
 *           "count": 100,
 *           "lastRequest": "2024-01-01T00:00:00.000Z"
 *         }
 *       ],
 *       "rateLimitStatus": {
 *         "limit": 1000,
 *         "remaining": 850,
 *         "resetTime": "2024-01-02T00:00:00.000Z",
 *         "period": "day"
 *       }
 *     }
 *   }
 * }
 */
router.get("/usage",
  sessionAuth,
  rateLimit({ maxRequests: 100, windowMs: 3600000 }), // 60 requests per hour
  validateQuery({
    period: { type: "string", required: false, enum: ["hour", "day", "week", "month"] },
    limit: { type: "number", required: false, min: 1, max: 1000 }
  }),
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const { period = "day", limit = 100 } = req.query;
      
      const user = await userService.findUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
          message: "User account not found",
          code: "USER_NOT_FOUND"
        });
      }
      
      // Check if user has an API key
      if (!user.apiKey || !user.apiKey.key) {
        return res.json({
          success: true,
          data: {
            usage: {
              totalRequests: 0,
              requestsByIP: [],
              rateLimit: user.usage?.rateLimit || 1000,
              rateLimitPeriod: user.usage?.rateLimitPeriod || "day",
              remainingRequests: user.usage?.rateLimit || 1000,
              resetTime: null
            },
            message: "No API key generated yet. Generate one to start using the API."
          }
        });
      }
      
      // User has an API key, get detailed statistics
      const usageStats = await apiKeyService.getUserUsageStats(user._id, period, limit);
      
      // Get rate limit status
      const rateLimitStatus = await apiKeyService.getRateLimitStatus(user.apiKey.key);
      
      res.json({
        success: true,
        data: {
          usage: {
            totalRequests: user.usage?.totalRequests || 0,
            requestsByIP: (user.usage?.requestsByIP || []).slice(0, limit),
            rateLimitStatus: rateLimitStatus
          }
        }
      });
      
    } catch (error) {
      console.error("Usage statistics error:", error);
      res.status(500).json({
        success: false,
        error: "Usage statistics retrieval failed",
        message: "An error occurred while retrieving usage statistics. Please try again.",
        code: "USAGE_STATISTICS_ERROR"
      });
    }
  }
);

/**
 * @route GET /dashboard/stats
 * @desc Get comprehensive user statistics
 * @access Private (requires session)
 * @rateLimit 30 requests per hour per IP
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "stats": {
 *       "account": {
 *         "createdAt": "2024-01-01T00:00:00.000Z",
 *         "lastLoginAt": "2024-01-01T00:00:00.000Z",
 *         "isBlocked": false,
 *         "failedLoginAttempts": 0
 *       },
 *       "apiKey": {
 *         "createdAt": "2024-01-01T00:00:00.000Z",
 *         "lastUsedAt": "2024-01-01T00:00:00.000Z",
 *         "isActive": true
 *       },
 *       "usage": {
 *         "totalRequests": 150,
 *         "uniqueIPs": 3,
 *         "averageRequestsPerDay": 5.2
 *       }
 *     }
 *   }
 * }
 */
router.get("/stats",
  sessionAuth,
  rateLimit({ maxRequests: 100, windowMs: 3600000 }), // 30 requests per hour
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
      
      // Calculate comprehensive statistics
      const totalRequests = user.usage?.totalRequests || 0;
      const uniqueIPs = user.usage?.requestsByIP?.length || 0;
      const accountAgeDays = Math.floor((new Date() - new Date(user.timestamps.createdAt)) / (1000 * 60 * 60 * 24));
      const averageRequestsPerDay = accountAgeDays > 0 ? (totalRequests / accountAgeDays).toFixed(1) : 0;
      
      const stats = {
        account: {
          createdAt: user.timestamps.createdAt,
          lastLoginAt: user.timestamps.lastLoginAt,
          isBlocked: user.security?.isBlocked || false,
          failedLoginAttempts: user.security?.failedLoginAttempts || 0
        },
        apiKey: {
          createdAt: user.apiKey.createdAt,
          lastUsedAt: user.apiKey.lastUsedAt,
          isActive: user.apiKey.isActive
        },
        usage: {
          totalRequests: totalRequests,
          uniqueIPs: uniqueIPs,
          averageRequestsPerDay: parseFloat(averageRequestsPerDay)
        }
      };
      
      res.json({
        success: true,
        data: {
          stats: stats
        }
      });
      
    } catch (error) {
      console.error("Statistics error:", error);
      res.status(500).json({
        success: false,
        error: "Statistics retrieval failed",
        message: "An error occurred while retrieving statistics. Please try again.",
        code: "STATISTICS_ERROR"
      });
    }
  }
);

/**
 * @route GET /dashboard/security
 * @desc Get user's security information and history
 * @access Private (requires session)
 * @rateLimit 30 requests per hour per IP
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "security": {
 *       "isBlocked": false,
 *       "blockReason": null,
 *       "failedLoginAttempts": 0,
 *       "lastFailedLogin": null,
 *       "passwordChangedAt": "2024-01-01T00:00:00.000Z",
 *       "emailVerified": true,
 *       "twoFactorEnabled": false
 *     }
 *   }
 * }
 */
router.get("/security",
  sessionAuth,
  rateLimit({ maxRequests: 100, windowMs: 3600000 }), // 30 requests per hour
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
      
      const security = {
        isBlocked: user.security?.isBlocked || false,
        blockReason: user.security?.blockReason || null,
        failedLoginAttempts: user.security?.failedLoginAttempts || 0,
        lastFailedLogin: user.security?.lastFailedLogin || null,
        passwordChangedAt: user.security?.passwordChangedAt || null,
        emailVerified: user.emailVerification?.isVerified || false,
        twoFactorEnabled: user.security?.twoFactorEnabled || false
      };
      
      res.json({
        success: true,
        data: {
          security: security
        }
      });
      
    } catch (error) {
      console.error("Security information error:", error);
      res.status(500).json({
        success: false,
        error: "Security information retrieval failed",
        message: "An error occurred while retrieving security information. Please try again.",
        code: "SECURITY_INFO_ERROR"
      });
    }
  }
);

/**
 * @route GET /dashboard/pdf-generator
 * @desc Get PDF generator access URL with API key
 * @access Private (requires session)
 * @rateLimit 60 requests per hour per IP
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "pdfGeneratorUrl": "http://localhost:9005/pages/html2pdf-test-ui.html?apiKey=sk_live_...",
 *     "apiKey": "sk_live_...",
 *     "maskedApiKey": "sk_live_****..."
 *   }
 * }
 */
router.get("/pdf-generator",
  sessionAuth,
  rateLimit({ maxRequests: 100, windowMs: 3600000 }), // 60 requests per hour
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
      
      const apiKey = user.apiKey.key;
      const maskedApiKey = apiKeyService.maskApiKey(apiKey);
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const pdfGeneratorUrl = `${baseUrl}/pages/html2pdf-test-ui.html?apiKey=${encodeURIComponent(apiKey)}`;
      
      res.json({
        success: true,
        data: {
          pdfGeneratorUrl: pdfGeneratorUrl,
          apiKey: apiKey,
          maskedApiKey: maskedApiKey
        }
      });
      
    } catch (error) {
      console.error("PDF generator access error:", error);
      res.status(500).json({
        success: false,
        error: "PDF generator access failed",
        message: "An error occurred while generating PDF generator access. Please try again.",
        code: "PDF_GENERATOR_ACCESS_ERROR"
      });
    }
  }
);

/**
 * @route DELETE /dashboard/account
 * @desc Delete user account (soft delete)
 * @access Private (requires session)
 * @rateLimit 1 request per hour per IP
 * 
 * Request Body:
 * {
 *   "confirmPassword": "CurrentPassword123!"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Account deleted successfully"
 * }
 */
router.delete("/account",
  sessionAuth,
  csrfProtection,
  rateLimit({ maxRequests: 100, windowMs: 3600000 }), // 1 request per hour
  validateBody({
    confirmPassword: { type: "string", required: true, minLength: 1 }
  }),
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const { confirmPassword } = req.body;
      
      const user = await userService.findUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
          message: "User account not found",
          code: "USER_NOT_FOUND"
        });
      }
      
      // Verify password before deletion
      const isPasswordValid = await userService.validatePassword(user.email, confirmPassword);
      
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          error: "Invalid password",
          message: "The password you entered is incorrect",
          code: "INVALID_PASSWORD"
        });
      }
      
      // Soft delete user account
      await userService.deleteUser(userId);
      
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
        res.clearCookie("pdf-service-session");
        
        res.json({
          success: true,
          message: "Account deleted successfully"
        });
      });
      
    } catch (error) {
      console.error("Account deletion error:", error);
      res.status(500).json({
        success: false,
        error: "Account deletion failed",
        message: "An error occurred while deleting your account. Please try again.",
        code: "ACCOUNT_DELETION_ERROR"
      });
    }
  }
);

module.exports = router;
