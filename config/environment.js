// config/environment.js
// Environment configuration with sensible defaults
// This centralizes all environment variables and provides fallback values

module.exports = {
  // Server Configuration
  port: process.env.PORT || 9005,
  nodeEnv: process.env.NODE_ENV || "development",

  // API Configuration
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  apiTimeout: parseInt(process.env.API_TIMEOUT) || 30000,

  // Security Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  corsOrigin: process.env.CORS_ORIGIN || "*",

  // Logging Configuration
  logLevel: process.env.LOG_LEVEL || "info",
  logFile: process.env.LOG_FILE || "logs/app.log",

  // Puppeteer Configuration
  puppeteer: {
    headless: process.env.PUPPETEER_HEADLESS !== "false",
    args: process.env.PUPPETEER_ARGS
      ? process.env.PUPPETEER_ARGS.split(",")
      : ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  },

  // Request Configuration
  maxRequestSize: process.env.MAX_REQUEST_SIZE || "10mb",
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,

  // Development vs Production settings
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};
