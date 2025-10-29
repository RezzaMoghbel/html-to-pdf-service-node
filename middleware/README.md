# Middleware Documentation

This directory contains Express middleware functions for the API Key Authentication System. Each middleware provides specific functionality for request processing, authentication, validation, and security.

## Architecture Overview

```
middleware/
├── apiKeyAuth.js      # API key authentication and usage tracking
├── sessionAuth.js     # Session management and authentication
├── rateLimitAuth.js   # Rate limiting and abuse prevention
├── validation.js      # Request validation and sanitization
└── README.md         # This file
```

## Middleware Execution Order

```
Request → Rate Limiting → Validation → Authentication → Route Handler → Response
```

## Middleware Descriptions

### ApiKeyAuth (`apiKeyAuth.js`)

**Purpose**: Validates API keys and tracks usage for protected endpoints.

**Key Functions**:

- `apiKeyAuth` - Main API key authentication middleware
- `optionalApiKeyAuth` - Optional API key validation
- `adminApiKeyAuth` - Admin-only API key authentication
- `rateLimitCheck` - Rate limit checking without tracking
- `apiKeyValidationOnly` - Validation without usage tracking

**Flow**:

1. Extract API key from headers
2. Validate key format and find user
3. Check user account status
4. Verify rate limits
5. Track usage and attach user data

### SessionAuth (`sessionAuth.js`)

**Purpose**: Manages user sessions with express-session and file storage.

**Key Functions**:

- `configureSession` - Configure session middleware
- `sessionAuth` - Session authentication middleware
- `optionalSessionAuth` - Optional session validation
- `csrfProtection` - CSRF token validation
- `loginSession` - Create session on login
- `logoutSession` - Destroy session on logout

**Features**:

- Secure session cookies
- CSRF protection
- Session timeout handling
- Automatic cleanup

### RateLimitAuth (`rateLimitAuth.js`)

**Purpose**: Provides rate limiting for different endpoint types.

**Key Functions**:

- `rateLimit` - General rate limiting
- `authRateLimit` - Authentication endpoint limiting
- `registrationRateLimit` - Registration limiting
- `passwordResetRateLimit` - Password reset limiting
- `apiRateLimit` - API endpoint limiting

**Features**:

- IP-based tracking
- Configurable limits
- Progressive blocking
- Memory cleanup

### Validation (`validation.js`)

**Purpose**: Validates and sanitizes request data.

**Key Functions**:

- `validateBody` - Request body validation
- `validateQuery` - Query parameter validation
- `validateHeaders` - Header validation
- `validateUserRegistration` - User registration validation
- `validateLogin` - Login validation
- `sanitizeRequest` - Input sanitization

**Features**:

- Schema-based validation
- Input sanitization
- Custom error messages
- Type conversion

## Usage Examples

### API Key Authentication

```javascript
const { apiKeyAuth } = require("./middleware/apiKeyAuth");

// Protect all API endpoints
app.use("/api/v1", apiKeyAuth);

// Optional authentication
app.use("/api/v1/public", optionalApiKeyAuth);

// Admin-only endpoints
app.use("/api/v1/admin", adminApiKeyAuth);
```

### Session Management

```javascript
const { configureSession, sessionAuth } = require("./middleware/sessionAuth");

// Configure session middleware
app.use(configureSession(app));

// Protect dashboard routes
app.use("/dashboard", sessionAuth);
```

### Rate Limiting

```javascript
const {
  authRateLimit,
  registrationRateLimit,
} = require("./middleware/rateLimitAuth");

// Rate limit authentication endpoints
app.use(
  "/login",
  authRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  })
);

// Rate limit registration
app.use(
  "/register",
  registrationRateLimit({
    maxRegistrations: 3,
    windowMs: 60 * 60 * 1000,
  })
);
```

### Request Validation

```javascript
const {
  validateBody,
  validateUserRegistration,
} = require("./middleware/validation");

// Validate user registration
app.post("/register", validateUserRegistration(), (req, res) => {
  // req.body contains validated data
});

// Custom validation
const userSchema = {
  email: { type: "string", required: true, format: "email" },
  password: { type: "string", required: true, minLength: 8 },
};
app.post("/users", validateBody(userSchema), (req, res) => {
  // req.body is validated
});
```

## Security Features

### Authentication Security

- API key format validation
- User account status checking
- Rate limit enforcement
- Usage tracking

### Session Security

- Secure cookie settings
- CSRF token protection
- Session timeout
- Automatic cleanup

### Input Security

- Request validation
- Input sanitization
- XSS prevention
- SQL injection protection

### Rate Limiting Security

- IP-based tracking
- Progressive blocking
- Abuse prevention
- Memory management

## Error Handling

All middleware follows consistent error handling patterns:

```javascript
// Standard error response format
{
  success: false,
  error: 'Error type',
  message: 'Human-readable message',
  code: 'ERROR_CODE',
  details: [] // Optional additional details
}
```

## Performance Considerations

### Memory Management

- Rate limit cleanup
- Session cleanup
- Validation caching
- Efficient data structures

### Caching

- Session data caching
- Rate limit caching
- Validation result caching

### Optimization

- Minimal processing
- Early returns
- Efficient algorithms
- Resource cleanup

## Testing

### Unit Tests

- Individual middleware functions
- Error scenarios
- Edge cases
- Mock dependencies

### Integration Tests

- Middleware chains
- Request/response flow
- Error handling
- Performance testing

## Configuration

### Environment Variables

```bash
SESSION_SECRET=your-session-secret
NODE_ENV=production
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Middleware Configuration

```javascript
// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: "Rate limit exceeded",
};

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 86400000, // 24 hours
  },
};
```

## Troubleshooting

### Common Issues

1. **Session Not Persisting**

   - Check session secret
   - Verify cookie settings
   - Check session store configuration

2. **Rate Limit Not Working**

   - Verify IP extraction
   - Check rate limit configuration
   - Monitor memory usage

3. **Validation Errors**

   - Check schema definition
   - Verify input format
   - Check sanitization settings

4. **API Key Issues**
   - Verify key format
   - Check user status
   - Monitor usage tracking

### Debug Commands

```bash
# Check session files
ls -la database/sessions/

# Monitor rate limits
node -e "console.log(require('./middleware/rateLimitAuth').getRateLimitStatistics())"

# Test validation
curl -X POST http://localhost:9005/register -H "Content-Type: application/json" -d '{"email":"test@example.com"}'
```

## Best Practices

### Security

- Use HTTPS in production
- Implement proper CORS
- Validate all inputs
- Sanitize user data
- Monitor for abuse

### Performance

- Implement caching
- Optimize middleware order
- Monitor memory usage
- Clean up resources
- Use efficient algorithms

### Maintenance

- Log middleware events
- Monitor error rates
- Update dependencies
- Test regularly
- Document changes

## Future Enhancements

### Planned Features

- Redis session store
- Advanced rate limiting
- Machine learning abuse detection
- Real-time monitoring
- Automated scaling

### Migration Path

1. **Phase 1**: Current file-based system
2. **Phase 2**: Add Redis caching
3. **Phase 3**: Full Redis migration
4. **Phase 4**: Advanced features
