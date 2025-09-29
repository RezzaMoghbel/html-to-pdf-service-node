// Load environment variables first
require("dotenv").config();

const express = require("express");
const path = require("path");
const compression = require("compression");
const morgan = require("morgan");

// Import configuration and middleware
const config = require("./config/environment");
const logger = require("./config/logger");
const {
  helmetConfig,
  rateLimiter,
  corsConfig,
  requestSizeLimiter,
  requestTimeout,
} = require("./middleware/security");
const {
  errorHandler,
  notFoundHandler,
  asyncHandler,
} = require("./middleware/errorHandler");
const { swaggerUi, swaggerDocs } = require("./swagger");

const app = express();

// =============================================================================
// SECURITY MIDDLEWARE (Applied first for maximum protection)
// =============================================================================

// Helmet for security headers (XSS, CSRF, etc.)
app.use(helmetConfig);

// Rate limiting to prevent abuse
app.use(rateLimiter);

// CORS configuration for cross-origin requests
app.use(corsConfig);

// Request size limiting to prevent large payload attacks
app.use(requestSizeLimiter);

// Request timeout to prevent hanging requests
app.use(requestTimeout(config.requestTimeout));

// =============================================================================
// LOGGING AND MONITORING MIDDLEWARE
// =============================================================================

// Request ID middleware for tracing requests across logs
app.use(logger.addRequestId);

// HTTP request logging with Morgan
if (config.isDevelopment) {
  // Detailed logging for development
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
} else {
  // Simplified logging for production
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
      skip: (req, res) => res.statusCode < 400, // Only log errors in production
    })
  );
}

// =============================================================================
// PERFORMANCE MIDDLEWARE
// =============================================================================

// Compression middleware for gzip compression
app.use(
  compression({
    // Only compress responses larger than 1KB
    threshold: 1024,
    // Compression level (1-9, 6 is default)
    level: 6,
    // Filter function to determine what to compress
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// =============================================================================
// BODY PARSING MIDDLEWARE
// =============================================================================

// JSON body parser with configurable limit
app.use(
  express.json({
    limit: config.maxRequestSize,
    // Strict mode to reject arrays and objects at root level
    strict: true,
    // Type checking
    type: "application/json",
  })
);

// URL-encoded body parser
app.use(
  express.urlencoded({
    extended: true,
    limit: config.maxRequestSize,
  })
);

// =============================================================================
// STATIC FILES (Served before API routes for better performance)
// =============================================================================

// Serve static files from public directory
app.use(
  express.static(path.join(__dirname, "public"), {
    // Cache static files for 1 day in production
    maxAge: config.isProduction ? "1d" : 0,
    // Enable ETags for better caching
    etag: true,
    // Set proper headers for static files
    setHeaders: (res, path) => {
      if (path.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

// Serve test-data files for development
app.use("/test-data", express.static(path.join(__dirname, "test-data")));

// =============================================================================
// API ROUTES (Versioned and organized)
// =============================================================================

// Health check routes (no versioning needed for monitoring)
const healthRoutes = require("./routes/health");
app.use("/health", healthRoutes);
app.use("/api/v1/health", healthRoutes); // Also available under API prefix

// Import API routes
const html2pdf = require("./routes/html2pdf");

// Apply API versioning and route organization
app.use(`${config.apiPrefix}/html2pdf`, html2pdf);

// =============================================================================
// API DOCUMENTATION (Swagger UI)
// =============================================================================

// Swagger UI with proper CORS and security
app.use(
  "/swagger",
  // Additional CORS for Swagger UI
  corsConfig,
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs, {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .response-col_status { font-weight: bold; }
      .swagger-ui .response-col_status[data-code="200"] { color: #28a745; }
      .swagger-ui .response-col_status[data-code="400"] { color: #dc3545; }
      .swagger-ui .response-col_status[data-code="500"] { color: #dc3545; }
    `,
    customSiteTitle: "PDF Service API Documentation",
    customJs: `
      // Auto-download PDF responses
      window.addEventListener('load', function() {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          return originalFetch.apply(this, args).then(response => {
            if (response.headers.get('content-type') === 'application/pdf') {
              response.clone().blob().then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = response.headers.get('content-disposition') ? 
                  response.headers.get('content-disposition').split('filename=')[1]?.replace(/"/g, '') || 'download.pdf' : 
                  'download.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              });
            }
            return response;
          });
        };
      });
    `,
  })
);

// =============================================================================
// ERROR HANDLING MIDDLEWARE (Must be last)
// =============================================================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last middleware)
app.use(errorHandler);

// =============================================================================
// GRACEFUL SHUTDOWN HANDLING
// =============================================================================

// Graceful shutdown handling for production
let server; // Declare server variable in the correct scope

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Close server gracefully
  if (server) {
    server.close((err) => {
      if (err) {
        logger.error("Error during server shutdown:", err);
        process.exit(1);
      }

      logger.info("Server closed successfully");
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  }
};

// Handle different shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

module.exports = app;

// =============================================================================
// SERVER STARTUP (Only when run directly, not when imported)
// =============================================================================

// Start server only if run directly
if (require.main === module) {
  // Create server instance for graceful shutdown
  server = app.listen(config.port, () => {
    logger.info(`🚀 PDF Service started successfully`, {
      port: config.port,
      environment: config.nodeEnv,
      apiPrefix: config.apiPrefix,
      healthCheck: `http://localhost:${config.port}/health`,
      swaggerDocs: `http://localhost:${config.port}/swagger`,
      timestamp: new Date().toISOString(),
    });

    // Development-specific logging
    if (config.isDevelopment) {
      console.log(`\n📋 Available endpoints:`);
      console.log(`   Health Check: http://localhost:${config.port}/health`);
      console.log(`   API Docs:     http://localhost:${config.port}/swagger`);
      console.log(`   Static Files: http://localhost:${config.port}/`);
      console.log(`\n🔧 Environment: ${config.nodeEnv}`);
      console.log(`📦 API Version: ${config.apiPrefix}`);
    }
  });

  // Handle server errors
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Port ${config.port} is already in use`);
    } else {
      logger.error("Server error:", err);
    }
    process.exit(1);
  });

  // Set server timeout
  server.timeout = config.requestTimeout;
}
