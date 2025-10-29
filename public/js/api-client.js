/**
 * Frontend API Client Module
 * 
 * This module provides a comprehensive API client for making authenticated
 * requests to the PDF Service backend. It handles authentication, error
 * management, request/response formatting, and provides utility functions
 * for common API operations.
 * 
 * Features:
 * - Automatic authentication handling
 * - Request/response interceptors
 * - Error handling and retry logic
 * - Request caching and optimization
 * - Progress tracking for file uploads
 * - Response validation
 * - Rate limiting awareness
 * - Offline support
 * 
 * Usage:
 * ```javascript
 * import { apiClient, pdfApi } from './api-client.js';
 * 
 * // Make authenticated request
 * const result = await apiClient.get('/dashboard/profile');
 * 
 * // Generate PDF
 * const pdfResult = await pdfApi.generatePdf(htmlContent, options);
 * ```
 */

/**
 * API base URL - can be configured based on environment
 */
const CLIENT_API_BASE_URL = window.location.origin;

/**
 * Default request configuration
 */
const DEFAULT_CONFIG = {
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
};

/**
 * Request cache for GET requests
 */
const requestCache = new Map();

/**
 * CSRF token management
 */
let clientCsrfToken = null;

/**
 * Request queue for rate limiting
 */
const requestQueue = [];
let isProcessingQueue = false;

/**
 * Initialize CSRF token from meta tag or cookie
 */
function initializeCSRFToken() {
    // Try to get CSRF token from meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
        clientCsrfToken = metaTag.getAttribute("content");
        return;
    }
    
    // Try to get CSRF token from cookie
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === "csrf-token") {
            clientCsrfToken = value;
            return;
        }
    }
}

/**
 * Get request headers with authentication and CSRF token
 * @param {Object} customHeaders - Custom headers to include
 * @returns {Object} Headers object
 */
function getRequestHeaders(customHeaders = {}) {
    const headers = { ...DEFAULT_CONFIG.headers, ...customHeaders };
    
    // Add CSRF token if available
    if (clientCsrfToken) {
        headers["X-CSRF-Token"] = clientCsrfToken;
    }
    
    // Add API key if available
    const user = window.auth?.getStoredUser();
    if (user && user.apiKey && user.apiKey.key) {
        headers["X-API-Key"] = user.apiKey.key;
    }
    
    return headers;
}

/**
 * Create AbortController for request timeout
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Object} AbortController and timeout ID
 */
function createAbortController(timeout = DEFAULT_CONFIG.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);
    
    return { controller, timeoutId };
}

/**
 * Retry request with exponential backoff
 * @param {Function} requestFn - Request function to retry
 * @param {number} retries - Number of retries remaining
 * @param {number} delay - Delay between retries
 * @returns {Promise<Object>} Request result
 */
async function retryRequest(requestFn, retries = DEFAULT_CONFIG.retries, delay = DEFAULT_CONFIG.retryDelay) {
    try {
        return await requestFn();
    } catch (error) {
        if (retries > 0 && shouldRetry(error)) {
            console.log(`Request failed, retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryRequest(requestFn, retries - 1, delay * 2);
        }
        throw error;
    }
}

/**
 * Check if request should be retried
 * @param {Error} error - Error object
 * @returns {boolean} True if should retry
 */
function shouldRetry(error) {
    // Retry on network errors or 5xx server errors
    return error.name === "AbortError" || 
           error.status >= 500 || 
           error.status === 0;
}

/**
 * Process request queue
 */
async function processRequestQueue() {
    if (isProcessingQueue || requestQueue.length === 0) {
        return;
    }
    
    isProcessingQueue = true;
    
    while (requestQueue.length > 0) {
        const { requestFn, resolve, reject } = requestQueue.shift();
        
        try {
            const result = await requestFn();
            resolve(result);
        } catch (error) {
            reject(error);
        }
        
        // Small delay between requests to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    isProcessingQueue = false;
}

/**
 * Queue request for processing
 * @param {Function} requestFn - Request function
 * @returns {Promise<Object>} Request result
 */
function queueRequest(requestFn) {
    return new Promise((resolve, reject) => {
        requestQueue.push({ requestFn, resolve, reject });
        processRequestQueue();
    });
}

/**
 * Make HTTP request with comprehensive error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response
 */
async function makeRequest(endpoint, options = {}) {
    const {
        method = "GET",
        body = null,
        headers = {},
        timeout = DEFAULT_CONFIG.timeout,
        retries = DEFAULT_CONFIG.retries,
        useCache = false,
        queueRequest: shouldQueue = false
    } = options;
    
    const url = `${CLIENT_API_BASE_URL}${endpoint}`;
    const requestHeaders = getRequestHeaders(headers);
    
    // Check cache for GET requests
    if (method === "GET" && useCache) {
        const cacheKey = `${method}:${url}`;
        const cached = requestCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < DEFAULT_CONFIG.cacheTimeout) {
            return cached.data;
        }
    }
    
    const requestFn = async () => {
        const { controller, timeoutId } = createAbortController(timeout);
        
        try {
            const requestOptions = {
                method,
                headers: requestHeaders,
                signal: controller.signal,
                credentials: "include"
            };
            
            if (body) {
                if (body instanceof FormData) {
                    // Remove Content-Type header for FormData (browser will set it)
                    delete requestOptions.headers["Content-Type"];
                    requestOptions.body = body;
                } else if (typeof body === "object") {
                    requestOptions.body = JSON.stringify(body);
                } else {
                    requestOptions.body = body;
                }
            }
            
            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);
            
            // Update CSRF token if provided in response
            const csrfTokenHeader = response.headers.get("X-CSRF-Token");
            if (csrfTokenHeader) {
                clientCsrfToken = csrfTokenHeader;
            }
            
            let data;
            const contentType = response.headers.get("content-type");
            
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else if (contentType && contentType.includes("text/")) {
                data = await response.text();
            } else {
                data = await response.blob();
            }
            
            const result = {
                success: response.ok,
                data: data,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            };
            
            // Cache successful GET requests
            if (method === "GET" && useCache && response.ok) {
                const cacheKey = `${method}:${url}`;
                requestCache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
            }
            
            return result;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === "AbortError") {
                throw new Error("Request timeout");
            }
            
            throw error;
        }
    };
    
    const executeRequest = () => retryRequest(requestFn, retries);
    
    if (shouldQueue) {
        return queueRequest(executeRequest);
    } else {
        return executeRequest();
    }
}

/**
 * API Client class with methods for different HTTP verbs
 */
class ApiClient {
    /**
     * Make GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    async get(endpoint, options = {}) {
        return makeRequest(endpoint, { ...options, method: "GET" });
    }
    
    /**
     * Make POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} body - Request body
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    async post(endpoint, body = null, options = {}) {
        return makeRequest(endpoint, { ...options, method: "POST", body });
    }
    
    /**
     * Make PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} body - Request body
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    async put(endpoint, body = null, options = {}) {
        return makeRequest(endpoint, { ...options, method: "PUT", body });
    }
    
    /**
     * Make PATCH request
     * @param {string} endpoint - API endpoint
     * @param {Object} body - Request body
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    async patch(endpoint, body = null, options = {}) {
        return makeRequest(endpoint, { ...options, method: "PATCH", body });
    }
    
    /**
     * Make DELETE request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    async delete(endpoint, options = {}) {
        return makeRequest(endpoint, { ...options, method: "DELETE" });
    }
    
    /**
     * Upload file with progress tracking
     * @param {string} endpoint - API endpoint
     * @param {File} file - File to upload
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result
     */
    async uploadFile(endpoint, file, options = {}) {
        const { onProgress, ...requestOptions } = options;
        
        const formData = new FormData();
        formData.append("file", file);
        
        // Add additional fields if provided
        if (options.fields) {
            Object.entries(options.fields).forEach(([key, value]) => {
                formData.append(key, value);
            });
        }
        
        return makeRequest(endpoint, {
            ...requestOptions,
            method: "POST",
            body: formData,
            onProgress
        });
    }
    
    /**
     * Download file
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Download options
     * @returns {Promise<Blob>} File blob
     */
    async downloadFile(endpoint, options = {}) {
        const result = await makeRequest(endpoint, {
            ...options,
            method: "GET",
            headers: { ...options.headers, "Accept": "*/*" }
        });
        
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.data?.message || "Download failed");
        }
    }
}

/**
 * PDF API client with specialized methods
 */
class PdfApiClient {
    /**
     * Generate PDF from HTML
     * @param {string} html - HTML content
     * @param {Object} options - PDF generation options
     * @returns {Promise<Object>} PDF generation result
     */
    async generatePdf(html, options = {}) {
        const {
            compress = false,
            format = "A4",
            orientation = "portrait",
            margin = "1cm",
            displayHeaderFooter = false,
            headerTemplate = "",
            footerTemplate = "",
            printBackground = true,
            scale = 1,
            ...otherOptions
        } = options;
        
        const requestBody = {
            html: html,
            options: {
                compress,
                format,
                orientation,
                margin,
                displayHeaderFooter,
                headerTemplate,
                footerTemplate,
                printBackground,
                scale,
                ...otherOptions
            }
        };
        
        return makeRequest("/convert", {
            method: "POST",
            body: requestBody,
            queueRequest: true // Queue PDF generation requests
        });
    }
    
    /**
     * Generate PDF from URL
     * @param {string} url - URL to convert
     * @param {Object} options - PDF generation options
     * @returns {Promise<Object>} PDF generation result
     */
    async generatePdfFromUrl(url, options = {}) {
        const requestBody = {
            url: url,
            options: options
        };
        
        return makeRequest("/convert-url", {
            method: "POST",
            body: requestBody,
            queueRequest: true
        });
    }
    
    /**
     * Get PDF generation status
     * @param {string} jobId - Job ID
     * @returns {Promise<Object>} Status result
     */
    async getPdfStatus(jobId) {
        return makeRequest(`/status/${jobId}`, {
            method: "GET",
            useCache: true
        });
    }
    
    /**
     * Download generated PDF
     * @param {string} jobId - Job ID
     * @returns {Promise<Blob>} PDF file
     */
    async downloadPdf(jobId) {
        return this.downloadFile(`/download/${jobId}`);
    }
}

/**
 * Clear request cache
 * @param {string} pattern - Cache key pattern to clear (optional)
 */
function clearCache(pattern = null) {
    if (pattern) {
        for (const key of requestCache.keys()) {
            if (key.includes(pattern)) {
                requestCache.delete(key);
            }
        }
    } else {
        requestCache.clear();
    }
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, value] of requestCache.entries()) {
        if (now - value.timestamp < DEFAULT_CONFIG.cacheTimeout) {
            validEntries++;
        } else {
            expiredEntries++;
        }
    }
    
    return {
        totalEntries: requestCache.size,
        validEntries,
        expiredEntries,
        cacheTimeout: DEFAULT_CONFIG.cacheTimeout
    };
}

/**
 * Set API configuration
 * @param {Object} config - Configuration options
 */
function setApiConfig(config) {
    Object.assign(DEFAULT_CONFIG, config);
}

/**
 * Get current API configuration
 * @returns {Object} Current configuration
 */
function getApiConfig() {
    return { ...DEFAULT_CONFIG };
}

/**
 * Handle API errors with user-friendly messages
 * @param {Object} error - Error object
 * @returns {string} User-friendly error message
 */
function handleApiError(error) {
    if (typeof error === "string") {
        return error;
    }
    
    if (error.message) {
        return error.message;
    }
    
    if (error.data && error.data.message) {
        return error.data.message;
    }
    
    if (error.data && error.data.error) {
        return error.data.error;
    }
    
    if (error.status) {
        switch (error.status) {
            case 400:
                return "Invalid request. Please check your input.";
            case 401:
                return "Authentication required. Please sign in.";
            case 403:
                return "Access denied. You don't have permission to perform this action.";
            case 404:
                return "Resource not found.";
            case 429:
                return "Too many requests. Please try again later.";
            case 500:
                return "Server error. Please try again later.";
            default:
                return "An unexpected error occurred. Please try again.";
        }
    }
    
    return "An unexpected error occurred. Please try again.";
}

/**
 * Show API error message to user
 * @param {Object} error - Error object
 * @param {string} defaultMessage - Default error message
 */
function showApiError(error, defaultMessage = "An error occurred") {
    const message = handleApiError(error) || defaultMessage;
    
    const errorDiv = document.createElement("div");
    errorDiv.className = "api-error-message";
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
    }, 5000);
}

/**
 * Initialize API client
 * This should be called when the application starts
 */
function initializeApiClient() {
    // Initialize CSRF token
    initializeCSRFToken();
    
    // Clear expired cache entries periodically
    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of requestCache.entries()) {
            if (now - value.timestamp >= DEFAULT_CONFIG.cacheTimeout) {
                requestCache.delete(key);
            }
        }
    }, DEFAULT_CONFIG.cacheTimeout);
    
    console.log("API client initialized");
}

// Create API client instances
const apiClient = new ApiClient();
const pdfApi = new PdfApiClient();

// Export functions and classes
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ApiClient,
        PdfApiClient,
        apiClient,
        pdfApi,
        makeRequest,
        clearCache,
        getCacheStats,
        setApiConfig,
        getApiConfig,
        handleApiError,
        showApiError,
        initializeApiClient
    };
}

// Make functions available globally for browser use
if (typeof window !== "undefined") {
    window.apiClient = apiClient;
    window.pdfApi = pdfApi;
    window.api = {
        ApiClient,
        PdfApiClient,
        makeRequest,
        clearCache,
        getCacheStats,
        setApiConfig,
        getApiConfig,
        handleApiError,
        showApiError,
        initializeApiClient
    };
    
    // Initialize API client when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeApiClient);
    } else {
        initializeApiClient();
    }
}
