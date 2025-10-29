/**
 * Frontend Dashboard Module
 * 
 * This module provides comprehensive dashboard functionality including
 * user profile management, API key operations, usage statistics,
 * and account settings. It integrates with the backend dashboard API
 * and provides real-time updates and interactive features.
 * 
 * Features:
 * - User profile management and updates
 * - API key generation and regeneration
 * - Usage statistics and analytics
 * - Account information display
 * - Security settings management
 * - Real-time data updates
 * - Interactive charts and visualizations
 * - Export functionality
 * - Responsive design support
 * 
 * Usage:
 * ```javascript
 * import { loadDashboardData, updateProfile, regenerateApiKey } from './dashboard.js';
 * 
 * // Load dashboard data
 * const data = await loadDashboardData();
 * 
 * // Update user profile
 * const result = await updateProfile(profileData);
 * 
 * // Regenerate API key
 * const newKey = await regenerateApiKey();
 * ```
 */

/**
 * API base URL - can be configured based on environment
 */
const DASHBOARD_API_BASE_URL = window.location.origin;

/**
 * Default request headers
 */
const DASHBOARD_DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json"
};

/**
 * CSRF token management
 */
let dashboardCsrfToken = null;

/**
 * Initialize CSRF token from meta tag or cookie
 */
function initializeCSRFToken() {
    // Try to get CSRF token from meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
        dashboardCsrfToken = metaTag.getAttribute("content");
        return;
    }
    
    // Try to get CSRF token from cookie
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === "csrf-token") {
            dashboardCsrfToken = value;
            return;
        }
    }
}

/**
 * Get request headers with CSRF token if available
 * @returns {Object} Headers object
 */
function getRequestHeaders() {
    const headers = { ...DASHBOARD_DEFAULT_HEADERS };
    
    if (dashboardCsrfToken) {
        headers["X-CSRF-Token"] = dashboardCsrfToken;
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
    const url = `${DASHBOARD_API_BASE_URL}${endpoint}`;
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
            dashboardCsrfToken = data.csrfToken;
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
 * Load comprehensive dashboard data
 * @returns {Promise<Object>} Dashboard data
 */
async function loadDashboardData() {
    try {
        const [profileResult, apiKeyResult, usageResult, statsResult] = await Promise.all([
            getProfile(),
            getApiKey(),
            getUsageStats(),
            getAccountStats()
        ]);
        
        return {
            success: true,
            profile: profileResult.success ? profileResult.data : null,
            apiKey: apiKeyResult.success ? apiKeyResult.data : null,
            usage: usageResult.success ? usageResult.data : null,
            stats: statsResult.success ? statsResult.data : null
        };
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        return {
            success: false,
            error: "Failed to load dashboard data"
        };
    }
}

/**
 * Get user profile information
 * @returns {Promise<Object>} Profile data
 */
async function getProfile() {
    try {
        const result = await makeAuthenticatedRequest("/dashboard/profile");
        
        return {
            success: result.success,
            data: result.data?.data?.user,
            error: result.data?.error
        };
    } catch (error) {
        console.error("Get profile error:", error);
        return {
            success: false,
            error: "Failed to get profile"
        };
    }
}

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Update result
 */
async function updateProfile(profileData) {
    try {
        const result = await makeAuthenticatedRequest("/dashboard/profile", {
            method: "PUT",
            body: JSON.stringify({ profile: profileData })
        });
        
        if (result.success) {
            // Update localStorage with new profile data
            const user = window.auth?.getStoredUser();
            if (user) {
                user.profile = { ...user.profile, ...profileData };
                localStorage.setItem("user", JSON.stringify(user));
            }
        }
        
        return {
            success: result.success,
            data: result.data?.data?.user,
            message: result.data?.message,
            error: result.data?.error
        };
    } catch (error) {
        console.error("Update profile error:", error);
        return {
            success: false,
            error: "Failed to update profile"
        };
    }
}

/**
 * Get API key information
 * @returns {Promise<Object>} API key data
 */
async function getApiKey() {
    try {
        const result = await makeAuthenticatedRequest("/dashboard/api-key");
        
        return {
            success: result.success,
            data: result.data?.data?.apiKey,
            error: result.data?.error
        };
    } catch (error) {
        console.error("Get API key error:", error);
        return {
            success: false,
            error: "Failed to get API key"
        };
    }
}

/**
 * Regenerate API key
 * @returns {Promise<Object>} Regeneration result
 */
async function regenerateApiKey() {
    try {
        const result = await makeAuthenticatedRequest("/dashboard/api-key/regenerate", {
            method: "POST"
        });
        
        if (result.success) {
            // Update localStorage with new API key
            const user = window.auth?.getStoredUser();
            if (user) {
                user.apiKey = result.data.data.apiKey;
                localStorage.setItem("user", JSON.stringify(user));
            }
        }
        
        return {
            success: result.success,
            data: result.data?.data?.apiKey,
            message: result.data?.message,
            error: result.data?.error
        };
    } catch (error) {
        console.error("Regenerate API key error:", error);
        return {
            success: false,
            error: "Failed to regenerate API key"
        };
    }
}

/**
 * Get usage statistics
 * @param {string} period - Time period (hour, day, week, month)
 * @param {number} limit - Maximum number of records
 * @returns {Promise<Object>} Usage statistics
 */
async function getUsageStats(period = "day", limit = 100) {
    try {
        const result = await makeAuthenticatedRequest(`/dashboard/usage?period=${period}&limit=${limit}`);
        
        return {
            success: result.success,
            data: result.data?.data?.usage,
            error: result.data?.error
        };
    } catch (error) {
        console.error("Get usage stats error:", error);
        return {
            success: false,
            error: "Failed to get usage statistics"
        };
    }
}

/**
 * Get comprehensive account statistics
 * @returns {Promise<Object>} Account statistics
 */
async function getAccountStats() {
    try {
        const result = await makeAuthenticatedRequest("/dashboard/stats");
        
        return {
            success: result.success,
            data: result.data?.data?.stats,
            error: result.data?.error
        };
    } catch (error) {
        console.error("Get account stats error:", error);
        return {
            success: false,
            error: "Failed to get account statistics"
        };
    }
}

/**
 * Get security information
 * @returns {Promise<Object>} Security information
 */
async function getSecurityInfo() {
    try {
        const result = await makeAuthenticatedRequest("/dashboard/security");
        
        return {
            success: result.success,
            data: result.data?.data?.security,
            error: result.data?.error
        };
    } catch (error) {
        console.error("Get security info error:", error);
        return {
            success: false,
            error: "Failed to get security information"
        };
    }
}

/**
 * Get PDF generator access URL
 * @returns {Promise<Object>} PDF generator URL
 */
async function getPdfGeneratorUrl() {
    try {
        const result = await makeAuthenticatedRequest("/dashboard/pdf-generator");
        
        return {
            success: result.success,
            data: result.data?.data,
            error: result.data?.error
        };
    } catch (error) {
        console.error("Get PDF generator URL error:", error);
        return {
            success: false,
            error: "Failed to get PDF generator URL"
        };
    }
}

/**
 * Delete user account
 * @param {string} confirmPassword - Password confirmation
 * @returns {Promise<Object>} Deletion result
 */
async function deleteAccount(confirmPassword) {
    try {
        const result = await makeAuthenticatedRequest("/dashboard/account", {
            method: "DELETE",
            body: JSON.stringify({ confirmPassword })
        });
        
        if (result.success) {
            // Clear localStorage
            localStorage.removeItem("user");
            localStorage.removeItem("sessionToken");
        }
        
        return {
            success: result.success,
            message: result.data?.message,
            error: result.data?.error
        };
    } catch (error) {
        console.error("Delete account error:", error);
        return {
            success: false,
            error: "Failed to delete account"
        };
    }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const success = document.execCommand("copy");
            document.body.removeChild(textArea);
            return success;
        }
    } catch (error) {
        console.error("Copy to clipboard error:", error);
        return false;
    }
}

/**
 * Mask API key for display
 * @param {string} apiKey - API key to mask
 * @returns {string} Masked API key
 */
function maskApiKey(apiKey) {
    if (!apiKey || apiKey.length < 8) {
        return "****";
    }
    
    const prefix = apiKey.substring(0, 8);
    const masked = "*".repeat(Math.max(apiKey.length - 8, 4));
    return `${prefix}${masked}`;
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date
 */
function formatDate(date, options = {}) {
    const defaultOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    
    try {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return dateObj.toLocaleDateString("en-US", formatOptions);
    } catch (error) {
        console.error("Date formatting error:", error);
        return "Invalid Date";
    }
}

/**
 * Format number with commas
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(number) {
    if (typeof number !== "number" || isNaN(number)) {
        return "0";
    }
    
    return number.toLocaleString();
}

/**
 * Calculate time ago
 * @param {string|Date} date - Date to calculate from
 * @returns {string} Time ago string
 */
function getTimeAgo(date) {
    try {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        const now = new Date();
        const diffInSeconds = Math.floor((now - dateObj) / 1000);
        
        if (diffInSeconds < 60) {
            return "Just now";
        }
        
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
        }
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
        }
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) {
            return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
        }
        
        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
        }
        
        const diffInYears = Math.floor(diffInMonths / 12);
        return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
    } catch (error) {
        console.error("Time ago calculation error:", error);
        return "Unknown";
    }
}

/**
 * Show loading state
 * @param {HTMLElement} element - Element to show loading state
 * @param {string} message - Loading message
 */
function showLoadingState(element, message = "Loading...") {
    if (!element) return;
    
    element.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <span>${message}</span>
        </div>
    `;
    
    // Add loading styles if not already present
    if (!document.querySelector("#loading-styles")) {
        const style = document.createElement("style");
        style.id = "loading-styles";
        style.textContent = `
            .loading-state {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                color: #666;
            }
            .loading-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid #e9ecef;
                border-top: 2px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 0.5rem;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Show error state
 * @param {HTMLElement} element - Element to show error state
 * @param {string} message - Error message
 */
function showErrorState(element, message = "An error occurred") {
    if (!element) return;
    
    element.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <p>${message}</p>
        </div>
    `;
    
    // Add error styles if not already present
    if (!document.querySelector("#error-styles")) {
        const style = document.createElement("style");
        style.id = "error-styles";
        style.textContent = `
            .error-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                color: #e74c3c;
                text-align: center;
            }
            .error-icon {
                font-size: 2rem;
                margin-bottom: 1rem;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Show success message
 * @param {string} message - Success message
 * @param {number} duration - Display duration in milliseconds
 */
function showSuccessMessage(message, duration = 3000) {
    const successDiv = document.createElement("div");
    successDiv.className = "dashboard-success-message";
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
 * Show error message
 * @param {string} message - Error message
 * @param {number} duration - Display duration in milliseconds
 */
function showErrorMessage(message, duration = 5000) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "dashboard-error-message";
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
 * Initialize dashboard module
 * This should be called when the dashboard page loads
 */
function initializeDashboard() {
    // Initialize CSRF token
    initializeCSRFToken();
    
    // Set up automatic data refresh
    setInterval(async () => {
        if (window.auth?.isLoggedIn()) {
            // Refresh usage stats every 5 minutes
            const usageResult = await getUsageStats();
            if (usageResult.success) {
                updateUsageDisplay(usageResult.data);
            }
        }
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    console.log("Dashboard module initialized");
}

/**
 * Update usage display with new data
 * @param {Object} usageData - Usage data to display
 */
function updateUsageDisplay(usageData) {
    // Update total requests
    const totalRequestsElement = document.getElementById("totalRequests");
    if (totalRequestsElement && usageData.totalRequests !== undefined) {
        totalRequestsElement.textContent = formatNumber(usageData.totalRequests);
    }
    
    // Update unique IPs
    const uniqueIPsElement = document.getElementById("uniqueIPs");
    if (uniqueIPsElement && usageData.requestsByIP) {
        uniqueIPsElement.textContent = formatNumber(usageData.requestsByIP.length);
    }
    
    // Update usage table
    const tableBody = document.getElementById("usageTableBody");
    if (tableBody && usageData.requestsByIP) {
        tableBody.innerHTML = "";
        
        if (usageData.requestsByIP.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #666;">No usage data available</td></tr>';
        } else {
            usageData.requestsByIP.forEach(ipData => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${ipData.ip}</td>
                    <td>${formatNumber(ipData.count)}</td>
                    <td>${formatDate(ipData.lastRequest)}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    }
}

/**
 * Export usage data as CSV
 * @param {Object} usageData - Usage data to export
 * @param {string} filename - Filename for the export
 */
function exportUsageData(usageData, filename = "usage-data.csv") {
    if (!usageData || !usageData.requestsByIP) {
        showErrorMessage("No usage data to export");
        return;
    }
    
    try {
        const csvContent = [
            "IP Address,Requests,Last Request",
            ...usageData.requestsByIP.map(ipData => 
                `"${ipData.ip}","${ipData.count}","${formatDate(ipData.lastRequest)}"`
            )
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
        
        showSuccessMessage("Usage data exported successfully");
    } catch (error) {
        console.error("Export error:", error);
        showErrorMessage("Failed to export usage data");
    }
}

// Export functions for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        loadDashboardData,
        getProfile,
        updateProfile,
        getApiKey,
        regenerateApiKey,
        getUsageStats,
        getAccountStats,
        getSecurityInfo,
        getPdfGeneratorUrl,
        deleteAccount,
        copyToClipboard,
        maskApiKey,
        formatDate,
        formatNumber,
        getTimeAgo,
        showLoadingState,
        showErrorState,
        showSuccessMessage,
        showErrorMessage,
        initializeDashboard,
        updateUsageDisplay,
        exportUsageData
    };
}

// Make functions available globally for browser use
if (typeof window !== "undefined") {
    window.dashboard = {
        loadDashboardData,
        getProfile,
        updateProfile,
        getApiKey,
        regenerateApiKey,
        getUsageStats,
        getAccountStats,
        getSecurityInfo,
        getPdfGeneratorUrl,
        deleteAccount,
        copyToClipboard,
        maskApiKey,
        formatDate,
        formatNumber,
        getTimeAgo,
        showLoadingState,
        showErrorState,
        showSuccessMessage,
        showErrorMessage,
        initializeDashboard,
        updateUsageDisplay,
        exportUsageData
    };
    
    // Initialize dashboard module when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeDashboard);
    } else {
        initializeDashboard();
    }
}
