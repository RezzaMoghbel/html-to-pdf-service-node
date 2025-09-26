// config/logger.js
// Winston logger configuration for structured logging
// Provides different log levels and formats for development and production

const winston = require("winston");
const path = require("path");
const { nodeEnv, logLevel, logFile } = require("./environment");

// Define log format for different environments
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development (more readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: "pdf-service" },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: nodeEnv === "development" ? consoleFormat : logFormat,
    }),

    // File transport for errors
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: logFile,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add request ID to logs
logger.addRequestId = (req, res, next) => {
  req.requestId = req.headers["x-request-id"] || require("uuid").v4();
  req.logger = logger.child({ requestId: req.requestId });
  next();
};

module.exports = logger;
