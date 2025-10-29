// middleware/security.js
// Security middleware configuration
// Provides comprehensive security measures including helmet, rate limiting, and CORS

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const {
  rateLimit: rateLimitConfig,
  corsOrigin,
} = require("../config/environment");

/**
 * Helmet configuration for security headers
 * Protects against common vulnerabilities
 */
const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com",
      ],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // Prevent clickjacking
  frameguard: { action: "deny" },
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // Prevent MIME type sniffing
  noSniff: true,
  // XSS Protection
  xssFilter: true,
  // Referrer Policy
  referrerPolicy: { policy: "same-origin" },
  // HSTS (only in production with HTTPS)
  hsts:
    process.env.NODE_ENV === "production"
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
});

/**
 * Rate limiting configuration
 * Prevents abuse and DoS attacks
 */
const rateLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.maxRequests,
  message: {
    success: false,
    error: {
      message: "Too many requests from this IP, please try again later",
      statusCode: 429,
      retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health checks, authentication endpoints, and dashboard
  skip: (req) => {
    const skipPaths = [
      "/health",
      "/api/v1/health",
      "/auth/logout",
      "/auth/session",
      "/auth/refresh-session",
      "/dashboard/stats",
      "/dashboard/api-key",
      "/dashboard/api-key/generate",
      "/dashboard/api-key/regenerate",
      "/dashboard/usage",
      "/dashboard/profile"
    ];
    return skipPaths.includes(req.path);
  },
});

/**
 * CORS configuration
 * Controls cross-origin resource sharing
 */
const corsConfig = cors({
  origin: corsOrigin === "*" ? true : corsOrigin.split(","),
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  credentials: true,
  optionsSuccessStatus: 200,
});

/**
 * Request size limiter
 * Prevents large payload attacks
 */
const requestSizeLimiter = (req, res, next) => {
  const contentLength = parseInt(req.get("content-length") || "0");
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      error: {
        message: "Request entity too large",
        statusCode: 413,
        maxSize: "10MB",
      },
    });
  }

  next();
};

/**
 * Request timeout handler
 * Prevents hanging requests
 */
const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: {
            message: "Request timeout",
            statusCode: 408,
            timeout: `${timeout}ms`,
          },
        });
      }
    });
    next();
  };
};

module.exports = {
  helmetConfig,
  rateLimiter,
  corsConfig,
  requestSizeLimiter,
  requestTimeout,
};
