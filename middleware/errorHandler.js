// middleware/errorHandler.js
// Global error handling middleware
// Provides centralized error handling with proper logging and user-friendly responses

const logger = require("../config/logger");

/**
 * Global error handling middleware
 * Catches all errors and provides consistent error responses
 */
const errorHandler = (err, req, res, next) => {
  // Log the error with request context
  const errorInfo = {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    requestId: req.requestId,
  };

  // Log error based on severity
  if (err.status >= 500) {
    logger.error("Server error occurred", errorInfo);
  } else {
    logger.warn("Client error occurred", errorInfo);
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === "development";

  // Default error response
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  } else if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File too large";
  } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = "Unexpected field";
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: message,
      statusCode: statusCode,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  };

  // Include stack trace in development
  if (isDevelopment && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  // Check if this is an API request or HTML request
  const isApiRequest =
    req.originalUrl.startsWith("/api/") ||
    req.originalUrl.startsWith("/swagger") ||
    req.get("Accept")?.includes("application/json") ||
    req.get("Content-Type")?.includes("application/json");

  if (isApiRequest) {
    // Send JSON error response for API requests
    res.status(statusCode).json(errorResponse);
  } else {
    // Send HTML error page for browser requests
    if (statusCode === 404) {
      res.status(404).sendFile("404.html", { root: "public" });
    } else {
      // For other errors, send a simple HTML error page
      res.status(statusCode).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error ${statusCode}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #e53e3e; font-size: 2rem; margin-bottom: 1rem; }
            .message { color: #4a5568; font-size: 1.1rem; }
          </style>
        </head>
        <body>
          <div class="error">Error ${statusCode}</div>
          <div class="message">${message}</div>
          <p><a href="/">Go Home</a></p>
        </body>
        </html>
      `);
    }
  }
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  const error = new Error(`Route ${req.method} ${req.originalUrl} not found`);
  error.status = 404;

  logger.warn("Route not found", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    requestId: req.requestId,
  });

  // Check if this is an API request or HTML request
  const isApiRequest =
    req.originalUrl.startsWith("/api/") ||
    req.originalUrl.startsWith("/swagger") ||
    req.get("Accept")?.includes("application/json") ||
    req.get("Content-Type")?.includes("application/json");

  if (isApiRequest) {
    // Return JSON for API requests
    res.status(404).json({
      success: false,
      error: {
        message: "Route not found",
        statusCode: 404,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } else {
    // Return HTML 404 page for browser requests
    res.status(404).sendFile("404.html", { root: "public" });
  }
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
