/**
 * Frontend Authentication Module
 * 
 * This module provides comprehensive client-side authentication functionality
 * including user registration, login, logout, password management, and
 * session handling. It integrates with the backend authentication API
 * and provides a seamless user experience.
 * 
 * Features:
 * - User registration with validation
 * - User login with session management
 * - Password reset and change functionality
 * - Session validation and refresh
 * - Automatic redirect handling
 * - Error handling and user feedback
 * - Local storage management
 * - CSRF token handling
 * 
 * Usage:
 * ```javascript
 * import { registerUser, loginUser, logoutUser, checkSession } from './auth.js';
 * 
 * // Register new user
 * const result = await registerUser(userData);
 * 
 * // Login user
 * const loginResult = await loginUser(email, password);
 * 
 * // Check session
 * const sessionValid = await checkSession();
 * ```
 */

/**
 * API base URL - can be configured based on environment
 */
const AUTH_API_BASE_URL = window.location.origin;

/**
 * Default request headers
 */
const AUTH_DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json"
};

/**
 * CSRF token management
 */
let authCsrfToken = null;

/**
 * Initialize CSRF token from meta tag or cookie
 */
function initializeCSRFToken() {
    // Try to get CSRF token from meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
        authCsrfToken = metaTag.getAttribute("content");
        return;
    }
    
    // Try to get CSRF token from cookie
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === "csrf-token") {
            authCsrfToken = value;
            return;
        }
    }
}

/**
 * Get request headers with CSRF token if available
 * @returns {Object} Headers object
 */
function getRequestHeaders() {
    const headers = { ...AUTH_DEFAULT_HEADERS };
    
    if (authCsrfToken) {
        headers["X-CSRF-Token"] = authCsrfToken;
    }
    
    return headers;
}

/**
 * Make authenticated API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response
 */
async function makeAuthenticatedRequest(endpoint, options = {}) {
    const url = `${AUTH_API_BASE_URL}${endpoint}`;
    const requestOptions = {
        ...options,
        headers: {
            ...getRequestHeaders(),
            ...options.headers
        },
        credentials: "include" // Include cookies for session
    };
    
    try {
        const response = await fetch(url, requestOptions);
        const data = await response.json();
        
        // Update CSRF token if provided in response
        if (data.csrfToken) {
            authCsrfToken = data.csrfToken;
        }
        
        return {
            success: response.ok,
            data: data,
            status: response.status,
            statusText: response.statusText
        };
    } catch (error) {
        console.error("API request failed:", error);
        return {
            success: false,
            error: error.message,
            status: 0
        };
    }
}

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration result
 */
async function registerUser(userData) {
    try {
        const result = await makeAuthenticatedRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData)
        });
        
        if (result.success) {
            // Store user data in localStorage for quick access
            if (result.data.data && result.data.data.user) {
                localStorage.setItem("user", JSON.stringify(result.data.data.user));
            }
            
            return {
                success: true,
                user: result.data.data?.user,
                message: result.data.message,
                requiresEmailVerification: result.data.data?.requiresEmailVerification
            };
        } else {
            return {
                success: false,
                error: result.data.message || result.data.error || "Registration failed",
                code: result.data.code
            };
        }
    } catch (error) {
        console.error("Registration error:", error);
        return {
            success: false,
            error: "Registration failed. Please try again."
        };
    }
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} rememberMe - Remember user for 30 days
 * @returns {Promise<Object>} Login result
 */
async function loginUser(email, password, rememberMe = false) {
    try {
        const result = await makeAuthenticatedRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: email.trim().toLowerCase(),
                password: password,
                rememberMe: rememberMe
            })
        });
        
        if (result.success) {
            // Store user data in localStorage
            if (result.data.data && result.data.data.user) {
                localStorage.setItem("user", JSON.stringify(result.data.data.user));
            }
            
            return {
                success: true,
                user: result.data.data?.user,
                sessionToken: result.data.data?.sessionToken,
                message: result.data.message
            };
        } else {
            return {
                success: false,
                error: result.data.message || result.data.error || "Login failed",
                code: result.data.code
            };
        }
    } catch (error) {
        console.error("Login error:", error);
        return {
            success: false,
            error: "Login failed. Please try again."
        };
    }
}

/**
 * Logout user
 * @returns {Promise<Object>} Logout result
 */
async function logoutUser() {
    // Set flag to prevent auto-login
    sessionStorage.setItem('logoutInProgress', 'true');
    
    // Clear ALL localStorage items
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Error clearing localStorage:', error);
        // Manually remove known keys
        localStorage.removeItem("user");
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("apiKey");
    }
    
    // Clear sessionStorage except the logout flag
    try {
        const logoutFlag = sessionStorage.getItem('logoutInProgress');
        sessionStorage.clear();
        if (logoutFlag) {
            sessionStorage.setItem('logoutInProgress', 'true');
        }
    } catch (error) {
        console.error('Error clearing sessionStorage:', error);
    }
    
    // Clear CSRF token
    authCsrfToken = null;
    
    try {
        const result = await makeAuthenticatedRequest("/auth/logout", {
            method: "POST"
        });
        
        return {
            success: result.success,
            message: result.data?.message || "Logged out successfully"
        };
    } catch (error) {
        console.error("Logout error:", error);
        
        return {
            success: true,
            message: "Logged out successfully"
        };
    }
}

/**
 * Check if user session is valid
 * @returns {Promise<Object>} Session check result
 */
async function checkSession() {
    // Don't check session if logout is in progress
    if (sessionStorage.getItem('logoutInProgress') === 'true') {
        return {
            success: false,
            error: "Logout in progress"
        };
    }
    
    try {
        const result = await makeAuthenticatedRequest("/auth/session");
        
        if (result.success && result.data.success) {
            // Update user data in localStorage
            if (result.data.data && result.data.data.user) {
                localStorage.setItem("user", JSON.stringify(result.data.data.user));
            }
            
            return {
                success: true,
                user: result.data.data?.user,
                session: result.data.data?.session
            };
        } else {
            // Clear invalid session data
            localStorage.removeItem("user");
            localStorage.removeItem("sessionToken");
            localStorage.removeItem("apiKey");
            
            return {
                success: false,
                error: result.data?.message || "Session invalid"
            };
        }
    } catch (error) {
        console.error("Session check error:", error);
        
        // Clear session data on error
        localStorage.removeItem("user");
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("apiKey");
        
        return {
            success: false,
            error: "Session check failed"
        };
    }
}

/**
 * Refresh user session
 * @returns {Promise<Object>} Session refresh result
 */
async function refreshSession() {
    try {
        const result = await makeAuthenticatedRequest("/auth/refresh-session", {
            method: "POST"
        });
        
        return {
            success: result.success,
            message: result.data?.message || "Session refreshed"
        };
    } catch (error) {
        console.error("Session refresh error:", error);
        return {
            success: false,
            error: "Session refresh failed"
        };
    }
}

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile result
 */
async function getCurrentUser() {
    try {
        const result = await makeAuthenticatedRequest("/auth/me");
        
        if (result.success && result.data.success) {
            // Update user data in localStorage
            if (result.data.data && result.data.data.user) {
                localStorage.setItem("user", JSON.stringify(result.data.data.user));
            }
            
            return {
                success: true,
                user: result.data.data?.user
            };
        } else {
            return {
                success: false,
                error: result.data?.message || "Failed to get user profile"
            };
        }
    } catch (error) {
        console.error("Get user profile error:", error);
        return {
            success: false,
            error: "Failed to get user profile"
        };
    }
}

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} Password reset request result
 */
async function requestPasswordReset(email) {
    try {
        const result = await makeAuthenticatedRequest("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email: email.trim().toLowerCase() })
        });
        
        return {
            success: result.success,
            message: result.data?.message || "Password reset instructions sent"
        };
    } catch (error) {
        console.error("Password reset request error:", error);
        return {
            success: false,
            error: "Failed to send password reset instructions"
        };
    }
}

/**
 * Reset password using token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @param {string} confirmPassword - Password confirmation
 * @returns {Promise<Object>} Password reset result
 */
async function resetPassword(token, newPassword, confirmPassword) {
    try {
        const result = await makeAuthenticatedRequest("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({
                token: token,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            })
        });
        
        return {
            success: result.success,
            message: result.data?.message || "Password reset successfully"
        };
    } catch (error) {
        console.error("Password reset error:", error);
        return {
            success: false,
            error: "Failed to reset password"
        };
    }
}

/**
 * Change password for authenticated user
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {string} confirmPassword - Password confirmation
 * @returns {Promise<Object>} Password change result
 */
async function changePassword(currentPassword, newPassword, confirmPassword) {
    try {
        const result = await makeAuthenticatedRequest("/auth/change-password", {
            method: "POST",
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            })
        });
        
        return {
            success: result.success,
            message: result.data?.message || "Password changed successfully"
        };
    } catch (error) {
        console.error("Password change error:", error);
        return {
            success: false,
            error: "Failed to change password"
        };
    }
}

/**
 * Verify email address
 * @param {string} token - Verification token
 * @returns {Promise<Object>} Email verification result
 */
async function verifyEmail(token) {
    try {
        const result = await makeAuthenticatedRequest("/auth/verify-email", {
            method: "POST",
            body: JSON.stringify({ token: token })
        });
        
        return {
            success: result.success,
            message: result.data?.message || "Email verified successfully"
        };
    } catch (error) {
        console.error("Email verification error:", error);
        return {
            success: false,
            error: "Failed to verify email"
        };
    }
}

/**
 * Get authentication configuration
 * @returns {Promise<Object>} Configuration result
 */
async function getAuthConfig() {
    try {
        const result = await makeAuthenticatedRequest("/auth/config");
        
        return {
            success: result.success,
            config: result.data?.data
        };
    } catch (error) {
        console.error("Get auth config error:", error);
        return {
            success: false,
            error: "Failed to get configuration"
        };
    }
}

/**
 * Get user from localStorage
 * @returns {Object|null} User object or null
 */
function getStoredUser() {
    try {
        const userData = localStorage.getItem("user");
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("user");
        return null;
    }
}

/**
 * Check if user is logged in (based on localStorage)
 * @returns {boolean} True if user is logged in
 */
function isLoggedIn() {
    const user = getStoredUser();
    return user !== null;
}

/**
 * Redirect to login page if not authenticated
 * @param {string} redirectUrl - URL to redirect to after login
 */
function requireAuth(redirectUrl = null) {
    if (!isLoggedIn()) {
        const loginUrl = redirectUrl ? 
            `/pages/login.html?redirect=${encodeURIComponent(redirectUrl)}` : 
            "/pages/login.html";
        window.location.href = loginUrl;
        return false;
    }
    return true;
}

/**
 * Redirect to dashboard if already authenticated
 * @param {string} fallbackUrl - Fallback URL if no redirect specified
 */
function redirectIfAuthenticated(fallbackUrl = "/pages/dashboard.html") {
    if (isLoggedIn()) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get("redirect") || fallbackUrl;
        window.location.href = redirectUrl;
        return true;
    }
    return false;
}

/**
 * Handle authentication errors
 * @param {Object} error - Error object
 * @param {string} defaultMessage - Default error message
 * @returns {string} User-friendly error message
 */
function handleAuthError(error, defaultMessage = "An error occurred") {
    if (typeof error === "string") {
        return error;
    }
    
    if (error.error) {
        return error.error;
    }
    
    if (error.message) {
        return error.message;
    }
    
    return defaultMessage;
}

/**
 * Show authentication success message
 * @param {string} message - Success message
 * @param {number} duration - Display duration in milliseconds
 */
function showSuccessMessage(message, duration = 3000) {
    const successDiv = document.createElement("div");
    successDiv.className = "auth-success-message";
    successDiv.textContent = message;
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #d4edda;
        color: #155724;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #c3e6cb;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, duration);
}

/**
 * Show authentication error message
 * @param {string} message - Error message
 * @param {number} duration - Display duration in milliseconds
 */
function showErrorMessage(message, duration = 5000) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "auth-error-message";
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #f8d7da;
        color: #721c24;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #f5c6cb;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, duration);
}

/**
 * Initialize authentication module
 * This should be called when the page loads
 */
function initializeAuth() {
    // Initialize CSRF token
    initializeCSRFToken();
    
    // Set up automatic session refresh
    setInterval(async () => {
        if (isLoggedIn()) {
            await refreshSession();
        }
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    // Handle page visibility change
    document.addEventListener("visibilitychange", async () => {
        if (!document.hidden && isLoggedIn()) {
            // Check session when page becomes visible
            const sessionResult = await checkSession();
            if (!sessionResult.success) {
                // Session invalid, redirect to login
                try {
                    localStorage.clear();
                    sessionStorage.clear();
                } catch (e) {
                    console.error('Error clearing storage:', e);
                }
                window.location.replace("/pages/login.html");
            }
        }
    });
    
    console.log("Authentication module initialized");
}

/**
 * Validate registration form data
 * @param {Object} userData - User registration data
 * @returns {boolean} True if valid
 */
function validateRegistrationForm(userData) {
    const { email, password, confirmPassword, profile } = userData;
    
    // Basic validation
    if (!email || !password || !confirmPassword || !profile) {
        return false;
    }
    
    // Email validation
    const emailValidation = window.validation?.validateEmail(email);
    if (!emailValidation.isValid) {
        return false;
    }
    
    // Password validation
    const passwordValidation = window.validation?.validatePassword(password);
    if (!passwordValidation.isValid) {
        return false;
    }
    
    // Password confirmation
    if (password !== confirmPassword) {
        return false;
    }
    
    // Profile validation
    const { firstName, lastName, dateOfBirth, address1, city, postcode, country } = profile;
    
    if (!firstName || !lastName || !dateOfBirth || !address1 || !city || !postcode || !country) {
        return false;
    }
    
    return true;
}

/**
 * Validate login form data
 * @param {Object} loginData - Login data
 * @returns {boolean} True if valid
 */
function validateLoginForm(loginData) {
    const { email, password } = loginData;
    
    if (!email || !password) {
        return false;
    }
    
    const emailValidation = window.validation?.validateEmail(email);
    return emailValidation.isValid;
}

/**
 * Validate password change form data
 * @param {Object} passwordData - Password change data
 * @returns {boolean} True if valid
 */
function validatePasswordChangeForm(passwordData) {
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        return false;
    }
    
    const passwordValidation = window.validation?.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
        return false;
    }
    
    if (newPassword !== confirmPassword) {
        return false;
    }
    
    return true;
}

/**
 * Validate password reset form data
 * @param {Object} resetData - Password reset data
 * @returns {boolean} True if valid
 */
function validatePasswordResetForm(resetData) {
    const { token, newPassword, confirmPassword } = resetData;
    
    if (!token || !newPassword || !confirmPassword) {
        return false;
    }
    
    const passwordValidation = window.validation?.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
        return false;
    }
    
    if (newPassword !== confirmPassword) {
        return false;
    }
    
    return true;
}

// Export functions for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        registerUser,
        loginUser,
        logoutUser,
        checkSession,
        refreshSession,
        getCurrentUser,
        requestPasswordReset,
        resetPassword,
        changePassword,
        verifyEmail,
        getAuthConfig,
        getStoredUser,
        isLoggedIn,
        requireAuth,
        redirectIfAuthenticated,
        handleAuthError,
        showSuccessMessage,
        showErrorMessage,
        initializeAuth,
        validateRegistrationForm,
        validateLoginForm,
        validatePasswordChangeForm,
        validatePasswordResetForm
    };
}

// Make functions available globally for browser use
if (typeof window !== "undefined") {
    window.auth = {
        registerUser,
        loginUser,
        logoutUser,
        checkSession,
        refreshSession,
        getCurrentUser,
        requestPasswordReset,
        resetPassword,
        changePassword,
        verifyEmail,
        getAuthConfig,
        getStoredUser,
        isLoggedIn,
        requireAuth,
        redirectIfAuthenticated,
        handleAuthError,
        showSuccessMessage,
        showErrorMessage,
        initializeAuth,
        validateRegistrationForm,
        validateLoginForm,
        validatePasswordChangeForm,
        validatePasswordResetForm
    };
    
    // Initialize auth module when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeAuth);
    } else {
        initializeAuth();
    }
}
