/**
 * Configuration Service
 *
 * Manages system-wide configuration settings stored in JSON files.
 * Provides thread-safe configuration updates and validation.
 *
 * @fileoverview System configuration management service
 * @author PDF Service Team
 * @version 1.0.0
 */

const path = require("path");
const {
  readJSONFile,
  writeJSONFile,
  fileExists,
  ensureDirectory,
} = require("../utils/fileSystem");

// Configuration file paths
const CONFIG_DIR = path.join(process.cwd(), "database", "config");
const SYSTEM_CONFIG_PATH = path.join(CONFIG_DIR, "system.json");

// Default configuration
const DEFAULT_CONFIG = {
  emailVerificationEnabled: false,
  defaultRateLimit: 1000,
  defaultRateLimitPeriod: "day",
  maxFailedLogins: 30,
  passwordResetTokenExpiry: 3600000,
  sessionMaxAge: 86400000,
  apiKeyPrefix: "sk_live_",
  apiKeyLength: 32,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  minAge: 18,
  supportedCountries: [
    "United Kingdom",
    "United States",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Spain",
    "Italy",
    "Netherlands",
    "Sweden",
    "Norway",
    "Denmark",
  ],
  rateLimitPeriods: {
    hour: 3600000,
    day: 86400000,
    week: 604800000,
    month: 2592000000,
  },
  security: {
    bcryptRounds: 12,
    tokenLength: 64,
    sessionSecretLength: 32,
    maxLoginAttemptsPerIP: 10,
    lockoutDuration: 900000,
  },
  features: {
    enableRegistration: true,
    enablePasswordReset: true,
    enableEmailVerification: false,
    enableApiKeyRegeneration: true,
    enableUsageTracking: true,
    enableRateLimiting: true,
    enableAccountBlocking: true,
  },
  logging: {
    logFailedLogins: true,
    logApiUsage: true,
    logPasswordChanges: true,
    logAccountBlocks: true,
    logRetentionDays: 30,
  },
};

/**
 * Get system configuration
 *
 * @returns {Promise<Object>} System configuration object
 * @throws {Error} If configuration cannot be loaded
 *
 * @example
 * const config = await getConfig();
 * console.log(`Email verification enabled: ${config.emailVerificationEnabled}`);
 */
async function getConfig() {
  try {
    // Ensure config directory exists
    await ensureDirectory(CONFIG_DIR);

    // Check if config file exists
    if (await fileExists(SYSTEM_CONFIG_PATH)) {
      const config = await readJSONFile(SYSTEM_CONFIG_PATH);

      // Merge with defaults to ensure all properties exist
      return { ...DEFAULT_CONFIG, ...config };
    } else {
      // Create default config file
      await writeJSONFile(SYSTEM_CONFIG_PATH, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error("Failed to load system configuration:", error);
    // Return default config as fallback
    return DEFAULT_CONFIG;
  }
}

/**
 * Update system configuration
 *
 * @param {Object} updates - Configuration updates to apply
 * @returns {Promise<Object>} Updated configuration object
 * @throws {Error} If update fails or validation fails
 *
 * @example
 * const updatedConfig = await updateConfig({
 *   emailVerificationEnabled: true,
 *   defaultRateLimit: 2000
 * });
 */
async function updateConfig(updates) {
  if (!updates || typeof updates !== "object") {
    throw new Error("Updates must be a valid object");
  }

  try {
    // Get current config
    const currentConfig = await getConfig();

    // Validate updates
    const validationResult = validateConfigUpdates(updates);
    if (!validationResult.isValid) {
      throw new Error(
        `Configuration validation failed: ${validationResult.error}`
      );
    }

    // Merge updates with current config
    const updatedConfig = { ...currentConfig, ...updates };

    // Write updated config
    await writeJSONFile(SYSTEM_CONFIG_PATH, updatedConfig);

    return updatedConfig;
  } catch (error) {
    throw new Error(`Failed to update configuration: ${error.message}`);
  }
}

/**
 * Toggle email verification feature
 *
 * @param {boolean} enabled - Whether to enable email verification
 * @returns {Promise<Object>} Updated configuration object
 * @throws {Error} If update fails
 *
 * @example
 * const config = await toggleEmailVerification(true);
 * console.log(`Email verification: ${config.emailVerificationEnabled}`);
 */
async function toggleEmailVerification(enabled) {
  if (typeof enabled !== "boolean") {
    throw new Error("Email verification status must be a boolean");
  }

  return await updateConfig({
    emailVerificationEnabled: enabled,
    features: {
      ...(await getConfig()).features,
      enableEmailVerification: enabled,
    },
  });
}

/**
 * Update rate limiting configuration
 *
 * @param {number} limit - Default rate limit
 * @param {string} period - Rate limit period (hour, day, week, month)
 * @returns {Promise<Object>} Updated configuration object
 * @throws {Error} If update fails or validation fails
 *
 * @example
 * const config = await updateRateLimits(2000, 'day');
 * console.log(`Rate limit: ${config.defaultRateLimit} per ${config.defaultRateLimitPeriod}`);
 */
async function updateRateLimits(limit, period) {
  if (typeof limit !== "number" || limit < 1) {
    throw new Error("Rate limit must be a positive number");
  }

  const validPeriods = ["hour", "day", "week", "month"];
  if (!validPeriods.includes(period)) {
    throw new Error(
      `Rate limit period must be one of: ${validPeriods.join(", ")}`
    );
  }

  return await updateConfig({
    defaultRateLimit: limit,
    defaultRateLimitPeriod: period,
  });
}

/**
 * Update security settings
 *
 * @param {Object} securityUpdates - Security settings to update
 * @returns {Promise<Object>} Updated configuration object
 * @throws {Error} If update fails or validation fails
 *
 * @example
 * const config = await updateSecuritySettings({
 *   bcryptRounds: 14,
 *   maxLoginAttemptsPerIP: 5
 * });
 */
async function updateSecuritySettings(securityUpdates) {
  if (!securityUpdates || typeof securityUpdates !== "object") {
    throw new Error("Security updates must be a valid object");
  }

  const currentConfig = await getConfig();
  const updatedSecurity = { ...currentConfig.security, ...securityUpdates };

  return await updateConfig({
    security: updatedSecurity,
  });
}

/**
 * Update feature flags
 *
 * @param {Object} featureUpdates - Feature flags to update
 * @returns {Promise<Object>} Updated configuration object
 * @throws {Error} If update fails or validation fails
 *
 * @example
 * const config = await updateFeatureFlags({
 *   enableRegistration: false,
 *   enableApiKeyRegeneration: true
 * });
 */
async function updateFeatureFlags(featureUpdates) {
  if (!featureUpdates || typeof featureUpdates !== "object") {
    throw new Error("Feature updates must be a valid object");
  }

  const currentConfig = await getConfig();
  const updatedFeatures = { ...currentConfig.features, ...featureUpdates };

  return await updateConfig({
    features: updatedFeatures,
  });
}

/**
 * Validate configuration updates
 *
 * @param {Object} updates - Updates to validate
 * @returns {Object} Validation result with isValid and error message
 *
 * @example
 * const result = validateConfigUpdates({ emailVerificationEnabled: true });
 * if (!result.isValid) {
 *   console.log(result.error);
 * }
 */
function validateConfigUpdates(updates) {
  const validKeys = Object.keys(DEFAULT_CONFIG);
  const updateKeys = Object.keys(updates);

  // Check for invalid keys
  const invalidKeys = updateKeys.filter((key) => !validKeys.includes(key));
  if (invalidKeys.length > 0) {
    return {
      isValid: false,
      error: `Invalid configuration keys: ${invalidKeys.join(", ")}`,
    };
  }

  // Validate specific fields
  if (
    updates.emailVerificationEnabled !== undefined &&
    typeof updates.emailVerificationEnabled !== "boolean"
  ) {
    return {
      isValid: false,
      error: "emailVerificationEnabled must be a boolean",
    };
  }

  if (
    updates.defaultRateLimit !== undefined &&
    (typeof updates.defaultRateLimit !== "number" ||
      updates.defaultRateLimit < 1)
  ) {
    return {
      isValid: false,
      error: "defaultRateLimit must be a positive number",
    };
  }

  if (updates.defaultRateLimitPeriod !== undefined) {
    const validPeriods = ["hour", "day", "week", "month"];
    if (!validPeriods.includes(updates.defaultRateLimitPeriod)) {
      return {
        isValid: false,
        error: `defaultRateLimitPeriod must be one of: ${validPeriods.join(
          ", "
        )}`,
      };
    }
  }

  if (
    updates.maxFailedLogins !== undefined &&
    (typeof updates.maxFailedLogins !== "number" || updates.maxFailedLogins < 1)
  ) {
    return {
      isValid: false,
      error: "maxFailedLogins must be a positive number",
    };
  }

  if (
    updates.passwordMinLength !== undefined &&
    (typeof updates.passwordMinLength !== "number" ||
      updates.passwordMinLength < 4)
  ) {
    return {
      isValid: false,
      error: "passwordMinLength must be at least 4",
    };
  }

  if (
    updates.minAge !== undefined &&
    (typeof updates.minAge !== "number" ||
      updates.minAge < 13 ||
      updates.minAge > 120)
  ) {
    return {
      isValid: false,
      error: "minAge must be between 13 and 120",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Reset configuration to defaults
 *
 * @returns {Promise<Object>} Default configuration object
 * @throws {Error} If reset fails
 *
 * @example
 * const config = await resetConfigToDefaults();
 * console.log('Configuration reset to defaults');
 */
async function resetConfigToDefaults() {
  try {
    await writeJSONFile(SYSTEM_CONFIG_PATH, DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  } catch (error) {
    throw new Error(`Failed to reset configuration: ${error.message}`);
  }
}

/**
 * Get configuration value by key path
 *
 * @param {string} keyPath - Dot-separated key path (e.g., 'security.bcryptRounds')
 * @returns {Promise<any>} Configuration value
 * @throws {Error} If key path is invalid
 *
 * @example
 * const bcryptRounds = await getConfigValue('security.bcryptRounds');
 * console.log(`Bcrypt rounds: ${bcryptRounds}`);
 */
async function getConfigValue(keyPath) {
  if (!keyPath || typeof keyPath !== "string") {
    throw new Error("Key path is required and must be a string");
  }

  const config = await getConfig();
  const keys = keyPath.split(".");

  let value = config;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      throw new Error(`Configuration key not found: ${keyPath}`);
    }
  }

  return value;
}

/**
 * Check if a feature is enabled
 *
 * @param {string} featureName - Name of the feature to check
 * @returns {Promise<boolean>} True if feature is enabled
 * @throws {Error} If feature name is invalid
 *
 * @example
 * const isEnabled = await isFeatureEnabled('enableRegistration');
 * if (isEnabled) {
 *   console.log('Registration is enabled');
 * }
 */
async function isFeatureEnabled(featureName) {
  if (!featureName || typeof featureName !== "string") {
    throw new Error("Feature name is required and must be a string");
  }

  const config = await getConfig();

  // Check both top-level and features object
  if (featureName in config) {
    return config[featureName];
  }

  if (config.features && featureName in config.features) {
    return config.features[featureName];
  }

  throw new Error(`Feature not found: ${featureName}`);
}

/**
 * Get supported countries list
 *
 * @returns {Promise<string[]>} Array of supported countries
 *
 * @example
 * const countries = await getSupportedCountries();
 * console.log(`Supported countries: ${countries.join(', ')}`);
 */
async function getSupportedCountries() {
  const config = await getConfig();
  return config.supportedCountries || [];
}

/**
 * Get rate limit period in milliseconds
 *
 * @param {string} period - Period name (hour, day, week, month)
 * @returns {Promise<number>} Period in milliseconds
 * @throws {Error} If period is invalid
 *
 * @example
 * const dayInMs = await getRateLimitPeriodMs('day');
 * console.log(`Day period: ${dayInMs}ms`);
 */
async function getRateLimitPeriodMs(period) {
  const config = await getConfig();

  if (!config.rateLimitPeriods || !(period in config.rateLimitPeriods)) {
    throw new Error(`Invalid rate limit period: ${period}`);
  }

  return config.rateLimitPeriods[period];
}

/**
 * Export configuration to JSON string
 *
 * @returns {Promise<string>} JSON string of configuration
 *
 * @example
 * const configJson = await exportConfig();
 * console.log('Configuration exported');
 */
async function exportConfig() {
  const config = await getConfig();
  return JSON.stringify(config, null, 2);
}

/**
 * Import configuration from JSON string
 *
 * @param {string} configJson - JSON string of configuration
 * @returns {Promise<Object>} Imported configuration object
 * @throws {Error} If import fails or validation fails
 *
 * @example
 * const config = await importConfig(configJsonString);
 * console.log('Configuration imported successfully');
 */
async function importConfig(configJson) {
  if (!configJson || typeof configJson !== "string") {
    throw new Error("Configuration JSON is required and must be a string");
  }

  try {
    const importedConfig = JSON.parse(configJson);

    // Validate imported configuration
    const validationResult = validateConfigUpdates(importedConfig);
    if (!validationResult.isValid) {
      throw new Error(
        `Imported configuration validation failed: ${validationResult.error}`
      );
    }

    // Write imported configuration
    await writeJSONFile(SYSTEM_CONFIG_PATH, importedConfig);

    return importedConfig;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON format in imported configuration");
    }
    throw new Error(`Configuration import failed: ${error.message}`);
  }
}

module.exports = {
  getConfig,
  updateConfig,
  toggleEmailVerification,
  updateRateLimits,
  updateSecuritySettings,
  updateFeatureFlags,
  validateConfigUpdates,
  resetConfigToDefaults,
  getConfigValue,
  isFeatureEnabled,
  getSupportedCountries,
  getRateLimitPeriodMs,
  exportConfig,
  importConfig,
};
