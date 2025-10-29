/**
 * Validation Middleware
 *
 * Provides request validation middleware for API endpoints.
 * Validates request bodies, query parameters, and headers
 * using configurable schemas and validation rules.
 *
 * @fileoverview Request validation and sanitization middleware
 * @author PDF Service Team
 * @version 1.0.0
 */

const {
  validateUserRegistration: validateUserRegistrationData,
  validateEmail,
  validatePassword,
  validateDOB,
  validateAddress,
  validateName,
  sanitizeInput,
} = require("../utils/validation");

/**
 * Request Body Validation Middleware
 *
 * Validates request body against provided schema.
 * Supports multiple validation schemas and custom error messages.
 *
 * @param {Object} schema - Validation schema
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.stripUnknown=true] - Remove unknown fields
 * @param {boolean} [options.abortEarly=false] - Stop on first error
 * @returns {Function} Express middleware function
 *
 * @example
 * const userSchema = {
 *   email: { type: 'string', required: true, format: 'email' },
 *   password: { type: 'string', required: true, minLength: 8 }
 * };
 * app.post('/register', validateBody(userSchema), (req, res) => {
 *   // req.body is validated and sanitized
 * });
 */
function validateBody(schema, options = {}) {
  const { stripUnknown = true, abortEarly = false } = options;

  return (req, res, next) => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({
          success: false,
          error: "Invalid request body",
          message: "Request body must be a valid JSON object",
          code: "INVALID_BODY",
        });
      }

      const errors = [];
      const sanitizedBody = {};

      // Validate each field in schema
      for (const [fieldName, fieldSchema] of Object.entries(schema)) {
        const value = req.body[fieldName];

        // Check required fields
        if (
          fieldSchema.required &&
          (value === undefined || value === null || value === "")
        ) {
          errors.push(`${fieldName} is required`);
          if (abortEarly) break;
          continue;
        }

        // Skip validation if field is not required and not provided
        if (
          !fieldSchema.required &&
          (value === undefined || value === null || value === "")
        ) {
          continue;
        }

        // Handle nested object validation
        if (fieldSchema.type === "object" && fieldSchema.fields) {
          const nestedErrors = validateNestedObject(value, fieldSchema.fields, fieldName);
          errors.push(...nestedErrors);
          if (abortEarly && nestedErrors.length > 0) break;
          
          // Store nested object even if there are errors (will return 400 anyway)
          if (fieldSchema.sanitize !== false) {
            sanitizedBody[fieldName] = value; // Keep original nested object
          } else {
            sanitizedBody[fieldName] = value;
          }
          
          continue;
        }

        // Type validation (skip for special types like email)
        if (fieldSchema.type && fieldSchema.type !== "email" && typeof value !== fieldSchema.type) {
          errors.push(`${fieldName} must be a ${fieldSchema.type}`);
          if (abortEarly) break;
          continue;
        }

        // Special format validation for email type
        if (fieldSchema.type === "email") {
          const emailValidation = validateEmail(value);
          if (!emailValidation.isValid) {
            errors.push(`${fieldName} must be a valid email`);
            if (abortEarly) break;
            continue;
          }
        }

        // Format validation
        if (fieldSchema.format) {
          const formatError = validateFieldFormat(
            fieldName,
            value,
            fieldSchema.format
          );
          if (formatError) {
            errors.push(formatError);
            if (abortEarly) break;
            continue;
          }
        }

        // Length validation
        if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
          errors.push(
            `${fieldName} must be at least ${fieldSchema.minLength} characters long`
          );
          if (abortEarly) break;
          continue;
        }

        if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
          errors.push(
            `${fieldName} must be less than ${fieldSchema.maxLength} characters long`
          );
          if (abortEarly) break;
          continue;
        }

        // Sanitize and store value
        if (fieldSchema.sanitize !== false) {
          sanitizedBody[fieldName] = sanitizeInput(value);
        } else {
          sanitizedBody[fieldName] = value;
        }
      }

      // Check for unknown fields
      if (stripUnknown) {
        const unknownFields = Object.keys(req.body).filter(
          (field) => !(field in schema)
        );
        if (unknownFields.length > 0) {
          console.warn(
            `Unknown fields in request body: ${unknownFields.join(", ")}`
          );
        }
      }

      // Return validation errors
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Request validation failed",
          code: "VALIDATION_ERROR",
          details: errors,
        });
      }

      // Replace body with sanitized version
      req.body = sanitizedBody;
      next();
    } catch (error) {
      console.error("Body Validation Middleware Error:", error);

      return res.status(500).json({
        success: false,
        error: "Validation error",
        message: "An error occurred during validation. Please try again.",
        code: "VALIDATION_ERROR",
      });
    }
  };
}

/**
 * Query Parameter Validation Middleware
 *
 * Validates query parameters against provided schema.
 *
 * @param {Object} schema - Validation schema
 * @param {Object} [options] - Validation options
 * @returns {Function} Express middleware function
 *
 * @example
 * const querySchema = {
 *   page: { type: 'number', min: 1, default: 1 },
 *   limit: { type: 'number', min: 1, max: 100, default: 10 }
 * };
 * app.get('/users', validateQuery(querySchema), (req, res) => {
 *   // req.query is validated
 * });
 */
function validateQuery(schema, options = {}) {
  return (req, res, next) => {
    try {
      const errors = [];
      const sanitizedQuery = {};

      // Validate each field in schema
      for (const [fieldName, fieldSchema] of Object.entries(schema)) {
        let value = req.query[fieldName];

        // Apply default value if not provided
        if (value === undefined && fieldSchema.default !== undefined) {
          value = fieldSchema.default;
        }

        // Skip validation if field is not required and not provided
        if (
          !fieldSchema.required &&
          (value === undefined || value === null || value === "")
        ) {
          continue;
        }

        // Check required fields
        if (
          fieldSchema.required &&
          (value === undefined || value === null || value === "")
        ) {
          errors.push(`${fieldName} is required`);
          continue;
        }

        // Type conversion and validation
        if (fieldSchema.type === "number") {
          value = parseFloat(value);
          if (isNaN(value)) {
            errors.push(`${fieldName} must be a number`);
            continue;
          }
        } else if (fieldSchema.type === "boolean") {
          value = value === "true" || value === "1";
        }

        // Range validation for numbers
        if (fieldSchema.type === "number") {
          if (fieldSchema.min !== undefined && value < fieldSchema.min) {
            errors.push(`${fieldName} must be at least ${fieldSchema.min}`);
            continue;
          }
          if (fieldSchema.max !== undefined && value > fieldSchema.max) {
            errors.push(`${fieldName} must be at most ${fieldSchema.max}`);
            continue;
          }
        }

        // Length validation for strings
        if (fieldSchema.type === "string") {
          if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
            errors.push(
              `${fieldName} must be at least ${fieldSchema.minLength} characters long`
            );
            continue;
          }
          if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
            errors.push(
              `${fieldName} must be less than ${fieldSchema.maxLength} characters long`
            );
            continue;
          }
        }

        // Sanitize and store value
        if (fieldSchema.sanitize !== false && typeof value === "string") {
          sanitizedQuery[fieldName] = sanitizeInput(value);
        } else {
          sanitizedQuery[fieldName] = value;
        }
      }

      // Return validation errors
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Query validation failed",
          message: "Query parameter validation failed",
          code: "QUERY_VALIDATION_ERROR",
          details: errors,
        });
      }

      // Replace query with sanitized version
      req.query = sanitizedQuery;
      next();
    } catch (error) {
      console.error("Query Validation Middleware Error:", error);

      return res.status(500).json({
        success: false,
        error: "Query validation error",
        message: "An error occurred during query validation. Please try again.",
        code: "QUERY_VALIDATION_ERROR",
      });
    }
  };
}

/**
 * Header Validation Middleware
 *
 * Validates request headers against provided schema.
 *
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware function
 *
 * @example
 * const headerSchema = {
 *   'content-type': { required: true, pattern: /^application\/json$/ },
 *   'user-agent': { required: true }
 * };
 * app.post('/data', validateHeaders(headerSchema), (req, res) => {
 *   // Headers are validated
 * });
 */
function validateHeaders(schema) {
  return (req, res, next) => {
    try {
      const errors = [];

      // Validate each header in schema
      for (const [headerName, headerSchema] of Object.entries(schema)) {
        const value = req.headers[headerName.toLowerCase()];

        // Check required headers
        if (headerSchema.required && !value) {
          errors.push(`Header ${headerName} is required`);
          continue;
        }

        // Skip validation if header is not required and not provided
        if (!headerSchema.required && !value) {
          continue;
        }

        // Pattern validation
        if (headerSchema.pattern && !headerSchema.pattern.test(value)) {
          errors.push(`Header ${headerName} has invalid format`);
          continue;
        }

        // Length validation
        if (headerSchema.minLength && value.length < headerSchema.minLength) {
          errors.push(
            `Header ${headerName} must be at least ${headerSchema.minLength} characters long`
          );
          continue;
        }

        if (headerSchema.maxLength && value.length > headerSchema.maxLength) {
          errors.push(
            `Header ${headerName} must be less than ${headerSchema.maxLength} characters long`
          );
          continue;
        }
      }

      // Return validation errors
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Header validation failed",
          message: "Request header validation failed",
          code: "HEADER_VALIDATION_ERROR",
          details: errors,
        });
      }

      next();
    } catch (error) {
      console.error("Header Validation Middleware Error:", error);

      return res.status(500).json({
        success: false,
        error: "Header validation error",
        message:
          "An error occurred during header validation. Please try again.",
        code: "HEADER_VALIDATION_ERROR",
      });
    }
  };
}

/**
 * User Registration Validation Middleware
 *
 * Specialized validation for user registration data.
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * app.post('/register', validateUserRegistration(), (req, res) => {
 *   // req.body contains validated user data
 * });
 */
function validateUserRegistration() {
  return (req, res, next) => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({
          success: false,
          error: "Invalid request body",
          message: "Request body must be a valid JSON object",
          code: "INVALID_BODY",
        });
      }

      const validation = validateUserRegistrationData(req.body);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: "Registration validation failed",
          message: "User registration data validation failed",
          code: "REGISTRATION_VALIDATION_ERROR",
          details: validation.errors,
        });
      }

      // Replace body with sanitized data
      req.body = validation.sanitizedData;
      next();
    } catch (error) {
      console.error("User Registration Validation Error:", error);

      return res.status(500).json({
        success: false,
        error: "Registration validation error",
        message:
          "An error occurred during registration validation. Please try again.",
        code: "REGISTRATION_VALIDATION_ERROR",
      });
    }
  };
}

/**
 * Login Validation Middleware
 *
 * Validates login credentials.
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * app.post('/login', validateLogin(), (req, res) => {
 *   // req.body contains validated login data
 * });
 */
function validateLogin() {
  return (req, res, next) => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({
          success: false,
          error: "Invalid request body",
          message: "Request body must be a valid JSON object",
          code: "INVALID_BODY",
        });
      }

      const { email, password } = req.body;
      const errors = [];

      // Validate email
      if (!email || typeof email !== "string") {
        errors.push("Email is required");
      } else {
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
          errors.push(emailValidation.error);
        }
      }

      // Validate password
      if (!password || typeof password !== "string") {
        errors.push("Password is required");
      } else if (password.length === 0) {
        errors.push("Password cannot be empty");
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Login validation failed",
          message: "Login data validation failed",
          code: "LOGIN_VALIDATION_ERROR",
          details: errors,
        });
      }

      // Sanitize email
      req.body.email = email.trim().toLowerCase();
      req.body.password = password; // Don't sanitize password

      next();
    } catch (error) {
      console.error("Login Validation Error:", error);

      return res.status(500).json({
        success: false,
        error: "Login validation error",
        message: "An error occurred during login validation. Please try again.",
        code: "LOGIN_VALIDATION_ERROR",
      });
    }
  };
}

/**
 * Password Change Validation Middleware
 *
 * Validates password change data.
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * app.post('/change-password', validatePasswordChange(), (req, res) => {
 *   // req.body contains validated password change data
 * });
 */
function validatePasswordChange() {
  return (req, res, next) => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({
          success: false,
          error: "Invalid request body",
          message: "Request body must be a valid JSON object",
          code: "INVALID_BODY",
        });
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;
      const errors = [];

      // Validate current password
      if (!currentPassword || typeof currentPassword !== "string") {
        errors.push("Current password is required");
      }

      // Validate new password
      if (!newPassword || typeof newPassword !== "string") {
        errors.push("New password is required");
      } else {
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
          errors.push(passwordValidation.error);
        }
      }

      // Validate password confirmation
      if (!confirmPassword || typeof confirmPassword !== "string") {
        errors.push("Password confirmation is required");
      } else if (newPassword && confirmPassword !== newPassword) {
        errors.push("Password confirmation does not match");
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Password change validation failed",
          message: "Password change data validation failed",
          code: "PASSWORD_CHANGE_VALIDATION_ERROR",
          details: errors,
        });
      }

      // Sanitize data
      req.body.currentPassword = currentPassword;
      req.body.newPassword = newPassword;
      req.body.confirmPassword = confirmPassword;

      next();
    } catch (error) {
      console.error("Password Change Validation Error:", error);

      return res.status(500).json({
        success: false,
        error: "Password change validation error",
        message:
          "An error occurred during password change validation. Please try again.",
        code: "PASSWORD_CHANGE_VALIDATION_ERROR",
      });
    }
  };
}

/**
 * Validate field format based on type
 *
 * @param {string} fieldName - Field name
 * @param {any} value - Field value
 * @param {string} format - Format type
 * @returns {string|null} Error message or null if valid
 */
function validateFieldFormat(fieldName, value, format) {
  switch (format) {
    case "email":
      const emailValidation = validateEmail(value);
      return emailValidation.isValid ? null : emailValidation.error;

    case "password":
      const passwordValidation = validatePassword(value);
      return passwordValidation.isValid ? null : passwordValidation.error;

    case "dob":
      const dobValidation = validateDOB(value);
      return dobValidation.isValid ? null : dobValidation.error;

    case "date":
      const dateValidation = validateDOB(value);
      return dateValidation.isValid ? null : dateValidation.error;

    case "address":
      const addressValidation = validateAddress(value);
      return addressValidation.isValid ? null : addressValidation.error;

    case "name":
      const nameValidation = validateName(value, fieldName);
      return nameValidation.isValid ? null : nameValidation.error;

    default:
      return null;
  }
}

/**
 * Sanitize Request Middleware
 *
 * Sanitizes all string inputs in request body and query.
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * app.use(sanitizeRequest());
 *
 * // All string inputs will be sanitized
 */
function sanitizeRequest() {
  return (req, res, next) => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === "object") {
        req.body = sanitizeObject(req.body);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === "object") {
        req.query = sanitizeObject(req.query);
      }

      next();
    } catch (error) {
      console.error("Sanitize Request Error:", error);
      next();
    }
  };
}

/**
 * Sanitize object recursively
 *
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate nested object fields
 * @param {Object} obj - Object to validate
 * @param {Object} fieldsSchema - Schema for nested fields
 * @param {string} parentField - Parent field name for error messages
 * @returns {Array} Array of error messages
 */
function validateNestedObject(obj, fieldsSchema, parentField) {
  const errors = [];
  
  if (!obj || typeof obj !== "object") {
    errors.push(`${parentField} must be an object`);
    return errors;
  }
  
  for (const [fieldName, fieldSchema] of Object.entries(fieldsSchema)) {
    const value = obj[fieldName];
    const fullFieldName = `${parentField}.${fieldName}`;
    
    // Check required fields
    if (fieldSchema.required && (value === undefined || value === null || value === "")) {
      errors.push(`${fullFieldName} is required`);
      continue;
    }
    
    // Skip validation if field is not required and not provided
    if (!fieldSchema.required && (value === undefined || value === null || value === "")) {
      continue;
    }
    
    // Type validation
    if (fieldSchema.type && typeof value !== fieldSchema.type) {
      errors.push(`${fullFieldName} must be a ${fieldSchema.type}`);
      continue;
    }
    
    // Length validation
    if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
      errors.push(`${fullFieldName} must be at least ${fieldSchema.minLength} characters long`);
      continue;
    }
    
    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
      errors.push(`${fullFieldName} must be less than ${fieldSchema.maxLength} characters long`);
      continue;
    }
    
    // Pattern validation
    if (fieldSchema.pattern) {
      // Add pattern validation logic here if needed
    }
  }
  
  return errors;
}

module.exports = {
  validateBody,
  validateQuery,
  validateHeaders,
  validateUserRegistration,
  validateLogin,
  validatePasswordChange,
  sanitizeRequest,
  sanitizeObject,
};
