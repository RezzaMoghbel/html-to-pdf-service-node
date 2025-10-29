# PDF Service Security Documentation

## Overview

This document outlines the comprehensive security measures implemented in the PDF Service to protect user data, prevent unauthorized access, and ensure system integrity. It covers authentication, authorization, data protection, input validation, and security best practices.

## Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: Network Security                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ├─ HTTPS/TLS Encryption                                  │ │
│  │  ├─ CORS Configuration                                    │ │
│  │  ├─ Rate Limiting                                          │ │
│  │  ├─ Request Size Limiting                                 │ │
│  │  └─ IP Whitelisting/Blacklisting                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Layer 2: Application Security                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ├─ Helmet Security Headers                                │ │
│  │  ├─ Input Validation & Sanitization                       │ │
│  │  ├─ CSRF Protection                                        │ │
│  │  ├─ XSS Prevention                                         │ │
│  │  └─ SQL Injection Prevention                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Layer 3: Authentication Security                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ├─ Session Management                                     │ │
│  │  ├─ Password Hashing (bcrypt)                              │ │
│  │  ├─ API Key Authentication                                 │ │
│  │  ├─ Account Lockout Protection                             │ │
│  │  └─ Multi-Factor Authentication (Future)                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Layer 4: Data Security                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ├─ Atomic File Operations                                 │ │
│  │  ├─ Data Encryption                                        │ │
│  │  ├─ Secure Token Generation                                │ │
│  │  ├─ Access Control Lists                                   │ │
│  │  └─ Data Anonymization                                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Security

### Password Security

**Password Hashing:**
```javascript
const bcrypt = require('bcryptjs');

// Hash password with salt rounds
const passwordHash = await bcrypt.hash(password, 12);

// Verify password
const isValid = await bcrypt.compare(password, passwordHash);
```

**Password Requirements:**
- Minimum 8 characters, maximum 128 characters
- Must contain uppercase and lowercase letters
- Must contain at least one number
- Must contain at least one special character
- Cannot be common passwords (dictionary check)
- Cannot contain user's email or name

**Password Validation:**
```javascript
function validatePassword(password) {
  const minLength = 8;
  const maxLength = 128;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength || password.length > maxLength) {
    throw new ValidationError('Password must be 8-128 characters long');
  }
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    throw new ValidationError('Password must contain uppercase, lowercase, numbers, and special characters');
  }
  
  return true;
}
```

### Session Security

**Session Configuration:**
```javascript
const session = require('express-session');
const FileStore = require('session-file-store')(session);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new FileStore({
    path: './database/sessions',
    ttl: 86400, // 24 hours
    retries: 5
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 86400000, // 24 hours
    sameSite: 'strict'
  },
  name: 'pdf-service-session'
}));
```

**Session Security Features:**
- Secure session cookies (HTTPS only in production)
- HttpOnly cookies (prevents XSS)
- SameSite protection (prevents CSRF)
- Session timeout (24 hours)
- Secure session storage
- Session regeneration on login

### API Key Security

**API Key Generation:**
```javascript
const crypto = require('crypto');

function generateApiKey() {
  const prefix = 'sk_live_';
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString('hex');
  return prefix + key;
}
```

**API Key Validation:**
```javascript
function validateApiKeyFormat(apiKey) {
  const pattern = /^sk_live_[a-f0-9]{64}$/;
  return pattern.test(apiKey);
}
```

**API Key Security Features:**
- Cryptographically secure random generation
- Prefixed format for identification
- 64-character random component
- Secure storage with hashing
- Usage tracking and rate limiting
- Automatic regeneration capability

## Authorization Security

### Access Control

**Role-Based Access Control (Future):**
```javascript
const roles = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

const permissions = {
  [roles.USER]: ['pdf.generate', 'profile.view', 'profile.update'],
  [roles.ADMIN]: ['pdf.generate', 'profile.view', 'profile.update', 'users.view'],
  [roles.SUPER_ADMIN]: ['*'] // All permissions
};
```

**API Endpoint Protection:**
```javascript
// API key authentication middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: { code: 'MISSING_API_KEY', message: 'API key required' }
    });
  }
  
  if (!validateApiKeyFormat(apiKey)) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_API_KEY', message: 'Invalid API key format' }
    });
  }
  
  // Validate API key and get user
  const user = await userService.findByApiKey(apiKey);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_API_KEY', message: 'Invalid API key' }
    });
  }
  
  req.user = user;
  next();
};
```

### Account Security

**Account Lockout Protection:**
```javascript
const MAX_FAILED_ATTEMPTS = 30;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

async function handleFailedLogin(email, ip) {
  const user = await userService.findByEmail(email);
  
  if (user) {
    user.security.failedLoginAttempts += 1;
    user.security.lastFailedLogin = new Date();
    user.security.failedLoginIPs.push(ip);
    
    if (user.security.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.security.accountLocked = true;
      user.security.lockoutExpires = new Date(Date.now() + LOCKOUT_DURATION);
    }
    
    await userService.updateUser(user);
  }
}
```

**IP Address Tracking:**
```javascript
function trackIPAddress(user, ip) {
  if (!user.security.knownIPs.includes(ip)) {
    user.security.knownIPs.push(ip);
    user.security.ipHistory.push({
      ip: ip,
      firstSeen: new Date(),
      lastSeen: new Date()
    });
  } else {
    const ipRecord = user.security.ipHistory.find(record => record.ip === ip);
    if (ipRecord) {
      ipRecord.lastSeen = new Date();
    }
  }
}
```

## Input Validation and Sanitization

### Input Validation

**Email Validation:**
```javascript
function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  if (email.length > 254) {
    return false;
  }
  
  return emailRegex.test(email);
}
```

**HTML Content Validation:**
```javascript
function validateHTMLContent(html) {
  if (!html || typeof html !== 'string') {
    throw new ValidationError('HTML content is required');
  }
  
  if (html.length > 10 * 1024 * 1024) { // 10MB limit
    throw new ValidationError('HTML content too large');
  }
  
  // Check for potentially malicious content
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(html)) {
      throw new ValidationError('HTML content contains potentially dangerous elements');
    }
  }
  
  return true;
}
```

### Data Sanitization

**Input Sanitization:**
```javascript
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}
```

**SQL Injection Prevention:**
```javascript
// Since we use file-based storage, SQL injection is not applicable
// But we still sanitize file paths to prevent directory traversal
function sanitizeFilePath(filePath) {
  return filePath
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[^a-zA-Z0-9._-]/g, '') // Remove special characters
    .substring(0, 255); // Limit length
}
```

## Data Protection

### Encryption

**Data Encryption at Rest:**
```javascript
const crypto = require('crypto');

function encrypt(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', key);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedData, key) {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}
```

**Sensitive Data Hashing:**
```javascript
function hashSensitiveData(data) {
  const hash = crypto.createHash('sha256');
  hash.update(data + process.env.HASH_SALT);
  return hash.digest('hex');
}
```

### File System Security

**Atomic File Operations:**
```javascript
const fs = require('fs').promises;
const path = require('path');

async function writeJSONFile(filePath, data) {
  const tempPath = filePath + '.tmp';
  
  try {
    // Write to temporary file first
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
    
    // Atomic rename
    await fs.rename(tempPath, filePath);
  } catch (error) {
    // Clean up temporary file on error
    try {
      await fs.unlink(tempPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error;
  }
}
```

**File Permission Management:**
```javascript
function setSecureFilePermissions(filePath) {
  // Set restrictive permissions
  fs.chmodSync(filePath, 0o600); // Owner read/write only
}

function setSecureDirectoryPermissions(dirPath) {
  // Set directory permissions
  fs.chmodSync(dirPath, 0o700); // Owner read/write/execute only
}
```

## Rate Limiting and DDoS Protection

### Rate Limiting Implementation

**IP-Based Rate Limiting:**
```javascript
const rateLimitStore = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const rateLimitData = rateLimitStore.get(ip);
  
  if (now > rateLimitData.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  if (rateLimitData.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
    });
  }
  
  rateLimitData.count++;
  next();
}
```

**API Key Rate Limiting:**
```javascript
async function apiKeyRateLimit(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const user = await userService.findByApiKey(apiKey);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_API_KEY', message: 'Invalid API key' }
    });
  }
  
  const rateLimit = user.rateLimit || config.defaultRateLimit;
  const usage = user.usage || { requests: 0, resetTime: Date.now() + 3600000 };
  
  if (Date.now() > usage.resetTime) {
    usage.requests = 0;
    usage.resetTime = Date.now() + 3600000;
  }
  
  if (usage.requests >= rateLimit) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'API rate limit exceeded' }
    });
  }
  
  usage.requests++;
  await userService.updateUser(user);
  next();
}
```

### DDoS Protection

**Request Size Limiting:**
```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

**Connection Limiting:**
```javascript
const connectionLimit = 100;
const activeConnections = new Set();

app.use((req, res, next) => {
  if (activeConnections.size >= connectionLimit) {
    return res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Server overloaded' }
    });
  }
  
  activeConnections.add(req.connection);
  
  res.on('finish', () => {
    activeConnections.delete(req.connection);
  });
  
  next();
});
```

## Security Headers

### Helmet Configuration

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' }
}));
```

### Custom Security Headers

```javascript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
});
```

## CSRF Protection

### CSRF Token Implementation

```javascript
const csrf = require('csurf');

// Generate CSRF token
app.use(csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));

// CSRF protection middleware
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
```

### CSRF Validation

```javascript
function validateCSRFToken(req, res, next) {
  const token = req.headers['x-csrf-token'];
  const sessionToken = req.session.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: { code: 'INVALID_CSRF_TOKEN', message: 'Invalid CSRF token' }
    });
  }
  
  next();
}
```

## Logging and Monitoring

### Security Event Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
    new winston.transports.Console()
  ]
});

function logSecurityEvent(event, details) {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent
  });
}
```

### Security Monitoring

```javascript
function monitorSecurityEvents() {
  // Monitor failed login attempts
  app.use('/auth/login', (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode === 401) {
        logSecurityEvent('FAILED_LOGIN', {
          ip: req.ip,
          email: req.body.email,
          userAgent: req.get('User-Agent')
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  });
  
  // Monitor API key usage
  app.use('/api/', (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (apiKey) {
      logSecurityEvent('API_KEY_USAGE', {
        ip: req.ip,
        apiKey: apiKey.substring(0, 10) + '...',
        endpoint: req.path,
        userAgent: req.get('User-Agent')
      });
    }
    
    next();
  });
}
```

## Vulnerability Management

### Common Vulnerabilities

**OWASP Top 10 Protection:**

1. **Injection Attacks**
   - Input validation and sanitization
   - Parameterized queries (when applicable)
   - File path sanitization

2. **Broken Authentication**
   - Strong password requirements
   - Secure session management
   - Account lockout protection

3. **Sensitive Data Exposure**
   - Data encryption at rest
   - Secure transmission (HTTPS)
   - Sensitive data hashing

4. **XML External Entities (XXE)**
   - Not applicable (no XML processing)

5. **Broken Access Control**
   - API key authentication
   - Session validation
   - Role-based access control

6. **Security Misconfiguration**
   - Security headers
   - Secure defaults
   - Regular security updates

7. **Cross-Site Scripting (XSS)**
   - Input sanitization
   - Content Security Policy
   - XSS protection headers

8. **Insecure Deserialization**
   - Not applicable (no deserialization)

9. **Using Components with Known Vulnerabilities**
   - Regular dependency updates
   - Security scanning
   - Vulnerability monitoring

10. **Insufficient Logging & Monitoring**
    - Comprehensive logging
    - Security event monitoring
    - Audit trails

### Security Testing

**Automated Security Testing:**
```bash
# Install security testing tools
npm install --save-dev eslint-plugin-security
npm install --save-dev audit-ci

# Run security audit
npm audit

# Run security linting
npm run lint:security
```

**Manual Security Testing:**
```bash
# Test for common vulnerabilities
npm run test:security

# Penetration testing checklist
npm run test:penetration
```

## Incident Response

### Security Incident Procedures

1. **Detection**
   - Monitor security logs
   - Automated alerts
   - User reports

2. **Assessment**
   - Determine severity
   - Identify affected systems
   - Document incident details

3. **Containment**
   - Isolate affected systems
   - Block malicious IPs
   - Disable compromised accounts

4. **Eradication**
   - Remove malware
   - Patch vulnerabilities
   - Update security measures

5. **Recovery**
   - Restore services
   - Monitor for recurrence
   - Update security policies

6. **Lessons Learned**
   - Document incident
   - Update procedures
   - Train staff

### Emergency Response

```javascript
// Emergency lockdown function
async function emergencyLockdown() {
  // Disable all API keys
  await userService.disableAllApiKeys();
  
  // Block all IPs except whitelist
  await rateLimitService.blockAllIPs();
  
  // Send alert to administrators
  await notificationService.sendEmergencyAlert();
  
  // Log emergency event
  logger.error('EMERGENCY_LOCKDOWN_ACTIVATED', {
    timestamp: new Date().toISOString(),
    reason: 'Security incident detected'
  });
}
```

## Compliance and Standards

### Data Protection Compliance

**GDPR Compliance:**
- User consent management
- Data portability
- Right to be forgotten
- Data minimization
- Privacy by design

**Data Retention:**
```javascript
function implementDataRetention() {
  // Delete old session files
  const sessionFiles = fs.readdirSync('./database/sessions');
  const cutoffDate = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
  
  sessionFiles.forEach(file => {
    const filePath = path.join('./database/sessions', file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtime.getTime() < cutoffDate) {
      fs.unlinkSync(filePath);
    }
  });
}
```

### Security Standards

**ISO 27001 Compliance:**
- Information security management
- Risk assessment
- Security controls
- Continuous improvement

**SOC 2 Compliance:**
- Security controls
- Availability controls
- Processing integrity
- Confidentiality controls
- Privacy controls

## Security Best Practices

### Development Security

1. **Secure Coding Practices**
   - Input validation
   - Output encoding
   - Error handling
   - Secure defaults

2. **Dependency Management**
   - Regular updates
   - Vulnerability scanning
   - Minimal dependencies

3. **Code Review**
   - Security-focused reviews
   - Automated scanning
   - Peer review

### Operational Security

1. **Access Control**
   - Principle of least privilege
   - Regular access reviews
   - Strong authentication

2. **Monitoring**
   - Real-time monitoring
   - Log analysis
   - Incident response

3. **Backup and Recovery**
   - Regular backups
   - Secure storage
   - Recovery testing

This security documentation provides comprehensive coverage of all security measures implemented in the PDF Service. Regular review and updates of these security measures are essential to maintain a secure system.
