module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],
  collectCoverageFrom: [
    "routes/**/*.js",
    "utils/**/*.js",
    "middleware/**/*.js",
    "config/**/*.js",
    "app.js",
    "!**/node_modules/**",
    "!**/tests/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 30000,
  verbose: true,
};
