# PDF Service Development Guide

## Overview

This guide provides comprehensive information for developers working on the PDF Service project. It covers development setup, coding standards, testing procedures, debugging techniques, and contribution guidelines.

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: Version 2.30.0 or higher
- **Operating System**: Windows 10+, macOS 10.15+, or Ubuntu 18.04+

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/html-to-pdf-service-node.git
   cd html-to-pdf-service-node
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit environment variables
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Create database directories
   mkdir -p database/users database/config database/sessions
   
   # Initialize system configuration
   node scripts/init-config.js
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=9005
NODE_ENV=development
HOST=localhost

# Security
SESSION_SECRET=your-session-secret-here
CSRF_SECRET=your-csrf-secret-here
BCRYPT_ROUNDS=12

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@your-domain.com

# File Storage
UPLOAD_DIR=uploads
TEMP_DIR=temp
MAX_FILE_SIZE=10485760

# Rate Limiting
DEFAULT_RATE_LIMIT=1000
RATE_LIMIT_WINDOW=3600000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## Project Structure

```
html-to-pdf-service-node/
├── app.js                          # Main application entry point
├── package.json                    # Dependencies and scripts
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── README.md                       # Project overview
├── ARCHITECTURE.md                 # System architecture documentation
├── API.md                          # API documentation
├── DEVELOPMENT.md                  # This file
├── DEPLOYMENT.md                   # Deployment guide
├── SECURITY.md                     # Security documentation
├── CODE_STANDARDS.md               # Coding standards
├── database/                       # File-based database
│   ├── users/                      # User data files
│   ├── config/                     # System configuration
│   ├── sessions/                   # Session storage
│   └── README.md                   # Database documentation
├── middleware/                     # Express middleware
│   ├── apiKeyAuth.js               # API key authentication
│   ├── sessionAuth.js              # Session management
│   ├── rateLimitAuth.js            # Rate limiting
│   ├── validation.js               # Request validation
│   └── README.md                   # Middleware documentation
├── routes/                         # API route handlers
│   ├── auth.js                     # Authentication routes
│   ├── dashboard.js                # Dashboard routes
│   ├── html2pdf.js                 # PDF generation routes
│   └── README.md                   # Routes documentation
├── services/                       # Business logic services
│   ├── authService.js              # Authentication service
│   ├── userService.js              # User management service
│   ├── apiKeyService.js            # API key service
│   ├── configService.js            # Configuration service
│   └── README.md                   # Services documentation
├── utils/                          # Utility functions
│   ├── fileSystem.js               # File system utilities
│   ├── validation.js               # Validation utilities
│   ├── encryption.js               # Encryption utilities
│   └── README.md                   # Utilities documentation
├── public/                         # Static files
│   ├── css/                        # Stylesheets
│   ├── js/                         # Client-side JavaScript
│   │   ├── auth.js                 # Authentication module
│   │   ├── dashboard.js            # Dashboard module
│   │   ├── validation.js           # Validation module
│   │   ├── api-client.js           # API client module
│   │   └── README.md               # Frontend JS documentation
│   └── pages/                      # HTML pages
│       ├── index.html              # Landing page
│       ├── register.html            # Registration page
│       ├── login.html               # Login page
│       ├── dashboard.html           # User dashboard
│       ├── profile.html             # Profile management
│       ├── password-reset.html      # Password reset
│       └── html2pdf-test-ui.html    # PDF generator UI
├── tests/                          # Test files
│   ├── unit/                       # Unit tests
│   ├── integration/                 # Integration tests
│   ├── e2e/                        # End-to-end tests
│   └── fixtures/                   # Test data
├── scripts/                        # Build and utility scripts
│   ├── init-config.js              # Initialize configuration
│   ├── migrate.js                  # Database migration
│   └── backup.js                   # Backup utility
├── logs/                           # Log files
├── uploads/                        # File uploads
├── temp/                           # Temporary files
└── docs/                           # Additional documentation
```

## Development Workflow

### Git Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding standards
   - Write tests for new functionality
   - Update documentation

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

4. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format

Use conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(auth): add password reset functionality

fix(pdf): resolve compression memory leak

docs(api): update endpoint documentation

test(auth): add unit tests for login validation
```

## Coding Standards

### JavaScript Standards

1. **Use ES6+ Features**
   ```javascript
   // Good
   const user = await userService.findById(id);
   const { email, profile } = user;
   
   // Avoid
   var user = await userService.findById(id);
   var email = user.email;
   var profile = user.profile;
   ```

2. **Consistent String Literals**
   ```javascript
   // Use double quotes consistently
   const message = "User created successfully";
   const error = "Validation failed";
   ```

3. **Async/Await Pattern**
   ```javascript
   // Good
   async function createUser(userData) {
     try {
       const user = await userService.create(userData);
       return { success: true, data: user };
     } catch (error) {
       return { success: false, error: error.message };
     }
   }
   
   // Avoid
   function createUser(userData) {
     return userService.create(userData)
       .then(user => ({ success: true, data: user }))
       .catch(error => ({ success: false, error: error.message }));
   }
   ```

4. **Error Handling**
   ```javascript
   // Good
   try {
     const result = await riskyOperation();
     return result;
   } catch (error) {
     logger.error('Operation failed', { error: error.message, stack: error.stack });
     throw new Error('Operation failed');
   }
   
   // Avoid
   try {
     const result = await riskyOperation();
     return result;
   } catch (error) {
     console.log(error);
     throw error;
   }
   ```

5. **Function Documentation**
   ```javascript
   /**
    * Creates a new user account with validation and security checks
    * @param {Object} userData - User registration data
    * @param {string} userData.email - User email address
    * @param {string} userData.password - User password
    * @param {Object} userData.profile - User profile information
    * @returns {Promise<Object>} Created user object
    * @throws {ValidationError} When input validation fails
    * @throws {ConflictError} When email already exists
    */
   async function createUser(userData) {
     // Implementation
   }
   ```

### File Organization

1. **Import Order**
   ```javascript
   // Node.js built-in modules
   const fs = require('fs');
   const path = require('path');
   
   // Third-party modules
   const express = require('express');
   const bcrypt = require('bcryptjs');
   
   // Local modules
   const userService = require('../services/userService');
   const { validateEmail } = require('../utils/validation');
   ```

2. **Export Patterns**
   ```javascript
   // Named exports for utilities
   module.exports = {
     validateEmail,
     validatePassword,
     sanitizeInput
   };
   
   // Default export for services
   module.exports = class UserService {
     // Implementation
   };
   ```

## Testing

### Test Structure

```
tests/
├── unit/                          # Unit tests
│   ├── services/                  # Service unit tests
│   ├── utils/                     # Utility unit tests
│   └── middleware/                # Middleware unit tests
├── integration/                   # Integration tests
│   ├── auth.test.js               # Authentication flow tests
│   ├── pdf.test.js                # PDF generation tests
│   └── api.test.js                # API endpoint tests
├── e2e/                          # End-to-end tests
│   ├── user-registration.test.js  # Complete user flow
│   ├── pdf-generation.test.js     # PDF generation flow
│   └── api-key-management.test.js # API key flow
└── fixtures/                      # Test data
    ├── users.json                 # Sample user data
    ├── config.json                # Test configuration
    └── html-samples/              # HTML test samples
```

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/services/userService.test.js
```

### Test Examples

**Unit Test Example:**
```javascript
const { validateEmail } = require('../../utils/validation');

describe('Email Validation', () => {
  test('should validate correct email formats', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
  });

  test('should reject invalid email formats', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
  });
});
```

**Integration Test Example:**
```javascript
const request = require('supertest');
const app = require('../../app');

describe('Authentication API', () => {
  test('should register new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      }
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(userData.email);
  });
});
```

## Debugging

### Logging

Use structured logging throughout the application:

```javascript
const logger = require('../utils/logger');

// Info logging
logger.info('User registered successfully', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString()
});

// Error logging
logger.error('PDF generation failed', {
  userId: req.user.id,
  error: error.message,
  stack: error.stack,
  requestId: req.requestId
});

// Debug logging
logger.debug('Processing PDF options', {
  options: pdfOptions,
  userId: req.user.id
});
```

### Debug Mode

Enable debug mode for development:

```bash
# Set debug environment variable
export DEBUG=pdf-service:*

# Or use npm script
npm run dev:debug
```

### Common Debugging Scenarios

1. **PDF Generation Issues**
   ```javascript
   // Add debugging to PDF generation
   console.log('PDF Options:', pdfOptions);
   console.log('HTML Length:', html.length);
   console.log('Browser Launch:', browserOptions);
   ```

2. **Authentication Problems**
   ```javascript
   // Debug session issues
   console.log('Session Data:', req.session);
   console.log('User Data:', req.user);
   console.log('CSRF Token:', req.csrfToken());
   ```

3. **Database Operations**
   ```javascript
   // Debug file operations
   console.log('File Path:', filePath);
   console.log('File Exists:', await fileExists(filePath));
   console.log('File Content:', await readFile(filePath));
   ```

## Performance Optimization

### Code Optimization

1. **Avoid Blocking Operations**
   ```javascript
   // Good - Non-blocking
   const users = await Promise.all([
     userService.findById(id1),
     userService.findById(id2),
     userService.findById(id3)
   ]);
   
   // Avoid - Blocking
   const user1 = await userService.findById(id1);
   const user2 = await userService.findById(id2);
   const user3 = await userService.findById(id3);
   ```

2. **Memory Management**
   ```javascript
   // Good - Clean up resources
   let browser;
   try {
     browser = await puppeteer.launch();
     const page = await browser.newPage();
     // ... PDF generation
   } finally {
     if (browser) {
       await browser.close();
     }
   }
   ```

3. **Caching Strategy**
   ```javascript
   // Implement caching for frequently accessed data
   const cache = new Map();
   
   async function getCachedUser(id) {
     if (cache.has(id)) {
       return cache.get(id);
     }
     
     const user = await userService.findById(id);
     cache.set(id, user);
     return user;
   }
   ```

### Database Optimization

1. **File System Operations**
   ```javascript
   // Use atomic operations
   await writeJSONFile(filePath, data, { atomic: true });
   
   // Batch operations
   const operations = users.map(user => 
     writeJSONFile(`database/users/user-${user.id}.json`, user)
   );
   await Promise.all(operations);
   ```

2. **Memory Usage**
   ```javascript
   // Stream large files
   const stream = fs.createReadStream(largeFile);
   // Process stream chunks
   
   // Clean up temporary files
   await cleanupTempFiles();
   ```

## Security Considerations

### Input Validation

Always validate and sanitize user input:

```javascript
const { validateEmail, sanitizeInput } = require('../utils/validation');

// Validate input
if (!validateEmail(email)) {
  throw new ValidationError('Invalid email format');
}

// Sanitize input
const sanitizedData = sanitizeInput(userData);
```

### Password Security

```javascript
const bcrypt = require('bcryptjs');

// Hash passwords
const passwordHash = await bcrypt.hash(password, 12);

// Verify passwords
const isValid = await bcrypt.compare(password, passwordHash);
```

### API Key Security

```javascript
// Generate secure API keys
const apiKey = generateApiKey();

// Validate API key format
if (!validateApiKeyFormat(apiKey)) {
  throw new Error('Invalid API key format');
}
```

## Deployment Preparation

### Build Process

```bash
# Install production dependencies
npm ci --only=production

# Run tests
npm test

# Build assets (if applicable)
npm run build

# Create deployment package
npm run package
```

### Environment Configuration

```bash
# Set production environment
export NODE_ENV=production

# Set production port
export PORT=9005

# Set secure session secret
export SESSION_SECRET=your-secure-session-secret
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :9005
   
   # Kill process
   kill -9 <PID>
   ```

2. **Permission Denied**
   ```bash
   # Fix file permissions
   chmod 755 database/
   chmod 644 database/users/*.json
   ```

3. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   node --max-old-space-size=4096 app.js
   ```

### Performance Issues

1. **Slow PDF Generation**
   - Check browser launch options
   - Monitor memory usage
   - Implement request queuing

2. **High Memory Usage**
   - Review file operations
   - Check for memory leaks
   - Implement garbage collection

3. **Database Performance**
   - Optimize file operations
   - Implement caching
   - Consider database migration

## Contributing

### Pull Request Process

1. **Fork the Repository**
2. **Create Feature Branch**
3. **Make Changes**
4. **Write Tests**
5. **Update Documentation**
6. **Submit Pull Request**

### Code Review Checklist

- [ ] Code follows project standards
- [ ] Tests pass and coverage is adequate
- [ ] Documentation is updated
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Error handling implemented
- [ ] Logging added where appropriate

### Issue Reporting

When reporting issues, include:

1. **Environment Information**
   - Node.js version
   - Operating system
   - Package versions

2. **Steps to Reproduce**
   - Clear step-by-step instructions
   - Sample code or data

3. **Expected vs Actual Behavior**
   - What should happen
   - What actually happens

4. **Error Messages**
   - Complete error logs
   - Stack traces

5. **Additional Context**
   - Screenshots
   - Related issues
   - Workarounds

## Resources

### Documentation
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/guide/)
- [Puppeteer Documentation](https://pptr.dev/)
- [bcryptjs Documentation](https://www.npmjs.com/package/bcryptjs)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [VS Code](https://code.visualstudio.com/) - Recommended editor
- [Git](https://git-scm.com/) - Version control
- [npm](https://www.npmjs.com/) - Package management

### Community
- [Node.js Community](https://nodejs.org/en/community/)
- [Express.js Community](https://expressjs.com/en/resources/community.html)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/node.js)

This development guide provides comprehensive information for working with the PDF Service project. Follow these guidelines to ensure consistent, secure, and maintainable code.
