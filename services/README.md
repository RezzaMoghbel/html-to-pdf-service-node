# Services Documentation

This directory contains the core business logic services for the API Key Authentication System. Each service is designed to be modular, well-documented, and maintainable.

## Architecture Overview

```
services/
├── authService.js      # Authentication and session management
├── userService.js      # User account CRUD operations
├── apiKeyService.js    # API key generation and usage tracking
├── configService.js    # System configuration management
└── README.md          # This file
```

## Service Interaction Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Middleware    │    │   Services      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Login Form  │ │───▶│ │ Auth Check  │ │───▶│ │ AuthService │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │         │       │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │         ▼       │
│ │ API Request │ │───▶│ │ API Key     │ │───▶│ ┌─────────────┐ │
│ └─────────────┘ │    │ │ Validation  │ │    │ │ UserService │ │
│                 │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │         │       │
│                 │    │                 │    │         ▼       │
│                 │    │                 │    │ ┌─────────────┐ │
│                 │    │                 │    │ │ ApiKeyService│ │
│                 │    │                 │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Service Descriptions

### AuthService (`authService.js`)

**Purpose**: Handles user authentication, registration, password management, and session handling.

**Key Functions**:

- `register(userData)` - Create new user account with validation
- `login(email, password, ipAddress)` - Authenticate user with security checks
- `logout(userId)` - Invalidate user session
- `generatePasswordResetToken(email)` - Generate password reset token
- `resetPassword(token, newPassword)` - Reset password using token
- `resetPasswordSecure(email, dob, postcode, newPassword)` - Reset using security questions
- `sendVerificationEmail(email)` - Send email verification (if enabled)
- `verifyEmail(token)` - Verify email using token
- `refreshSession(userId)` - Refresh user session
- `changePassword(userId, currentPassword, newPassword)` - Change password

**Security Features**:

- Failed login attempt tracking
- Automatic account blocking after too many failed attempts
- Password strength validation
- Secure token generation
- Session management

**Dependencies**:

- `userService` - For user operations
- `configService` - For system configuration
- `utils/encryption` - For token generation
- `utils/validation` - For input validation

### UserService (`userService.js`)

**Purpose**: Manages user account CRUD operations and user data persistence.

**Key Functions**:

- `createUser(userData)` - Create new user with validation
- `findUserByEmail(email)` - Retrieve user by email
- `findUserById(userId)` - Retrieve user by ID
- `findUserByApiKey(apiKey)` - Find user by API key
- `updateUser(userId, updates)` - Update user data
- `deleteUser(userId)` - Soft delete user account
- `validatePassword(email, password)` - Verify password
- `incrementFailedLogin(email)` - Track failed logins
- `resetFailedLoginAttempts(email)` - Reset on success
- `blockUser(userId, reason)` - Block user account
- `unblockUser(userId)` - Unblock user account
- `getAllUsers(options)` - Get all users (admin only)
- `getUserStats()` - Get user statistics
- `updateUserPassword(userId, newPassword)` - Update password

**Data Structure**:
Each user is stored as a JSON file with the following structure:

```json
{
  "_id": "uuid-v4",
  "email": "user@example.com",
  "passwordHash": "bcrypt-hash",
  "profile": { ... },
  "apiKey": { ... },
  "security": { ... },
  "usage": { ... },
  "timestamps": { ... },
  "emailVerification": { ... }
}
```

**Dependencies**:

- `utils/fileSystem` - For file operations
- `utils/encryption` - For password hashing
- `utils/validation` - For input validation

### ApiKeyService (`apiKeyService.js`)

**Purpose**: Manages API key generation, validation, and usage tracking.

**Key Functions**:

- `generateApiKeyForUser(userId)` - Generate new API key
- `regenerateApiKey(userId)` - Regenerate API key (invalidates old)
- `validateApiKeyFormat(apiKey)` - Validate API key format and existence
- `trackApiUsage(apiKey, ipAddress)` - Log API usage
- `getRateLimitStatus(apiKey)` - Check rate limit status
- `isRateLimitExceeded(apiKey)` - Check if limit exceeded
- `resetRateLimit(userId)` - Reset rate limit counter
- `deleteApiKey(userId)` - Delete API key
- `getApiKeyInfo(userId)` - Get API key information
- `maskApiKey(apiKey)` - Mask API key for display
- `getUserUsageStats(userId)` - Get usage statistics
- `updateUserRateLimit(userId, limit, period)` - Update rate limits

**Rate Limiting**:

- Configurable per user
- Tracks requests by IP address
- Supports multiple time periods (hour, day, week, month)
- Automatic blocking when limits exceeded

**Dependencies**:

- `userService` - For user operations
- `configService` - For configuration
- `utils/encryption` - For API key generation
- `utils/validation` - For API key validation

### ConfigService (`configService.js`)

**Purpose**: Manages system-wide configuration settings.

**Key Functions**:

- `getConfig()` - Get system configuration
- `updateConfig(updates)` - Update configuration
- `toggleEmailVerification(enabled)` - Toggle email verification
- `updateRateLimits(limit, period)` - Update default rate limits
- `updateSecuritySettings(securityUpdates)` - Update security settings
- `updateFeatureFlags(featureUpdates)` - Update feature flags
- `validateConfigUpdates(updates)` - Validate configuration updates
- `resetConfigToDefaults()` - Reset to defaults
- `getConfigValue(keyPath)` - Get specific config value
- `isFeatureEnabled(featureName)` - Check if feature is enabled
- `getSupportedCountries()` - Get supported countries list
- `getRateLimitPeriodMs(period)` - Get period in milliseconds
- `exportConfig()` - Export configuration
- `importConfig(configJson)` - Import configuration

**Configuration Structure**:

```json
{
  "emailVerificationEnabled": false,
  "defaultRateLimit": 1000,
  "defaultRateLimitPeriod": "day",
  "maxFailedLogins": 30,
  "passwordResetTokenExpiry": 3600000,
  "sessionMaxAge": 86400000,
  "apiKeyPrefix": "sk_live_",
  "apiKeyLength": 32,
  "passwordMinLength": 8,
  "passwordRequireUppercase": true,
  "passwordRequireLowercase": true,
  "passwordRequireNumbers": true,
  "passwordRequireSpecialChars": true,
  "minAge": 18,
  "supportedCountries": [...],
  "rateLimitPeriods": {...},
  "security": {...},
  "features": {...},
  "logging": {...}
}
```

**Dependencies**:

- `utils/fileSystem` - For configuration file operations

## Common Patterns

### Error Handling

All services follow a consistent error handling pattern:

```javascript
try {
  // Service operation
  const result = await someOperation();
  return result;
} catch (error) {
  throw new Error(`Operation failed: ${error.message}`);
}
```

### Input Validation

Services validate inputs at the entry point:

```javascript
if (!input || typeof input !== "string") {
  throw new Error("Input is required and must be a string");
}
```

### Data Sanitization

User inputs are sanitized before processing:

```javascript
const sanitizedInput = sanitizeInput(userInput.trim());
```

### Atomic Operations

File operations are atomic to prevent data corruption:

```javascript
// Write to temp file first, then rename
const tempFile = `${filepath}.tmp.${randomId}`;
await writeFile(tempFile, data);
await rename(tempFile, filepath);
```

## Testing Guidelines

### Unit Tests

Each service should have comprehensive unit tests covering:

- Happy path scenarios
- Error conditions
- Edge cases
- Input validation
- Security scenarios

### Integration Tests

Test service interactions:

- Service-to-service communication
- Database operations
- Configuration changes
- Authentication flows

### Mock Dependencies

Use mocks for external dependencies:

```javascript
// Mock file system operations
jest.mock("../utils/fileSystem");

// Mock encryption functions
jest.mock("../utils/encryption");
```

## Security Considerations

### Password Security

- Use bcrypt with appropriate rounds (12+)
- Never log passwords
- Validate password strength
- Hash passwords immediately

### API Key Security

- Generate cryptographically secure keys
- Use appropriate prefixes
- Mask keys in logs
- Track usage patterns

### Input Validation

- Validate all inputs
- Sanitize user data
- Prevent injection attacks
- Use whitelist validation

### Rate Limiting

- Implement per-user limits
- Track by IP address
- Block excessive usage
- Log suspicious activity

## Performance Considerations

### Caching

- Cache configuration data
- Cache user lookups
- Use appropriate TTLs
- Invalidate on updates

### Database Operations

- Use atomic operations
- Minimize file I/O
- Batch operations when possible
- Handle concurrent access

### Memory Management

- Avoid memory leaks
- Clean up resources
- Monitor memory usage
- Use streaming for large data

## Monitoring and Logging

### Logging Levels

- **ERROR**: System errors, security issues
- **WARN**: Recoverable errors, suspicious activity
- **INFO**: Normal operations, user actions
- **DEBUG**: Detailed debugging information

### Log Format

```javascript
logger.info("User login successful", {
  userId: user._id,
  email: user.email,
  ipAddress: ipAddress,
  timestamp: new Date().toISOString(),
});
```

### Metrics to Track

- User registration rate
- Login success/failure rate
- API key generation rate
- Rate limit violations
- Account blocks
- Password resets

## Troubleshooting

### Common Issues

1. **File Permission Errors**

   - Check directory permissions
   - Ensure write access
   - Verify file ownership

2. **Concurrent Access Issues**

   - Implement file locking
   - Use atomic operations
   - Handle race conditions

3. **Memory Issues**

   - Monitor memory usage
   - Clean up resources
   - Optimize data structures

4. **Performance Issues**
   - Profile operations
   - Optimize file I/O
   - Implement caching

### Debug Commands

```bash
# Check service logs
tail -f logs/services.log

# Monitor file operations
strace -e trace=file node app.js

# Check memory usage
ps aux | grep node
```

## Future Enhancements

### Planned Features

- Database migration to MongoDB
- Redis caching layer
- Microservice architecture
- GraphQL API
- Real-time notifications
- Advanced analytics

### Migration Path

1. **Phase 1**: Current JSON file system
2. **Phase 2**: Add Redis caching
3. **Phase 3**: MongoDB integration
4. **Phase 4**: Full microservice split

## Contributing

### Code Standards

- Follow JSDoc documentation standards
- Use consistent error handling
- Write comprehensive tests
- Maintain backward compatibility

### Pull Request Process

1. Create feature branch
2. Write tests
3. Update documentation
4. Submit PR with description
5. Address review feedback
6. Merge after approval

### Code Review Checklist

- [ ] Functions have JSDoc comments
- [ ] Error handling is consistent
- [ ] Input validation is present
- [ ] Security considerations addressed
- [ ] Tests cover new functionality
- [ ] Documentation updated
- [ ] Performance impact considered
