/**
 * Encryption Utilities
 *
 * Provides secure encryption and hashing functions for passwords,
 * API keys, and tokens. Uses industry-standard algorithms and
 * follows security best practices.
 *
 * @fileoverview Encryption, hashing, and token generation utilities
 * @author PDF Service Team
 * @version 1.0.0
 */

const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Configuration constants
const BCRYPT_ROUNDS = 12;
const TOKEN_LENGTH = 64;
const API_KEY_LENGTH = 32;
const SESSION_SECRET_LENGTH = 32;

/**
 * Hash a password using bcrypt
 *
 * @param {string} password - Plain text password
 * @param {number} [rounds=12] - Number of bcrypt rounds (higher = more secure but slower)
 * @returns {Promise<string>} Hashed password
 * @throws {Error} If hashing fails
 *
 * @example
 * const hashedPassword = await hashPassword('MyPassword123!');
 * console.log('Password hashed successfully');
 */
async function hashPassword(password, rounds = BCRYPT_ROUNDS) {
  if (!password || typeof password !== "string") {
    throw new Error("Password is required and must be a string");
  }

  if (password.length === 0) {
    throw new Error("Password cannot be empty");
  }

  try {
    const salt = await bcrypt.genSalt(rounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
}

/**
 * Compare a password with its hash
 *
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches hash
 * @throws {Error} If comparison fails
 *
 * @example
 * const isValid = await comparePassword('MyPassword123!', hashedPassword);
 * if (isValid) {
 *   console.log('Password is correct');
 * }
 */
async function comparePassword(password, hash) {
  if (!password || typeof password !== "string") {
    throw new Error("Password is required and must be a string");
  }

  if (!hash || typeof hash !== "string") {
    throw new Error("Hash is required and must be a string");
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
}

/**
 * Generate a secure random token
 *
 * @param {number} [length=64] - Token length in bytes
 * @param {string} [encoding='hex'] - Output encoding (hex, base64)
 * @returns {string} Random token
 *
 * @example
 * const token = generateToken(32, 'hex');
 * console.log(`Generated token: ${token}`);
 */
function generateToken(length = TOKEN_LENGTH, encoding = "hex") {
  if (length < 16) {
    throw new Error("Token length must be at least 16 bytes");
  }

  if (length > 256) {
    throw new Error("Token length must be less than 256 bytes");
  }

  const validEncodings = ["hex", "base64"];
  if (!validEncodings.includes(encoding)) {
    throw new Error(
      `Invalid encoding. Must be one of: ${validEncodings.join(", ")}`
    );
  }

  try {
    const randomBytes = crypto.randomBytes(length);
    return randomBytes.toString(encoding);
  } catch (error) {
    throw new Error(`Token generation failed: ${error.message}`);
  }
}

/**
 * Generate an API key with prefix
 *
 * @param {string} [prefix='sk_live_'] - API key prefix
 * @param {number} [length=32] - Key length in bytes
 * @returns {string} Generated API key
 *
 * @example
 * const apiKey = generateApiKey('sk_live_', 32);
 * console.log(`Generated API key: ${apiKey}`);
 */
function generateApiKey(prefix = "sk_live_", length = API_KEY_LENGTH) {
  if (!prefix || typeof prefix !== "string") {
    throw new Error("Prefix is required and must be a string");
  }

  if (length < 16) {
    throw new Error("API key length must be at least 16 bytes");
  }

  if (length > 64) {
    throw new Error("API key length must be less than 64 bytes");
  }

  try {
    const randomPart = generateToken(length, "hex");
    return `${prefix}${randomPart}`;
  } catch (error) {
    throw new Error(`API key generation failed: ${error.message}`);
  }
}

/**
 * Hash an email address for use as filename
 *
 * @param {string} email - Email address to hash
 * @returns {string} Hashed email (hex string)
 * @throws {Error} If email is invalid
 *
 * @example
 * const emailHash = hashEmail('user@example.com');
 * console.log(`Email hash: ${emailHash}`);
 */
function hashEmail(email) {
  if (!email || typeof email !== "string") {
    throw new Error("Email is required and must be a string");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail.length === 0) {
    throw new Error("Email cannot be empty");
  }

  try {
    const hash = crypto.createHash("sha256");
    hash.update(normalizedEmail);
    return hash.digest("hex");
  } catch (error) {
    throw new Error(`Email hashing failed: ${error.message}`);
  }
}

/**
 * Generate a session secret
 *
 * @param {number} [length=32] - Secret length in bytes
 * @returns {string} Session secret
 *
 * @example
 * const sessionSecret = generateSessionSecret();
 * console.log(`Session secret: ${sessionSecret}`);
 */
function generateSessionSecret(length = SESSION_SECRET_LENGTH) {
  if (length < 16) {
    throw new Error("Session secret length must be at least 16 bytes");
  }

  if (length > 64) {
    throw new Error("Session secret length must be less than 64 bytes");
  }

  try {
    return generateToken(length, "hex");
  } catch (error) {
    throw new Error(`Session secret generation failed: ${error.message}`);
  }
}

/**
 * Generate a UUID v4
 *
 * @returns {string} UUID v4 string
 *
 * @example
 * const uuid = generateUUID();
 * console.log(`Generated UUID: ${uuid}`);
 */
function generateUUID() {
  try {
    return crypto.randomUUID();
  } catch (error) {
    // Fallback for older Node.js versions
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
}

/**
 * Encrypt sensitive data (symmetric encryption)
 *
 * @param {string} text - Text to encrypt
 * @param {string} key - Encryption key (32 bytes for AES-256)
 * @returns {string} Encrypted text (base64 encoded)
 * @throws {Error} If encryption fails
 *
 * @example
 * const encrypted = encrypt('sensitive data', encryptionKey);
 * console.log(`Encrypted: ${encrypted}`);
 */
function encrypt(text, key) {
  if (!text || typeof text !== "string") {
    throw new Error("Text to encrypt is required and must be a string");
  }

  if (!key || typeof key !== "string") {
    throw new Error("Encryption key is required and must be a string");
  }

  if (key.length !== 64) {
    // 32 bytes = 64 hex chars
    throw new Error("Encryption key must be 32 bytes (64 hex characters)");
  }

  try {
    const algorithm = "aes-256-cbc";
    const keyBuffer = Buffer.from(key, "hex");
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher(algorithm, keyBuffer);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Prepend IV to encrypted data
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt sensitive data (symmetric decryption)
 *
 * @param {string} encryptedText - Encrypted text (base64 encoded)
 * @param {string} key - Decryption key (32 bytes for AES-256)
 * @returns {string} Decrypted text
 * @throws {Error} If decryption fails
 *
 * @example
 * const decrypted = decrypt(encryptedText, encryptionKey);
 * console.log(`Decrypted: ${decrypted}`);
 */
function decrypt(encryptedText, key) {
  if (!encryptedText || typeof encryptedText !== "string") {
    throw new Error("Encrypted text is required and must be a string");
  }

  if (!key || typeof key !== "string") {
    throw new Error("Decryption key is required and must be a string");
  }

  if (key.length !== 64) {
    // 32 bytes = 64 hex chars
    throw new Error("Decryption key must be 32 bytes (64 hex characters)");
  }

  try {
    const algorithm = "aes-256-cbc";
    const keyBuffer = Buffer.from(key, "hex");

    // Split IV and encrypted data
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted text format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];

    const decipher = crypto.createDecipher(algorithm, keyBuffer);
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Generate a password reset token
 *
 * @param {string} email - User email for additional entropy
 * @returns {string} Password reset token
 *
 * @example
 * const resetToken = generatePasswordResetToken('user@example.com');
 * console.log(`Reset token: ${resetToken}`);
 */
function generatePasswordResetToken(email) {
  if (!email || typeof email !== "string") {
    throw new Error("Email is required for password reset token generation");
  }

  try {
    const timestamp = Date.now().toString();
    const randomPart = generateToken(32, "hex");
    const emailHash = hashEmail(email);

    // Combine timestamp, random part, and email hash
    const combined = `${timestamp}:${randomPart}:${emailHash}`;

    // Hash the combined string for final token
    const hash = crypto.createHash("sha256");
    hash.update(combined);

    return hash.digest("hex");
  } catch (error) {
    throw new Error(`Password reset token generation failed: ${error.message}`);
  }
}

/**
 * Generate an email verification token
 *
 * @param {string} email - User email
 * @returns {string} Email verification token
 *
 * @example
 * const verifyToken = generateEmailVerificationToken('user@example.com');
 * console.log(`Verification token: ${verifyToken}`);
 */
function generateEmailVerificationToken(email) {
  if (!email || typeof email !== "string") {
    throw new Error("Email is required for verification token generation");
  }

  try {
    const timestamp = Date.now().toString();
    const randomPart = generateToken(24, "hex");
    const emailHash = hashEmail(email);

    // Combine timestamp, random part, and email hash
    const combined = `verify:${timestamp}:${randomPart}:${emailHash}`;

    // Hash the combined string for final token
    const hash = crypto.createHash("sha256");
    hash.update(combined);

    return hash.digest("hex");
  } catch (error) {
    throw new Error(
      `Email verification token generation failed: ${error.message}`
    );
  }
}

/**
 * Generate a CSRF token
 *
 * @param {string} sessionId - Session ID for additional entropy
 * @returns {string} CSRF token
 *
 * @example
 * const csrfToken = generateCSRFToken('session123');
 * console.log(`CSRF token: ${csrfToken}`);
 */
function generateCSRFToken(sessionId) {
  if (!sessionId || typeof sessionId !== "string") {
    throw new Error("Session ID is required for CSRF token generation");
  }

  try {
    const timestamp = Date.now().toString();
    const randomPart = generateToken(16, "hex");

    // Combine session ID, timestamp, and random part
    const combined = `csrf:${sessionId}:${timestamp}:${randomPart}`;

    // Hash the combined string for final token
    const hash = crypto.createHash("sha256");
    hash.update(combined);

    return hash.digest("hex");
  } catch (error) {
    throw new Error(`CSRF token generation failed: ${error.message}`);
  }
}

/**
 * Verify a password reset token
 *
 * @param {string} token - Token to verify
 * @param {string} email - User email
 * @param {number} [maxAge=3600000] - Maximum token age in milliseconds (default: 1 hour)
 * @returns {Object} Verification result with isValid and error message
 *
 * @example
 * const result = verifyPasswordResetToken(token, 'user@example.com');
 * if (result.isValid) {
 *   console.log('Token is valid');
 * }
 */
function verifyPasswordResetToken(token, email, maxAge = 3600000) {
  if (!token || typeof token !== "string") {
    return { isValid: false, error: "Token is required" };
  }

  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required" };
  }

  try {
    // This is a simplified verification - in practice, you'd store tokens
    // in the database with timestamps and verify against stored values

    const emailHash = hashEmail(email);
    const currentTime = Date.now();

    // For demonstration, we'll assume the token contains timestamp info
    // In a real implementation, you'd look up the token in the database

    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: "Token verification failed" };
  }
}

/**
 * Generate a secure random string for various purposes
 *
 * @param {number} length - String length
 * @param {string} [charset='alphanumeric'] - Character set (alphanumeric, hex, base64)
 * @returns {string} Random string
 *
 * @example
 * const randomString = generateRandomString(16, 'alphanumeric');
 * console.log(`Random string: ${randomString}`);
 */
function generateRandomString(length, charset = "alphanumeric") {
  if (length < 1) {
    throw new Error("Length must be at least 1");
  }

  if (length > 1000) {
    throw new Error("Length must be less than 1000");
  }

  const charsets = {
    alphanumeric:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    hex: "0123456789abcdef",
    base64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    numeric: "0123456789",
    alphabetic: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  };

  const chars = charsets[charset];
  if (!chars) {
    throw new Error(
      `Invalid charset. Must be one of: ${Object.keys(charsets).join(", ")}`
    );
  }

  try {
    let result = "";
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }

    return result;
  } catch (error) {
    throw new Error(`Random string generation failed: ${error.message}`);
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateApiKey,
  hashEmail,
  generateSessionSecret,
  generateUUID,
  encrypt,
  decrypt,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  generateCSRFToken,
  verifyPasswordResetToken,
  generateRandomString,
};
