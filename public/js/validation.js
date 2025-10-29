/**
 * Frontend Validation Module
 * 
 * This module provides comprehensive client-side validation functions for forms,
 * input fields, and user data. It includes validation for email addresses,
 * passwords, dates, addresses, and other common form fields.
 * 
 * Features:
 * - Email validation with format checking
 * - Password strength validation with requirements
 * - Date of birth validation (DD/MM/YYYY format)
 * - Address and contact information validation
 * - Real-time validation with visual feedback
 * - Accessibility support with ARIA attributes
 * - Error message management and display
 * 
 * Usage:
 * ```javascript
 * import { validateEmail, validatePassword, validateForm } from './validation.js';
 * 
 * // Validate individual fields
 * const emailValid = validateEmail('user@example.com');
 * const passwordValid = validatePassword('SecurePass123!');
 * 
 * // Validate entire form
 * const formData = new FormData(form);
 * const validation = validateForm(formData, validationRules);
 * ```
 */

/**
 * Email validation with comprehensive format checking
 * @param {string} email - Email address to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateEmail(email) {
    if (!email || typeof email !== "string") {
        return { isValid: false, error: "Email is required" };
    }
    
    const trimmedEmail = email.trim().toLowerCase();
    
    if (trimmedEmail.length === 0) {
        return { isValid: false, error: "Email is required" };
    }
    
    if (trimmedEmail.length < 5 || trimmedEmail.length > 254) {
        return { isValid: false, error: "Email must be between 5 and 254 characters" };
    }
    
    // Basic email format validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(trimmedEmail)) {
        return { isValid: false, error: "Please enter a valid email address" };
    }
    
    // Check for invalid patterns
    if (trimmedEmail.includes("..") || trimmedEmail.startsWith(".") || trimmedEmail.endsWith(".")) {
        return { isValid: false, error: "Email contains invalid characters" };
    }
    
    // Check for common typos in domain
    const commonDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
    const domain = trimmedEmail.split("@")[1];
    
    if (commonDomains.some(commonDomain => domain.includes(commonDomain.replace(".", "")))) {
        return { isValid: false, error: "Please check your email domain for typos" };
    }
    
    return { isValid: true, error: null };
}

/**
 * Password validation with strength requirements
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validatePassword(password, options = {}) {
    const {
        minLength = 8,
        requireUppercase = true,
        requireLowercase = true,
        requireNumbers = true,
        requireSpecialChars = true,
        maxLength = 128
    } = options;
    
    if (!password || typeof password !== "string") {
        return { isValid: false, error: "Password is required" };
    }
    
    if (password.length < minLength) {
        return { isValid: false, error: `Password must be at least ${minLength} characters long` };
    }
    
    if (password.length > maxLength) {
        return { isValid: false, error: `Password must be no more than ${maxLength} characters long` };
    }
    
    if (requireUppercase && !/[A-Z]/.test(password)) {
        return { isValid: false, error: "Password must contain at least one uppercase letter" };
    }
    
    if (requireLowercase && !/[a-z]/.test(password)) {
        return { isValid: false, error: "Password must contain at least one lowercase letter" };
    }
    
    if (requireNumbers && !/\d/.test(password)) {
        return { isValid: false, error: "Password must contain at least one number" };
    }
    
    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, error: "Password must contain at least one special character" };
    }
    
    // Check for common weak passwords
    const commonPasswords = [
        "password", "123456", "123456789", "qwerty", "abc123", "password123",
        "admin", "letmein", "welcome", "monkey", "1234567890", "dragon"
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
        return { isValid: false, error: "Password is too common. Please choose a more secure password" };
    }
    
    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
        return { isValid: false, error: "Password cannot contain more than 2 consecutive identical characters" };
    }
    
    return { isValid: true, error: null };
}

/**
 * Date of birth validation (DD/MM/YYYY format)
 * @param {string} dateOfBirth - Date string to validate
 * @param {number} minAge - Minimum age requirement (default: 18)
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateDateOfBirth(dateOfBirth, minAge = 18) {
    if (!dateOfBirth || typeof dateOfBirth !== "string") {
        return { isValid: false, error: "Date of birth is required" };
    }
    
    const trimmedDate = dateOfBirth.trim();
    
    // Check format DD/MM/YYYY
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = trimmedDate.match(dateRegex);
    
    if (!match) {
        return { isValid: false, error: "Please enter date in DD/MM/YYYY format" };
    }
    
    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Validate date components
    if (dayNum < 1 || dayNum > 31) {
        return { isValid: false, error: "Invalid day. Please enter a valid date" };
    }
    
    if (monthNum < 1 || monthNum > 12) {
        return { isValid: false, error: "Invalid month. Please enter a valid date" };
    }
    
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
        return { isValid: false, error: "Invalid year. Please enter a valid date" };
    }
    
    // Create date object and validate
    const date = new Date(yearNum, monthNum - 1, dayNum);
    
    if (date.getDate() !== dayNum || date.getMonth() !== monthNum - 1 || date.getFullYear() !== yearNum) {
        return { isValid: false, error: "Invalid date. Please enter a valid date" };
    }
    
    // Check age requirement
    const today = new Date();
    const age = today.getFullYear() - yearNum;
    const monthDiff = today.getMonth() - (monthNum - 1);
    const dayDiff = today.getDate() - dayNum;
    
    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        actualAge--;
    }
    
    if (actualAge < minAge) {
        return { isValid: false, error: `You must be at least ${minAge} years old to register` };
    }
    
    if (actualAge > 120) {
        return { isValid: false, error: "Please enter a valid date of birth" };
    }
    
    return { isValid: true, error: null };
}

/**
 * Name validation (first name, last name)
 * @param {string} name - Name to validate
 * @param {string} fieldName - Field name for error messages
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateName(name, fieldName = "Name") {
    if (!name || typeof name !== "string") {
        return { isValid: false, error: `${fieldName} is required` };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length === 0) {
        return { isValid: false, error: `${fieldName} is required` };
    }
    
    if (trimmedName.length < 1) {
        return { isValid: false, error: `${fieldName} must be at least 1 character long` };
    }
    
    if (trimmedName.length > 50) {
        return { isValid: false, error: `${fieldName} must be no more than 50 characters long` };
    }
    
    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
        return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
    }
    
    // Check for consecutive special characters
    if (/[\s\-']{2,}/.test(trimmedName)) {
        return { isValid: false, error: `${fieldName} cannot contain consecutive special characters` };
    }
    
    return { isValid: true, error: null };
}

/**
 * Address validation
 * @param {string} address - Address to validate
 * @param {string} fieldName - Field name for error messages
 * @param {boolean} required - Whether the field is required
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateAddress(address, fieldName = "Address", required = true) {
    if (!address || typeof address !== "string") {
        if (required) {
            return { isValid: false, error: `${fieldName} is required` };
        }
        return { isValid: true, error: null };
    }
    
    const trimmedAddress = address.trim();
    
    if (required && trimmedAddress.length === 0) {
        return { isValid: false, error: `${fieldName} is required` };
    }
    
    if (trimmedAddress.length > 0 && trimmedAddress.length < 1) {
        return { isValid: false, error: `${fieldName} must be at least 1 character long` };
    }
    
    if (trimmedAddress.length > 100) {
        return { isValid: false, error: `${fieldName} must be no more than 100 characters long` };
    }
    
    // Check for valid characters (letters, numbers, spaces, common address characters)
    if (!/^[a-zA-Z0-9\s\-\.,#\/]+$/.test(trimmedAddress)) {
        return { isValid: false, error: `${fieldName} contains invalid characters` };
    }
    
    return { isValid: true, error: null };
}

/**
 * Postcode validation
 * @param {string} postcode - Postcode to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validatePostcode(postcode) {
    if (!postcode || typeof postcode !== "string") {
        return { isValid: false, error: "Postcode is required" };
    }
    
    const trimmedPostcode = postcode.trim();
    
    if (trimmedPostcode.length === 0) {
        return { isValid: false, error: "Postcode is required" };
    }
    
    if (trimmedPostcode.length < 1) {
        return { isValid: false, error: "Postcode must be at least 1 character long" };
    }
    
    if (trimmedPostcode.length > 20) {
        return { isValid: false, error: "Postcode must be no more than 20 characters long" };
    }
    
    // Check for valid characters (letters, numbers, spaces, hyphens)
    if (!/^[a-zA-Z0-9\s\-]+$/.test(trimmedPostcode)) {
        return { isValid: false, error: "Postcode contains invalid characters" };
    }
    
    return { isValid: true, error: null };
}

/**
 * Country validation
 * @param {string} country - Country to validate
 * @param {Array} supportedCountries - List of supported countries
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateCountry(country, supportedCountries = []) {
    if (!country || typeof country !== "string") {
        return { isValid: false, error: "Country is required" };
    }
    
    const trimmedCountry = country.trim();
    
    if (trimmedCountry.length === 0) {
        return { isValid: false, error: "Country is required" };
    }
    
    if (supportedCountries.length > 0 && !supportedCountries.includes(trimmedCountry)) {
        return { isValid: false, error: "Please select a supported country" };
    }
    
    return { isValid: true, error: null };
}

/**
 * Comprehensive form validation
 * @param {FormData} formData - Form data to validate
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} Validation result with isValid boolean and errors object
 */
function validateForm(formData, validationRules) {
    const errors = {};
    let isValid = true;
    
    for (const [fieldName, rules] of Object.entries(validationRules)) {
        const value = formData.get(fieldName);
        const fieldError = validateField(value, fieldName, rules);
        
        if (fieldError) {
            errors[fieldName] = fieldError;
            isValid = false;
        }
    }
    
    return { isValid, errors };
}

/**
 * Validate individual field based on rules
 * @param {string} value - Field value to validate
 * @param {string} fieldName - Field name
 * @param {Object} rules - Validation rules
 * @returns {string|null} Error message or null if valid
 */
function validateField(value, fieldName, rules) {
    const { required = false, type = "text", minLength, maxLength, pattern, custom } = rules;
    
    // Check if required field is empty
    if (required && (!value || value.trim().length === 0)) {
        return `${fieldName} is required`;
    }
    
    // Skip validation if field is empty and not required
    if (!value || value.trim().length === 0) {
        return null;
    }
    
    const trimmedValue = value.trim();
    
    // Length validation
    if (minLength && trimmedValue.length < minLength) {
        return `${fieldName} must be at least ${minLength} characters long`;
    }
    
    if (maxLength && trimmedValue.length > maxLength) {
        return `${fieldName} must be no more than ${maxLength} characters long`;
    }
    
    // Type-specific validation
    switch (type) {
        case "email":
            const emailValidation = validateEmail(trimmedValue);
            if (!emailValidation.isValid) {
                return emailValidation.error;
            }
            break;
            
        case "password":
            const passwordValidation = validatePassword(trimmedValue, rules);
            if (!passwordValidation.isValid) {
                return passwordValidation.error;
            }
            break;
            
        case "dateOfBirth":
            const dobValidation = validateDateOfBirth(trimmedValue, rules.minAge);
            if (!dobValidation.isValid) {
                return dobValidation.error;
            }
            break;
            
        case "name":
            const nameValidation = validateName(trimmedValue, fieldName);
            if (!nameValidation.isValid) {
                return nameValidation.error;
            }
            break;
            
        case "address":
            const addressValidation = validateAddress(trimmedValue, fieldName, required);
            if (!addressValidation.isValid) {
                return addressValidation.error;
            }
            break;
            
        case "postcode":
            const postcodeValidation = validatePostcode(trimmedValue);
            if (!postcodeValidation.isValid) {
                return postcodeValidation.error;
            }
            break;
            
        case "country":
            const countryValidation = validateCountry(trimmedValue, rules.supportedCountries);
            if (!countryValidation.isValid) {
                return countryValidation.error;
            }
            break;
    }
    
    // Pattern validation
    if (pattern && !pattern.test(trimmedValue)) {
        return `${fieldName} format is invalid`;
    }
    
    // Custom validation
    if (custom && typeof custom === "function") {
        const customValidation = custom(trimmedValue);
        if (!customValidation.isValid) {
            return customValidation.error;
        }
    }
    
    return null;
}

/**
 * Real-time field validation with visual feedback
 * @param {HTMLElement} field - Input field element
 * @param {Object} rules - Validation rules
 * @param {HTMLElement} errorElement - Error message element
 */
function validateFieldRealTime(field, rules, errorElement) {
    const value = field.value;
    const error = validateField(value, field.name, rules);
    
    // Clear previous error state
    field.classList.remove("error", "success");
    field.setAttribute("aria-invalid", "false");
    
    if (errorElement) {
        errorElement.classList.remove("show");
        errorElement.textContent = "";
    }
    
    // Skip validation if field is empty and not required
    if (!value || value.trim().length === 0) {
        if (!rules.required) {
            return;
        }
    }
    
    if (error) {
        // Show error state
        field.classList.add("error");
        field.setAttribute("aria-invalid", "true");
        
        if (errorElement) {
            errorElement.textContent = error;
            errorElement.classList.add("show");
        }
    } else {
        // Show success state
        field.classList.add("success");
        field.setAttribute("aria-invalid", "false");
    }
}

/**
 * Clear field validation state
 * @param {HTMLElement} field - Input field element
 * @param {HTMLElement} errorElement - Error message element
 */
function clearFieldValidation(field, errorElement) {
    field.classList.remove("error", "success");
    field.setAttribute("aria-invalid", "false");
    
    if (errorElement) {
        errorElement.classList.remove("show");
        errorElement.textContent = "";
    }
}

/**
 * Show validation error message
 * @param {HTMLElement} field - Input field element
 * @param {string} message - Error message
 * @param {HTMLElement} errorElement - Error message element
 */
function showFieldError(field, message, errorElement) {
    field.classList.add("error");
    field.setAttribute("aria-invalid", "true");
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add("show");
    }
}

/**
 * Show validation success message
 * @param {HTMLElement} field - Input field element
 * @param {HTMLElement} errorElement - Error message element
 */
function showFieldSuccess(field, errorElement) {
    field.classList.add("success");
    field.setAttribute("aria-invalid", "false");
    
    if (errorElement) {
        errorElement.classList.remove("show");
    }
}

/**
 * Initialize real-time validation for a form
 * @param {HTMLFormElement} form - Form element
 * @param {Object} validationRules - Validation rules for each field
 */
function initializeRealTimeValidation(form, validationRules) {
    const fields = form.querySelectorAll("input, select, textarea");
    
    fields.forEach(field => {
        const rules = validationRules[field.name];
        if (!rules) return;
        
        const errorElement = document.getElementById(`${field.name}-error`);
        
        // Validate on blur
        field.addEventListener("blur", () => {
            validateFieldRealTime(field, rules, errorElement);
        });
        
        // Clear errors on input
        field.addEventListener("input", () => {
            clearFieldValidation(field, errorElement);
        });
        
        // Validate on change for select elements
        if (field.tagName === "SELECT") {
            field.addEventListener("change", () => {
                validateFieldRealTime(field, rules, errorElement);
            });
        }
    });
}

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validatePasswordConfirmation(password, confirmPassword) {
    if (!confirmPassword || typeof confirmPassword !== "string") {
        return { isValid: false, error: "Password confirmation is required" };
    }
    
    if (password !== confirmPassword) {
        return { isValid: false, error: "Passwords do not match" };
    }
    
    return { isValid: true, error: null };
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== "string") {
        return { isValid: false, error: "API key is required" };
    }
    
    const trimmedKey = apiKey.trim();
    
    if (trimmedKey.length === 0) {
        return { isValid: false, error: "API key is required" };
    }
    
    // Check for sk_live_ prefix
    if (!trimmedKey.startsWith("sk_live_")) {
        return { isValid: false, error: "API key must start with 'sk_live_'" };
    }
    
    // Check length (prefix + 32 characters)
    if (trimmedKey.length !== 40) {
        return { isValid: false, error: "API key must be 40 characters long" };
    }
    
    // Check for valid characters (alphanumeric)
    if (!/^sk_live_[a-zA-Z0-9]+$/.test(trimmedKey)) {
        return { isValid: false, error: "API key contains invalid characters" };
    }
    
    return { isValid: true, error: null };
}

// Export functions for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        validateEmail,
        validatePassword,
        validateDateOfBirth,
        validateName,
        validateAddress,
        validatePostcode,
        validateCountry,
        validateForm,
        validateField,
        validateFieldRealTime,
        clearFieldValidation,
        showFieldError,
        showFieldSuccess,
        initializeRealTimeValidation,
        validatePasswordConfirmation,
        validateApiKey
    };
}

// Make functions available globally for browser use
if (typeof window !== "undefined") {
    window.validation = {
        validateEmail,
        validatePassword,
        validateDateOfBirth,
        validateName,
        validateAddress,
        validatePostcode,
        validateCountry,
        validateForm,
        validateField,
        validateFieldRealTime,
        clearFieldValidation,
        showFieldError,
        showFieldSuccess,
        initializeRealTimeValidation,
        validatePasswordConfirmation,
        validateApiKey
    };
    
    // Add wrapper functions with expected names for register.html
    window.isValidEmail = function(email) {
        return validateEmail(email).isValid;
    };
    
    window.isValidPassword = function(password) {
        return validatePassword(password).isValid;
    };
    
    window.isValidDateOfBirth = function(dateOfBirth) {
        return validateDateOfBirth(dateOfBirth).isValid;
    };
    
    window.isValidName = function(name) {
        return validateName(name).isValid;
    };
    
    window.isValidAddress = function(address) {
        return validateAddress(address).isValid;
    };
    
    window.isValidPostcode = function(postcode) {
        return validatePostcode(postcode).isValid;
    };
    
    window.isValidCountry = function(country) {
        return validateCountry(country).isValid;
    };
}
