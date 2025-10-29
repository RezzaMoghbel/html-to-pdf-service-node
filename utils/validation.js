/**
 * Validation Utilities
 *
 * Provides comprehensive validation functions for user input data.
 * All validation functions include detailed error messages and
 * follow security best practices for input sanitization.
 *
 * @fileoverview Input validation and sanitization utilities
 * @author PDF Service Team
 * @version 1.0.0
 */

/**
 * Validate email address format
 *
 * @param {string} email - Email address to validate
 * @returns {Object} Validation result with isValid and error message
 *
 * @example
 * const result = validateEmail('user@example.com');
 * if (result.isValid) {
 *   console.log('Valid email');
 * } else {
 *   console.log(result.error);
 * }
 */
function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required" };
  }

  // Trim whitespace
  email = email.trim().toLowerCase();

  // Basic length check
  if (email.length < 5 || email.length > 254) {
    return {
      isValid: false,
      error: "Email must be between 5 and 254 characters",
    };
  }

  // RFC 5322 compliant regex (simplified)
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  // Check for common invalid patterns
  if (email.includes("..") || email.startsWith(".") || email.endsWith(".")) {
    return { isValid: false, error: "Email contains invalid characters" };
  }

  return { isValid: true, error: null };
}

/**
 * Validate password strength
 *
 * @param {string} password - Password to validate
 * @param {Object} [options] - Validation options
 * @param {number} [options.minLength=8] - Minimum password length
 * @param {boolean} [options.requireUppercase=true] - Require uppercase letters
 * @param {boolean} [options.requireLowercase=true] - Require lowercase letters
 * @param {boolean} [options.requireNumbers=true] - Require numbers
 * @param {boolean} [options.requireSpecialChars=true] - Require special characters
 * @returns {Object} Validation result with isValid, error, and strength score
 *
 * @example
 * const result = validatePassword('MyPassword123!');
 * console.log(`Password strength: ${result.strength}/100`);
 */
function validatePassword(password, options = {}) {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options;

  if (!password || typeof password !== "string") {
    return { isValid: false, error: "Password is required", strength: 0 };
  }

  // Length check
  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters long`,
      strength: 0,
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: "Password must be less than 128 characters",
      strength: 0,
    };
  }

  // Character type checks
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
    password
  );

  // Check requirements
  if (requireUppercase && !hasUppercase) {
    return {
      isValid: false,
      error: "Password must contain at least one uppercase letter",
      strength: 0,
    };
  }

  if (requireLowercase && !hasLowercase) {
    return {
      isValid: false,
      error: "Password must contain at least one lowercase letter",
      strength: 0,
    };
  }

  if (requireNumbers && !hasNumbers) {
    return {
      isValid: false,
      error: "Password must contain at least one number",
      strength: 0,
    };
  }

  if (requireSpecialChars && !hasSpecialChars) {
    return {
      isValid: false,
      error: "Password must contain at least one special character",
      strength: 0,
    };
  }

  // Calculate strength score (0-100)
  let strength = 0;

  // Length score (0-30 points)
  if (password.length >= minLength) strength += 10;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;

  // Character variety score (0-40 points)
  if (hasUppercase) strength += 10;
  if (hasLowercase) strength += 10;
  if (hasNumbers) strength += 10;
  if (hasSpecialChars) strength += 10;

  // Complexity score (0-30 points)
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.5) strength += 10;
  if (uniqueChars >= password.length * 0.7) strength += 10;
  if (uniqueChars >= password.length * 0.9) strength += 10;

  return { isValid: true, error: null, strength };
}

/**
 * Validate date of birth (DD/MM/YYYY format, age 18+)
 *
 * @param {string} dob - Date of birth in DD/MM/YYYY format
 * @param {number} [minAge=18] - Minimum age requirement
 * @returns {Object} Validation result with isValid and error message
 *
 * @example
 * const result = validateDOB('15/03/1990');
 * if (result.isValid) {
 *   console.log('Valid date of birth');
 * }
 */
function validateDOB(dob, minAge = 18) {
  if (!dob || typeof dob !== "string") {
    return { isValid: false, error: "Date of birth is required" };
  }

  // Decode HTML entities (handle &#x2F; for forward slashes)
  const decodedDob = dob.replace(/&#x2F;/g, '/').replace(/&#47;/g, '/');

  // Check format DD/MM/YYYY
  const dobRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = decodedDob.match(dobRegex);

  if (!match) {
    return {
      isValid: false,
      error: "Date of birth must be in DD/MM/YYYY format",
    };
  }

  const [, day, month, year] = match;
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  // Validate date components
  if (dayNum < 1 || dayNum > 31) {
    return { isValid: false, error: "Invalid day in date of birth" };
  }

  if (monthNum < 1 || monthNum > 12) {
    return { isValid: false, error: "Invalid month in date of birth" };
  }

  if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
    return { isValid: false, error: "Invalid year in date of birth" };
  }

  // Create date object and validate
  const birthDate = new Date(yearNum, monthNum - 1, dayNum);

  // Check if date is valid (handles leap years, etc.)
  if (
    birthDate.getDate() !== dayNum ||
    birthDate.getMonth() !== monthNum - 1 ||
    birthDate.getFullYear() !== yearNum
  ) {
    return { isValid: false, error: "Invalid date of birth" };
  }

  // Check age
  const today = new Date();
  const age = today.getFullYear() - yearNum;
  const monthDiff = today.getMonth() - (monthNum - 1);
  const dayDiff = today.getDate() - dayNum;

  let actualAge = age;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    actualAge--;
  }

  if (actualAge < minAge) {
    return {
      isValid: false,
      error: `You must be at least ${minAge} years old to register`,
    };
  }

  if (actualAge > 120) {
    return { isValid: false, error: "Invalid age" };
  }

  return { isValid: true, error: null };
}

/**
 * Validate UK postcode format
 *
 * @param {string} postcode - Postcode to validate
 * @returns {Object} Validation result with isValid and error message
 *
 * @example
 * const result = validatePostcode('SW1A 1AA');
 * if (result.isValid) {
 *   console.log('Valid UK postcode');
 * }
 */
function validatePostcode(postcode) {
  if (!postcode || typeof postcode !== "string") {
    return { isValid: false, error: "Postcode is required" };
  }

  // Trim and normalize
  postcode = postcode.trim().toUpperCase();

  // UK postcode regex pattern
  // Format: AA9A 9AA or A9A 9AA or A9 9AA or A99 9AA or AA9 9AA or AA99 9AA
  const postcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][A-Z]{2}$/;

  if (!postcodeRegex.test(postcode)) {
    return { isValid: false, error: "Invalid UK postcode format" };
  }

  return { isValid: true, error: null };
}

/**
 * Validate address object
 *
 * @param {Object} address - Address object to validate
 * @returns {Object} Validation result with isValid and error message
 *
 * @example
 * const address = {
 *   address1: '123 Main Street',
 *   city: 'London',
 *   postcode: 'SW1A 1AA',
 *   country: 'United Kingdom'
 * };
 * const result = validateAddress(address);
 */
function validateAddress(address) {
  if (!address || typeof address !== "object") {
    return { isValid: false, error: "Address is required" };
  }

  const { address1, address2, address3, city, postcode, country } = address;

  // Required fields
  if (
    !address1 ||
    typeof address1 !== "string" ||
    address1.trim().length === 0
  ) {
    return { isValid: false, error: "Address line 1 is required" };
  }

  if (!city || typeof city !== "string" || city.trim().length === 0) {
    return { isValid: false, error: "City is required" };
  }

  if (
    !postcode ||
    typeof postcode !== "string" ||
    postcode.trim().length === 0
  ) {
    return { isValid: false, error: "Postcode is required" };
  }

  if (!country || typeof country !== "string" || country.trim().length === 0) {
    return { isValid: false, error: "Country is required" };
  }

  // Length checks
  if (address1.length > 100) {
    return {
      isValid: false,
      error: "Address line 1 must be less than 100 characters",
    };
  }

  if (address2 && address2.length > 100) {
    return {
      isValid: false,
      error: "Address line 2 must be less than 100 characters",
    };
  }

  if (address3 && address3.length > 100) {
    return {
      isValid: false,
      error: "Address line 3 must be less than 100 characters",
    };
  }

  if (city.length > 50) {
    return { isValid: false, error: "City must be less than 50 characters" };
  }

  if (country.length > 50) {
    return { isValid: false, error: "Country must be less than 50 characters" };
  }

  // Validate postcode if UK
  if (
    country.toLowerCase().includes("united kingdom") ||
    country.toLowerCase().includes("uk")
  ) {
    const postcodeResult = validatePostcode(postcode);
    if (!postcodeResult.isValid) {
      return postcodeResult;
    }
  }

  return { isValid: true, error: null };
}

/**
 * Validate name (first name, last name)
 *
 * @param {string} name - Name to validate
 * @param {string} [fieldName='Name'] - Field name for error messages
 * @returns {Object} Validation result with isValid and error message
 *
 * @example
 * const result = validateName('John', 'First name');
 * if (result.isValid) {
 *   console.log('Valid name');
 * }
 */
function validateName(name, fieldName = "Name") {
  if (!name || typeof name !== "string") {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: `${fieldName} must be at least 2 characters long`,
    };
  }

  if (trimmedName.length > 50) {
    return {
      isValid: false,
      error: `${fieldName} must be less than 50 characters`,
    };
  }

  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmedName)) {
    return {
      isValid: false,
      error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
    };
  }

  // Check for consecutive special characters
  if (
    trimmedName.includes("--") ||
    trimmedName.includes("''") ||
    trimmedName.includes("  ")
  ) {
    return {
      isValid: false,
      error: `${fieldName} cannot contain consecutive special characters`,
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate country name
 *
 * @param {string} country - Country name to validate
 * @returns {Object} Validation result with isValid and error message
 *
 * @example
 * const result = validateCountry('United Kingdom');
 * if (result.isValid) {
 *   console.log('Valid country');
 * }
 */
function validateCountry(country) {
  if (!country || typeof country !== "string") {
    return { isValid: false, error: "Country is required" };
  }

  const trimmedCountry = country.trim();

  if (trimmedCountry.length === 0) {
    return { isValid: false, error: "Country cannot be empty" };
  }

  if (trimmedCountry.length > 50) {
    return { isValid: false, error: "Country must be less than 50 characters" };
  }

  // Allow letters, spaces, hyphens, and parentheses
  const countryRegex = /^[a-zA-Z\s\-()]+$/;
  if (!countryRegex.test(trimmedCountry)) {
    return {
      isValid: false,
      error:
        "Country can only contain letters, spaces, hyphens, and parentheses",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Sanitize input to prevent XSS attacks
 *
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 *
 * @example
 * const sanitized = sanitizeInput('<script>alert("xss")</script>');
 * console.log(sanitized); // "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
 */
function sanitizeInput(input) {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate API key format
 *
 * @param {string} apiKey - API key to validate
 * @param {string} [prefix='sk_live_'] - Expected prefix
 * @returns {Object} Validation result with isValid and error message
 *
 * @example
 * const result = validateApiKey('sk_live_example_key_replace');
 * if (result.isValid) {
 *   console.log('Valid API key format');
 * }
 */
function validateApiKey(apiKey, prefix = "sk_live_") {
  if (!apiKey || typeof apiKey !== "string") {
    return { isValid: false, error: "API key is required" };
  }

  if (!apiKey.startsWith(prefix)) {
    return { isValid: false, error: `API key must start with ${prefix}` };
  }

  const keyPart = apiKey.substring(prefix.length);

  if (keyPart.length < 16) {
    return { isValid: false, error: "API key is too short" };
  }

  if (keyPart.length > 64) {
    return { isValid: false, error: "API key is too long" };
  }

  // Allow alphanumeric characters and some special chars
  const keyRegex = /^[a-zA-Z0-9_-]+$/;
  if (!keyRegex.test(keyPart)) {
    return { isValid: false, error: "API key contains invalid characters" };
  }

  return { isValid: true, error: null };
}

/**
 * Validate user registration data
 *
 * @param {Object} userData - User registration data
 * @returns {Object} Validation result with isValid, errors array, and sanitized data
 *
 * @example
 * const userData = {
 *   email: 'user@example.com',
 *   password: 'MyPassword123!',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   dob: '15/03/1990',
 *   address: { ... }
 * };
 * const result = validateUserRegistration(userData);
 */
function validateUserRegistration(userData) {
  const errors = [];
  const sanitizedData = {};

  // Validate email
  const emailResult = validateEmail(userData.email);
  if (!emailResult.isValid) {
    errors.push(emailResult.error);
  } else {
    sanitizedData.email = userData.email.trim().toLowerCase();
  }

  // Validate password
  const passwordResult = validatePassword(userData.password);
  if (!passwordResult.isValid) {
    errors.push(passwordResult.error);
  } else {
    sanitizedData.password = userData.password;
  }

  // Handle nested profile structure
  const profile = userData.profile || userData;
  
  // Validate names
  const firstNameResult = validateName(profile.firstName || userData.firstName, "First name");
  if (!firstNameResult.isValid) {
    errors.push(firstNameResult.error);
  } else {
    sanitizedData.firstName = sanitizeInput((profile.firstName || userData.firstName).trim());
  }

  const lastNameResult = validateName(profile.lastName || userData.lastName, "Last name");
  if (!lastNameResult.isValid) {
    errors.push(lastNameResult.error);
  } else {
    sanitizedData.lastName = sanitizeInput((profile.lastName || userData.lastName).trim());
  }

  // Validate DOB
  const dobResult = validateDOB(profile.dateOfBirth || profile.dob || userData.dateOfBirth || userData.dob);
  if (!dobResult.isValid) {
    errors.push(dobResult.error);
  } else {
    const rawDob = (profile.dateOfBirth || profile.dob || userData.dateOfBirth || userData.dob).trim();
    // Decode HTML entities for storage
    sanitizedData.dob = rawDob.replace(/&#x2F;/g, '/').replace(/&#47;/g, '/');
  }

  // Validate address
  const addressData = profile.address1 ? profile : userData;
  const addressResult = validateAddress(addressData);
  if (!addressResult.isValid) {
    errors.push(addressResult.error);
  } else {
    sanitizedData.address = {
      address1: sanitizeInput(addressData.address1.trim()),
      address2: addressData.address2
        ? sanitizeInput(addressData.address2.trim())
        : "",
      address3: addressData.address3
        ? sanitizeInput(addressData.address3.trim())
        : "",
      city: sanitizeInput(addressData.city.trim()),
      postcode: addressData.postcode.trim().toUpperCase(),
      country: sanitizeInput(addressData.country.trim()),
    };
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData,
  };
}

module.exports = {
  validateEmail,
  validatePassword,
  validateDOB,
  validatePostcode,
  validateAddress,
  validateName,
  validateCountry,
  sanitizeInput,
  validateApiKey,
  validateUserRegistration,
};
