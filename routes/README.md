# API Routes Documentation

This directory contains the Express.js API route modules for the PDF Service authentication and user management system.

## Overview

The routes are organized into logical modules that handle different aspects of the application:

- **`auth.js`** - Authentication endpoints (login, register, password reset, etc.)
- **`dashboard.js`** - User dashboard and profile management endpoints

## Architecture

```
routes/
├── auth.js          # Authentication API endpoints
├── dashboard.js      # Dashboard and user management endpoints
└── README.md         # This documentation file
```

## Route Modules

### Authentication Routes (`auth.js`)

Handles all authentication-related operations including user registration, login, logout, password management, and session handling.

**Base Path:** `/auth`

**Endpoints:**
- `POST /register` - Register new user account
- `POST /login` - Authenticate user and create session
- `POST /logout` - Logout user and destroy session
- `POST /forgot-password` - Request password reset token
- `POST /reset-password` - Reset password using token
- `POST /verify-email` - Verify email address using token
- `POST /change-password` - Change password for authenticated user
- `GET /session` - Get current session information
- `POST /refresh-session` - Refresh session to extend timeout
- `GET /me` - Get current user profile
- `GET /config` - Get authentication configuration

**Security Features:**
- Rate limiting on all endpoints
- CSRF protection for session-based operations
- Input validation and sanitization
- Secure password hashing with bcrypt
- Session timeout and refresh
- Account blocking after failed attempts

### Dashboard Routes (`dashboard.js`)

Handles user dashboard operations including profile management, API key operations, usage statistics, and account settings.

**Base Path:** `/dashboard`

**Endpoints:**
- `GET /profile` - Get user profile information
- `PUT /profile` - Update user profile information
- `GET /api-key` - Get user's API key information
- `POST /api-key/regenerate` - Regenerate user's API key
- `GET /usage` - Get user's API usage statistics
- `GET /stats` - Get comprehensive user statistics
- `GET /security` - Get user's security information and history
- `GET /pdf-generator` - Get PDF generator access URL with API key
- `DELETE /account` - Delete user account (soft delete)

**Security Features:**
- Session-based authentication required
- CSRF protection on all state-changing operations
- Rate limiting on all endpoints
- Input validation and sanitization
- User data isolation and privacy

## Common Patterns

### Response Format

All API endpoints return consistent JSON responses:

```json
{
  "success": boolean,
  "message": string,
  "data": object (optional),
  "error": string (optional),
  "code": string (optional)
}
```

### Error Handling

Errors are handled consistently across all routes:

- **400 Bad Request** - Validation errors, invalid input
- **401 Unauthorized** - Authentication required, invalid credentials
- **403 Forbidden** - Account blocked, insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource already exists
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server errors

### Rate Limiting

All endpoints implement rate limiting with different limits based on the operation:

- **Authentication endpoints** - 5 requests per 15 minutes
- **Registration** - 5 requests per 15 minutes
- **Password reset** - 3 requests per hour
- **Profile updates** - 10 requests per hour
- **API key operations** - 3 requests per hour
- **General dashboard** - 60 requests per hour
- **Account deletion** - 1 request per hour

### Input Validation

All endpoints use comprehensive input validation:

- **Email validation** - Format, length, domain validation
- **Password validation** - Length, complexity requirements
- **Profile data validation** - Required fields, format validation
- **Query parameter validation** - Type checking, range validation
- **Sanitization** - XSS prevention, input cleaning

## Security Considerations

### Authentication
- Session-based authentication using `express-session`
- CSRF protection on state-changing operations
- Secure session configuration with HTTP-only cookies
- Session timeout and refresh mechanisms

### Authorization
- User data isolation - users can only access their own data
- API key validation and usage tracking
- Account blocking mechanisms for security violations

### Data Protection
- Password hashing with bcrypt (12 rounds)
- Sensitive data removal from responses
- Input sanitization and validation
- Rate limiting to prevent abuse

### Logging and Monitoring
- Comprehensive error logging
- Failed login attempt tracking
- API usage monitoring
- Security event logging

## Usage Examples

### User Registration
```javascript
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "01/01/1990",
    "address1": "123 Main St",
    "city": "London",
    "postcode": "SW1A 1AA",
    "country": "United Kingdom"
  }
}
```

### User Login
```javascript
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### Get API Key
```javascript
GET /dashboard/api-key
Cookie: pdf-service-session=session_token
```

### Regenerate API Key
```javascript
POST /dashboard/api-key/regenerate
Cookie: pdf-service-session=session_token
X-CSRF-Token: csrf_token
```

## Integration with Frontend

The routes are designed to work seamlessly with the frontend pages:

1. **Authentication flow** - Login/register pages use `/auth/*` endpoints
2. **Dashboard** - User dashboard uses `/dashboard/*` endpoints
3. **PDF Generator** - Dashboard provides API key for PDF generation
4. **Session management** - Automatic session handling and refresh

## Testing

Each route module includes comprehensive error handling and validation:

- **Input validation** - All inputs are validated and sanitized
- **Error responses** - Consistent error format with appropriate HTTP status codes
- **Rate limiting** - Protection against abuse and DoS attacks
- **Security checks** - Authentication and authorization validation

## Future Enhancements

Planned improvements for the route modules:

1. **API versioning** - Support for multiple API versions
2. **Webhook support** - Event notifications for account changes
3. **Bulk operations** - Batch processing for multiple users
4. **Advanced analytics** - Detailed usage analytics and reporting
5. **Admin endpoints** - Administrative functions for user management
6. **Audit logging** - Comprehensive audit trail for all operations

## Dependencies

The route modules depend on:

- **Services** - `userService`, `authService`, `apiKeyService`, `configService`
- **Middleware** - `sessionAuth`, `rateLimitAuth`, `validation`
- **Utilities** - `validation`, `encryption`, `fileSystem`

## Contributing

When adding new routes:

1. Follow the established patterns for error handling and validation
2. Implement appropriate rate limiting
3. Add comprehensive JSDoc documentation
4. Include security considerations
5. Test thoroughly with various input scenarios
6. Update this documentation

## Troubleshooting

Common issues and solutions:

### Session Issues
- **Problem**: Session not persisting
- **Solution**: Check session configuration and cookie settings

### Rate Limiting
- **Problem**: Too many requests error
- **Solution**: Implement exponential backoff in frontend

### Validation Errors
- **Problem**: Input validation failing
- **Solution**: Check validation schemas and input format

### Authentication Failures
- **Problem**: Login not working
- **Solution**: Verify password hashing and user lookup logic
