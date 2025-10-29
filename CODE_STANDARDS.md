# PDF Service Code Standards

## Overview

This document establishes coding standards, best practices, and guidelines for the PDF Service project. These standards ensure code consistency, maintainability, readability, and quality across the entire codebase.

## General Principles

### Code Quality Principles

1. **Readability**: Code should be self-documenting and easy to understand
2. **Consistency**: Follow established patterns and conventions
3. **Maintainability**: Code should be easy to modify and extend
4. **Performance**: Optimize for performance without sacrificing readability
5. **Security**: Implement security best practices throughout
6. **Testing**: Write comprehensive tests for all functionality

### Development Philosophy

- **Fail Fast**: Detect and handle errors early
- **Explicit over Implicit**: Make intentions clear
- **Composition over Inheritance**: Prefer composition patterns
- **Immutable when Possible**: Use immutable data structures
- **Single Responsibility**: Each function/class should have one purpose

## JavaScript Standards

### Code Style

#### String Literals
```javascript
// ✅ Use double quotes consistently
const message = "User created successfully";
const error = "Validation failed";
const apiKey = "sk_live_1234567890";

// ❌ Avoid mixed quotes
const message = 'User created successfully';
const error = "Validation failed";
```

#### Variable Declarations
```javascript
// ✅ Use const for immutable values
const userId = "12345";
const config = { port: 9005 };

// ✅ Use let for mutable values
let userCount = 0;
let currentUser = null;

// ❌ Avoid var
var oldStyle = "deprecated";
```

#### Function Declarations
```javascript
// ✅ Use async/await pattern
async function createUser(userData) {
  try {
    const user = await userService.create(userData);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ✅ Use arrow functions for short operations
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ❌ Avoid callback patterns
function createUser(userData, callback) {
  userService.create(userData, (err, user) => {
    if (err) return callback(err);
    callback(null, user);
  });
}
```

#### Object and Array Handling
```javascript
// ✅ Use destructuring
const { email, profile } = user;
const [first, second] = array;

// ✅ Use spread operator
const newUser = { ...user, lastLogin: new Date() };
const newArray = [...existingArray, newItem];

// ✅ Use template literals
const message = `Welcome ${user.profile.firstName}!`;

// ❌ Avoid string concatenation
const message = "Welcome " + user.profile.firstName + "!";
```

### Naming Conventions

#### Variables and Functions
```javascript
// ✅ Use camelCase for variables and functions
const userId = "12345";
const userEmail = "user@example.com";
const isValidUser = true;

function createUser() {}
function validateEmail() {}
function getUserById() {}

// ✅ Use descriptive names
const userRegistrationData = {};
const passwordValidationResult = {};

// ❌ Avoid abbreviations and unclear names
const usr = {};
const pwd = "";
const val = true;
```

#### Constants
```javascript
// ✅ Use SCREAMING_SNAKE_CASE for constants
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_RATE_LIMIT = 1000;
const API_KEY_PREFIX = "sk_live_";

// ✅ Use descriptive constant names
const PASSWORD_MIN_LENGTH = 8;
const SESSION_TIMEOUT_MS = 86400000;
```

#### Classes and Constructors
```javascript
// ✅ Use PascalCase for classes
class UserService {}
class ApiKeyService {}
class ValidationError {}

// ✅ Use descriptive class names
class PasswordValidator {}
class FileSystemManager {}
class RateLimitChecker {}
```

### Error Handling

#### Error Types
```javascript
// ✅ Create specific error types
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthenticationError";
  }
}

class RateLimitError extends Error {
  constructor(message, retryAfter) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}
```

#### Error Handling Patterns
```javascript
// ✅ Use try-catch with specific error handling
async function processUserData(userData) {
  try {
    const validatedData = await validateUserData(userData);
    const user = await userService.create(validatedData);
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: error.message, field: error.field };
    }
    
    logger.error("User creation failed", { error: error.message, stack: error.stack });
    return { success: false, error: "Internal server error" };
  }
}

// ❌ Avoid generic error handling
async function processUserData(userData) {
  try {
    const user = await userService.create(userData);
    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
```

### Async/Await Patterns

#### Proper Async Usage
```javascript
// ✅ Use async/await consistently
async function getUserWithProfile(userId) {
  const user = await userService.findById(userId);
  const profile = await profileService.findByUserId(userId);
  
  return { ...user, profile };
}

// ✅ Handle multiple async operations
async function processMultipleUsers(userIds) {
  const promises = userIds.map(id => userService.findById(id));
  const users = await Promise.all(promises);
  
  return users.filter(user => user !== null);
}

// ❌ Avoid mixing async/await with callbacks
async function getUser(userId) {
  return new Promise((resolve, reject) => {
    userService.findById(userId, (err, user) => {
      if (err) reject(err);
      else resolve(user);
    });
  });
}
```

#### Promise Handling
```javascript
// ✅ Use Promise.all for parallel operations
async function getDashboardData(userId) {
  const [user, stats, apiKey] = await Promise.all([
    userService.findById(userId),
    statsService.getUserStats(userId),
    apiKeyService.getUserApiKey(userId)
  ]);
  
  return { user, stats, apiKey };
}

// ✅ Use Promise.allSettled for independent operations
async function getOptionalData(userId) {
  const results = await Promise.allSettled([
    userService.findById(userId),
    statsService.getUserStats(userId),
    apiKeyService.getUserApiKey(userId)
  ]);
  
  return results.map(result => result.status === "fulfilled" ? result.value : null);
}
```

## File Organization

### Directory Structure
```
src/
├── controllers/          # Route handlers
├── services/             # Business logic
├── middleware/           # Express middleware
├── utils/                # Utility functions
├── models/               # Data models
├── routes/               # Route definitions
├── config/               # Configuration files
└── tests/                # Test files
```

### File Naming
```javascript
// ✅ Use kebab-case for file names
user-service.js
api-key-auth.js
password-validator.js
file-system-utils.js

// ✅ Use descriptive file names
user-authentication-service.js
pdf-generation-controller.js
rate-limit-middleware.js

// ❌ Avoid unclear file names
utils.js
helpers.js
common.js
```

### Import/Export Patterns
```javascript
// ✅ Use named exports for utilities
module.exports = {
  validateEmail,
  validatePassword,
  sanitizeInput
};

// ✅ Use default export for services
class UserService {
  // Implementation
}

module.exports = UserService;

// ✅ Use consistent import patterns
const { validateEmail } = require("../utils/validation");
const UserService = require("../services/userService");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
```

## Documentation Standards

### JSDoc Comments
```javascript
/**
 * Creates a new user account with validation and security checks
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email address
 * @param {string} userData.password - User password
 * @param {Object} userData.profile - User profile information
 * @param {string} userData.profile.firstName - User's first name
 * @param {string} userData.profile.lastName - User's last name
 * @returns {Promise<Object>} Created user object
 * @throws {ValidationError} When input validation fails
 * @throws {ConflictError} When email already exists
 * @example
 * const user = await createUser({
 *   email: "user@example.com",
 *   password: "SecurePassword123!",
 *   profile: { firstName: "John", lastName: "Doe" }
 * });
 */
async function createUser(userData) {
  // Implementation
}
```

### Inline Comments
```javascript
// ✅ Use comments to explain complex logic
function calculateRateLimit(user, requestType) {
  // Base rate limit from user configuration
  let baseLimit = user.rateLimit || config.defaultRateLimit;
  
  // Apply multiplier based on request type
  if (requestType === "pdf_generation") {
    baseLimit *= 0.5; // PDF generation is resource-intensive
  }
  
  // Apply user tier multiplier
  const tierMultiplier = getUserTierMultiplier(user.tier);
  return Math.floor(baseLimit * tierMultiplier);
}

// ❌ Avoid obvious comments
const userId = "12345"; // Set userId to "12345"
```

### README Documentation
```markdown
# Module Name

Brief description of the module's purpose.

## Features

- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

## Usage

```javascript
const module = require("./module");

// Example usage
const result = await module.doSomething();
```

## API Reference

### Functions

#### `functionName(parameter)`

Description of the function.

**Parameters:**
- `parameter` (string): Description of parameter

**Returns:**
- (Promise<Object>): Description of return value

**Throws:**
- `Error`: Description of when error is thrown

## Examples

### Basic Usage

```javascript
// Example code
```

### Advanced Usage

```javascript
// Example code
```
```

## Testing Standards

### Test Structure
```javascript
// ✅ Use descriptive test names
describe("UserService", () => {
  describe("createUser", () => {
    test("should create user with valid data", async () => {
      // Test implementation
    });

    test("should throw ValidationError for invalid email", async () => {
      // Test implementation
    });

    test("should throw ConflictError for duplicate email", async () => {
      // Test implementation
    });
  });
});
```

### Test Data
```javascript
// ✅ Use realistic test data
const validUserData = {
  email: "test@example.com",
  password: "SecurePassword123!",
  profile: {
    firstName: "Test",
    lastName: "User",
    dateOfBirth: "01/01/1990"
  }
};

// ✅ Use descriptive test data names
const invalidEmailData = {
  email: "invalid-email",
  password: "SecurePassword123!"
};

const duplicateEmailData = {
  email: "existing@example.com",
  password: "SecurePassword123!"
};
```

### Test Coverage
```javascript
// ✅ Test happy path
test("should return user data for valid request", async () => {
  const result = await userService.findById("valid-id");
  expect(result).toBeDefined();
  expect(result.id).toBe("valid-id");
});

// ✅ Test error cases
test("should throw error for invalid user ID", async () => {
  await expect(userService.findById("invalid-id")).rejects.toThrow("User not found");
});

// ✅ Test edge cases
test("should handle empty user ID", async () => {
  await expect(userService.findById("")).rejects.toThrow("User ID is required");
});
```

## Security Standards

### Input Validation
```javascript
// ✅ Validate all inputs
function validateUserInput(input) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Input must be an object");
  }
  
  if (!input.email || typeof input.email !== "string") {
    throw new ValidationError("Email is required");
  }
  
  if (!validateEmail(input.email)) {
    throw new ValidationError("Invalid email format");
  }
  
  return sanitizeInput(input);
}

// ❌ Avoid trusting user input
function processUserInput(input) {
  return input; // Dangerous!
}
```

### Password Security
```javascript
// ✅ Use secure password hashing
const bcrypt = require("bcryptjs");

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// ❌ Avoid weak password hashing
function hashPassword(password) {
  return password + "salt"; // Very insecure!
}
```

### API Key Security
```javascript
// ✅ Use cryptographically secure random generation
const crypto = require("crypto");

function generateApiKey() {
  const prefix = "sk_live_";
  const randomBytes = crypto.randomBytes(32);
  return prefix + randomBytes.toString("hex");
}

// ❌ Avoid predictable API keys
function generateApiKey() {
  return "sk_live_" + Math.random().toString(36); // Predictable!
}
```

## Performance Standards

### Memory Management
```javascript
// ✅ Clean up resources
async function generatePDF(html) {
  let browser;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    const pdf = await page.pdf({ html });
    return pdf;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// ❌ Avoid resource leaks
async function generatePDF(html) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const pdf = await page.pdf({ html });
  // Browser not closed - memory leak!
  return pdf;
}
```

### Efficient Data Processing
```javascript
// ✅ Use efficient algorithms
function findUserByEmail(users, email) {
  return users.find(user => user.email === email);
}

// ✅ Use appropriate data structures
const userMap = new Map();
users.forEach(user => userMap.set(user.id, user));

// ❌ Avoid inefficient operations
function findUserByEmail(users, email) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].email === email) {
      return users[i];
    }
  }
  return null;
}
```

## Code Review Standards

### Review Checklist

#### Functionality
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Performance is acceptable

#### Code Quality
- [ ] Code is readable and maintainable
- [ ] Naming conventions are followed
- [ ] Functions are appropriately sized
- [ ] Comments are helpful and accurate

#### Security
- [ ] Input validation is implemented
- [ ] Sensitive data is protected
- [ ] Authentication/authorization is correct
- [ ] No security vulnerabilities

#### Testing
- [ ] Tests cover happy path
- [ ] Tests cover error cases
- [ ] Tests cover edge cases
- [ ] Test coverage is adequate

### Review Process

1. **Self Review**: Author reviews their own code first
2. **Peer Review**: Another developer reviews the code
3. **Security Review**: Security-focused review for sensitive changes
4. **Final Approval**: Senior developer approves the changes

## Tools and Configuration

### ESLint Configuration
```json
{
  "extends": ["eslint:recommended"],
  "env": {
    "node": true,
    "es2021": true
  },
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
    "no-unused-vars": "error",
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Git Hooks
```bash
#!/bin/sh
# Pre-commit hook

# Run ESLint
npm run lint

# Run tests
npm test

# Check for security vulnerabilities
npm audit
```

## Common Anti-Patterns

### Avoid These Patterns

```javascript
// ❌ Callback hell
function processData(data, callback) {
  step1(data, (err, result1) => {
    if (err) return callback(err);
    step2(result1, (err, result2) => {
      if (err) return callback(err);
      step3(result2, (err, result3) => {
        if (err) return callback(err);
        callback(null, result3);
      });
    });
  });
}

// ❌ Global variables
let globalUser = null;

// ❌ Mutating function parameters
function updateUser(user) {
  user.lastLogin = new Date(); // Mutates original object
  return user;
}

// ❌ Silent failures
function processFile(filename) {
  try {
    return fs.readFileSync(filename);
  } catch (error) {
    // Silent failure - bad!
  }
}

// ❌ Deep nesting
function complexFunction(data) {
  if (data) {
    if (data.user) {
      if (data.user.profile) {
        if (data.user.profile.email) {
          // Too deeply nested
        }
      }
    }
  }
}
```

### Preferred Patterns

```javascript
// ✅ Use async/await
async function processData(data) {
  try {
    const result1 = await step1(data);
    const result2 = await step2(result1);
    const result3 = await step3(result2);
    return result3;
  } catch (error) {
    throw error;
  }
}

// ✅ Use dependency injection
function createUserService(userRepository, emailService) {
  return {
    async create(userData) {
      const user = await userRepository.save(userData);
      await emailService.sendWelcomeEmail(user.email);
      return user;
    }
  };
}

// ✅ Use immutable updates
function updateUser(user, updates) {
  return { ...user, ...updates };
}

// ✅ Use early returns
function processUser(user) {
  if (!user) {
    throw new Error("User is required");
  }
  
  if (!user.email) {
    throw new Error("User email is required");
  }
  
  // Main logic here
  return processValidUser(user);
}
```

## Conclusion

These code standards ensure consistency, maintainability, and quality across the PDF Service project. Regular review and updates of these standards help maintain high code quality and team productivity.

### Key Takeaways

1. **Consistency**: Follow established patterns and conventions
2. **Readability**: Write code that is easy to understand
3. **Security**: Implement security best practices
4. **Testing**: Write comprehensive tests
5. **Documentation**: Document complex logic and APIs
6. **Performance**: Optimize for performance without sacrificing readability
7. **Maintainability**: Write code that is easy to modify and extend

Remember: Code is written once but read many times. Invest in writing clear, maintainable code that your future self (and teammates) will thank you for.
