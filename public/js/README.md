# Frontend JavaScript Modules

This directory contains the frontend JavaScript modules for the PDF Service authentication and user management system. These modules provide comprehensive client-side functionality for user interaction, API communication, and data management.

## Overview

The JavaScript modules are organized into logical components that handle different aspects of the frontend application:

- **`validation.js`** - Client-side validation functions and form handling
- **`auth.js`** - Authentication and session management
- **`dashboard.js`** - Dashboard functionality and user management
- **`api-client.js`** - API communication and request handling

## Module Architecture

```
public/js/
├── validation.js      # Form validation and input handling
├── auth.js           # Authentication and session management
├── dashboard.js      # Dashboard functionality and user management
├── api-client.js     # API communication and request handling
└── README.md         # This documentation file
```

## Module Descriptions

### Validation Module (`validation.js`)

Provides comprehensive client-side validation functions for forms, input fields, and user data.

**Key Functions:**
- `validateEmail(email)` - Email format validation
- `validatePassword(password, options)` - Password strength validation
- `validateDateOfBirth(dateOfBirth, minAge)` - Date validation (DD/MM/YYYY)
- `validateName(name, fieldName)` - Name validation
- `validateAddress(address, fieldName, required)` - Address validation
- `validateForm(formData, validationRules)` - Comprehensive form validation
- `validateFieldRealTime(field, rules, errorElement)` - Real-time validation
- `initializeRealTimeValidation(form, validationRules)` - Set up real-time validation

**Features:**
- Real-time validation with visual feedback
- Accessibility support with ARIA attributes
- Error message management and display
- Password strength requirements
- Date format validation
- Input sanitization

**Usage:**
```javascript
// Validate individual fields
const emailValid = validateEmail('user@example.com');
const passwordValid = validatePassword('SecurePass123!');

// Set up real-time validation
initializeRealTimeValidation(form, validationRules);
```

### Authentication Module (`auth.js`)

Handles all authentication-related operations including user registration, login, logout, password management, and session handling.

**Key Functions:**
- `registerUser(userData)` - Register new user account
- `loginUser(email, password, rememberMe)` - Authenticate user
- `logoutUser()` - Logout user and clear session
- `checkSession()` - Validate current session
- `refreshSession()` - Refresh user session
- `getCurrentUser()` - Get current user profile
- `requestPasswordReset(email)` - Request password reset
- `resetPassword(token, newPassword, confirmPassword)` - Reset password
- `changePassword(currentPassword, newPassword, confirmPassword)` - Change password
- `verifyEmail(token)` - Verify email address

**Features:**
- Automatic session management
- CSRF token handling
- Local storage management
- Error handling and user feedback
- Automatic redirect handling
- Session refresh and validation

**Usage:**
```javascript
// Register new user
const result = await registerUser(userData);

// Login user
const loginResult = await loginUser(email, password);

// Check session
const sessionValid = await checkSession();
```

### Dashboard Module (`dashboard.js`)

Provides comprehensive dashboard functionality including user profile management, API key operations, usage statistics, and account settings.

**Key Functions:**
- `loadDashboardData()` - Load all dashboard data
- `getProfile()` - Get user profile information
- `updateProfile(profileData)` - Update user profile
- `getApiKey()` - Get API key information
- `regenerateApiKey()` - Generate new API key
- `getUsageStats(period, limit)` - Get usage statistics
- `getAccountStats()` - Get account statistics
- `getSecurityInfo()` - Get security information
- `deleteAccount(confirmPassword)` - Delete user account
- `copyToClipboard(text)` - Copy text to clipboard

**Features:**
- Real-time data updates
- Interactive visualizations
- Export functionality
- Responsive design support
- Error handling and user feedback
- Data formatting and display

**Usage:**
```javascript
// Load dashboard data
const data = await loadDashboardData();

// Update user profile
const result = await updateProfile(profileData);

// Regenerate API key
const newKey = await regenerateApiKey();
```

### API Client Module (`api-client.js`)

Provides a comprehensive API client for making authenticated requests to the PDF Service backend.

**Key Classes:**
- `ApiClient` - General API client with HTTP methods
- `PdfApiClient` - Specialized PDF generation client

**Key Functions:**
- `makeRequest(endpoint, options)` - Make HTTP request
- `clearCache(pattern)` - Clear request cache
- `getCacheStats()` - Get cache statistics
- `setApiConfig(config)` - Set API configuration
- `handleApiError(error)` - Handle API errors
- `showApiError(error, defaultMessage)` - Show error messages

**Features:**
- Automatic authentication handling
- Request/response interceptors
- Error handling and retry logic
- Request caching and optimization
- Progress tracking for file uploads
- Response validation
- Rate limiting awareness
- Offline support

**Usage:**
```javascript
// Make authenticated request
const result = await apiClient.get('/dashboard/profile');

// Generate PDF
const pdfResult = await pdfApi.generatePdf(htmlContent, options);

// Upload file with progress
const uploadResult = await apiClient.uploadFile('/upload', file, {
    onProgress: (progress) => console.log(progress)
});
```

## Common Patterns

### Error Handling

All modules follow consistent error handling patterns:

```javascript
try {
    const result = await someAsyncFunction();
    if (result.success) {
        // Handle success
        showSuccessMessage(result.message);
    } else {
        // Handle API error
        showErrorMessage(result.error);
    }
} catch (error) {
    // Handle unexpected error
    console.error('Operation failed:', error);
    showErrorMessage('An unexpected error occurred');
}
```

### Loading States

Modules provide loading state management:

```javascript
// Show loading state
showLoadingState(element, 'Loading data...');

// Hide loading state
element.innerHTML = 'Data loaded successfully';
```

### User Feedback

Consistent user feedback mechanisms:

```javascript
// Success messages
showSuccessMessage('Operation completed successfully');

// Error messages
showErrorMessage('Operation failed. Please try again.');

// Validation errors
showFieldError(field, 'Invalid input');
```

## Integration with Backend

The frontend modules integrate seamlessly with the backend API:

1. **Authentication Flow** - Uses `/auth/*` endpoints for user management
2. **Dashboard Operations** - Uses `/dashboard/*` endpoints for user data
3. **PDF Generation** - Uses `/convert` endpoint for PDF creation
4. **Session Management** - Automatic session handling with cookies

## Security Features

### Authentication
- Session-based authentication using cookies
- CSRF protection with token validation
- Automatic session refresh and validation
- Secure password handling

### Data Protection
- Input validation and sanitization
- XSS prevention
- Secure API communication
- Local storage encryption

### Error Handling
- Comprehensive error handling
- User-friendly error messages
- No sensitive data exposure
- Graceful degradation

## Browser Compatibility

The modules are designed to work with modern browsers:

- **Chrome** 60+
- **Firefox** 55+
- **Safari** 12+
- **Edge** 79+

### Polyfills
For older browser support, consider adding polyfills for:
- `fetch` API
- `Promise` support
- `async/await` syntax
- `Map` and `Set` objects

## Performance Considerations

### Optimization Features
- Request caching for GET requests
- Request queuing for rate limiting
- Lazy loading of modules
- Efficient DOM manipulation

### Best Practices
- Minimal DOM queries
- Event delegation
- Debounced input validation
- Efficient error handling

## Testing

Each module includes comprehensive error handling and validation:

- **Input validation** - All inputs are validated and sanitized
- **Error responses** - Consistent error format with user-friendly messages
- **Edge cases** - Handles network errors, timeouts, and invalid responses
- **Accessibility** - ARIA attributes and keyboard navigation support

## Usage Examples

### Complete Registration Flow
```javascript
// Initialize validation
initializeRealTimeValidation(form, validationRules);

// Handle form submission
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const userData = {
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        profile: {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            // ... other profile fields
        }
    };
    
    const result = await registerUser(userData);
    if (result.success) {
        showSuccessMessage('Registration successful!');
        window.location.href = '/pages/login.html';
    } else {
        showErrorMessage(result.error);
    }
});
```

### Dashboard Data Loading
```javascript
// Load dashboard data
const dashboardData = await loadDashboardData();

if (dashboardData.success) {
    // Update UI with data
    updateUserInfo(dashboardData.profile);
    updateApiKeyInfo(dashboardData.apiKey);
    updateUsageStats(dashboardData.usage);
    updateAccountStats(dashboardData.stats);
} else {
    showErrorMessage('Failed to load dashboard data');
}
```

### PDF Generation
```javascript
// Generate PDF with options
const pdfResult = await pdfApi.generatePdf(htmlContent, {
    compress: true,
    format: 'A4',
    orientation: 'portrait',
    margin: '1cm'
});

if (pdfResult.success) {
    // Download PDF
    const pdfBlob = pdfResult.data;
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.pdf';
    link.click();
} else {
    showErrorMessage('PDF generation failed');
}
```

## Future Enhancements

Planned improvements for the JavaScript modules:

1. **Offline Support** - Service worker integration for offline functionality
2. **Real-time Updates** - WebSocket integration for live data updates
3. **Advanced Caching** - IndexedDB integration for persistent caching
4. **Performance Monitoring** - Built-in performance tracking
5. **Accessibility Improvements** - Enhanced screen reader support
6. **Internationalization** - Multi-language support

## Troubleshooting

Common issues and solutions:

### Module Loading Issues
- **Problem**: Modules not loading
- **Solution**: Check script tags and module dependencies

### Authentication Problems
- **Problem**: Session not persisting
- **Solution**: Verify cookie settings and CSRF token

### API Communication Issues
- **Problem**: Requests failing
- **Solution**: Check network connectivity and API endpoints

### Validation Errors
- **Problem**: Form validation not working
- **Solution**: Verify validation rules and form structure

## Contributing

When adding new functionality:

1. Follow the established patterns for error handling and validation
2. Include comprehensive JSDoc documentation
3. Add accessibility support with ARIA attributes
4. Test thoroughly with various input scenarios
5. Update this documentation

## Dependencies

The modules depend on:

- **Modern JavaScript** - ES6+ features
- **Fetch API** - For HTTP requests
- **Local Storage** - For data persistence
- **DOM APIs** - For user interaction

## License

This code is part of the PDF Service project and follows the same licensing terms.
