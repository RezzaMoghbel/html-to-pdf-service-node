# PDF Service Architecture Documentation

## Overview

The PDF Service is a comprehensive web application that provides HTML-to-PDF conversion capabilities with a complete authentication and user management system. The architecture follows modern web development practices with a clear separation of concerns, robust security measures, and scalable design patterns.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PDF Service Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Layer (Client-Side)                                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │   Landing Page  │ │   Auth Pages    │ │   Dashboard     │  │
│  │                 │ │  (Login/Reg)    │ │                 │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │   PDF Generator │ │   Profile Page  │ │   Password      │  │
│  │   Test UI       │ │                 │ │   Reset Page    │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  JavaScript Modules (Client-Side)                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │   Validation    │ │   Auth Module   │ │   Dashboard     │  │
│  │   Module        │ │                 │ │   Module        │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│  ┌─────────────────┐                                           │
│  │   API Client    │                                           │
│  │   Module        │                                           │
│  └─────────────────┘                                           │
├─────────────────────────────────────────────────────────────────┤
│  API Gateway / Express.js Server                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │   Middleware    │ │   Route         │ │   Error         │  │
│  │   Layer         │ │   Handlers      │ │   Handling      │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Business Logic Layer (Services)                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │   Auth Service  │ │   User Service  │ │   API Key       │  │
│  │                 │ │                 │ │   Service       │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│  ┌─────────────────┐                                           │
│  │   Config        │                                           │
│  │   Service       │                                           │
│  └─────────────────┘                                           │
├─────────────────────────────────────────────────────────────────┤
│  Data Access Layer (Utilities)                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │   File System   │ │   Validation    │ │   Encryption    │  │
│  │   Utilities     │ │   Utilities     │ │   Utilities     │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Data Storage Layer                                            │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │   User Data     │ │   System        │ │   Session       │  │
│  │   (JSON Files)  │ │   Config        │ │   Storage       │  │
│  │                 │ │   (JSON Files)  │ │   (File Store)  │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Component Relationships                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend Pages ──────────────┐                                │
│  │                            │                                │
│  ├─ Landing Page              │                                │
│  ├─ Auth Pages (Login/Reg)   │                                │
│  ├─ Dashboard                 │                                │
│  ├─ Profile Page              │                                │
│  ├─ Password Reset            │                                │
│  └─ PDF Generator Test UI     │                                │
│                                │                                │
│  JavaScript Modules ──────────┼─────────────────────────────────┤
│  │                            │                                │
│  ├─ validation.js             │                                │
│  ├─ auth.js                   │                                │
│  ├─ dashboard.js              │                                │
│  └─ api-client.js             │                                │
│                                │                                │
│  Express.js Server ───────────┼─────────────────────────────────┤
│  │                            │                                │
│  ├─ Middleware Layer          │                                │
│  │  ├─ apiKeyAuth.js          │                                │
│  │  ├─ sessionAuth.js         │                                │
│  │  ├─ rateLimitAuth.js       │                                │
│  │  └─ validation.js          │                                │
│  │                            │                                │
│  ├─ Route Handlers            │                                │
│  │  ├─ auth.js                │                                │
│  │  ├─ dashboard.js           │                                │
│  │  └─ html2pdf.js            │                                │
│  │                            │                                │
│  └─ Services Layer            │                                │
│     ├─ authService.js         │                                │
│     ├─ userService.js        │                                │
│     ├─ apiKeyService.js       │                                │
│     └─ configService.js      │                                │
│                                │                                │
│  Utilities Layer ──────────────┼─────────────────────────────────┤
│  │                            │                                │
│  ├─ fileSystem.js             │                                │
│  ├─ validation.js              │                                │
│  └─ encryption.js             │                                │
│                                │                                │
│  Data Storage ─────────────────┼─────────────────────────────────┤
│  │                            │                                │
│  ├─ database/users/            │                                │
│  ├─ database/config/          │                                │
│  └─ database/sessions/         │                                │
│                                │                                │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend Technologies

- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **Puppeteer** - PDF generation engine
- **pdf-lib** - PDF manipulation and compression
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **session-file-store** - File-based session storage
- **uuid** - Unique identifier generation

### Frontend Technologies

- **HTML5** - Markup language
- **CSS3** - Styling with modern features
- **JavaScript (ES6+)** - Client-side programming
- **Fetch API** - HTTP client
- **Local Storage** - Client-side data persistence

### Development Tools

- **Morgan** - HTTP request logger
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Compression** - Response compression
- **Rate Limiting** - Request throttling

## Data Flow Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Authentication Flow                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User Registration/Login                                     │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │   Frontend  │───▶│   Auth API  │───▶│   Auth      │      │
│     │   Form      │    │   Endpoint  │    │   Service   │      │
│     └─────────────┘    └─────────────┘    └─────────────┘      │
│                                │                                │
│  2. Session Creation           │                                │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │   Session   │◀───│   Session   │◀───│   User      │      │
│     │   Storage   │    │   Middleware│    │   Service   │      │
│     └─────────────┘    └─────────────┘    └─────────────┘      │
│                                │                                │
│  3. API Key Generation         │                                │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │   API Key   │◀───│   API Key   │◀───│   User      │      │
│     │   Service   │    │   Service   │    │   Service   │      │
│     └─────────────┘    └─────────────┘    └─────────────┘      │
│                                │                                │
│  4. Protected API Access       │                                │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │   PDF       │───▶│   API Key   │───▶│   User      │      │
│     │   Generator │    │   Auth      │    │   Service   │      │
│     └─────────────┘    └─────────────┘    └─────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### PDF Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        PDF Generation Flow                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Request Initiation                                          │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │   Frontend  │───▶│   API Key   │───▶│   Rate      │      │
│     │   PDF UI    │    │   Auth      │    │   Limiting  │      │
│     └─────────────┘    └─────────────┘    └─────────────┘      │
│                                │                                │
│  2. HTML Processing             │                                │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │   HTML      │───▶│   Bundle    │───▶│   Puppeteer │      │
│     │   Content   │    │   Builder   │    │   Browser   │      │
│     └─────────────┘    └─────────────┘    └─────────────┘      │
│                                │                                │
│  3. PDF Generation              │                                │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │   PDF       │◀───│   PDF       │◀───│   Puppeteer │      │
│     │   Buffer    │    │   Options   │    │   Page      │      │
│     └─────────────┘    └─────────────┘    └─────────────┘      │
│                                │                                │
│  4. Compression & Response     │                                │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │   Compressed│◀───│   pdf-lib   │◀───│   PDF      │      │
│     │   PDF       │    │   Compression│   │   Buffer   │      │
│     └─────────────┘    └─────────────┘    └─────────────┘      │
│                                │                                │
│  5. Usage Tracking              │                                │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │   Usage     │◀───│   API Key   │◀───│   User      │      │
│     │   Stats     │    │   Service   │    │   Service   │      │
│     └─────────────┘    └─────────────┘    └─────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Multi-Layer Security Model                                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Layer 1: Network Security                                 │ │
│  │  ├─ HTTPS/TLS Encryption                                  │ │
│  │  ├─ CORS Configuration                                    │ │
│  │  ├─ Rate Limiting                                          │ │
│  │  └─ Request Size Limiting                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Layer 2: Application Security                             │ │
│  │  ├─ Helmet Security Headers                                │ │
│  │  ├─ Input Validation & Sanitization                       │ │
│  │  ├─ CSRF Protection                                        │ │
│  │  └─ XSS Prevention                                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Layer 3: Authentication Security                         │ │
│  │  ├─ Session Management                                     │ │
│  │  ├─ Password Hashing (bcrypt)                              │ │
│  │  ├─ API Key Authentication                                 │ │
│  │  └─ Account Lockout Protection                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Layer 4: Data Security                                    │ │
│  │  ├─ Atomic File Operations                                 │ │
│  │  ├─ Data Encryption                                        │ │
│  │  ├─ Secure Token Generation                                │ │
│  │  └─ Access Control Lists                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### API Key Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Key Security Model                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  API Key Lifecycle                                             │
│                                                                 │
│  1. Generation                                                 │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │   User      │───▶│   API Key   │───▶│   Secure    │      │
│     │   Request   │    │   Service   │    │   Storage   │      │
│     └─────────────┘    └─────────────┘    └─────────────┘      │
│                                │                                │
│  2. Validation                 │                                │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │   Request   │───▶│   Format    │───▶│   User      │      │
│     │   Header    │    │   Check     │    │   Lookup    │      │
│     └─────────────┘    └─────────────┘    └─────────────┘      │
│                                │                                │
│  3. Usage Tracking             │                                │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │   API       │───▶│   Rate      │───▶│   Usage     │      │
│     │   Request   │    │   Limiting  │    │   Logging   │      │
│     └─────────────┘    └─────────────┘    └─────────────┘      │
│                                │                                │
│  4. Regeneration               │                                │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│     │   User      │───▶│   Old Key   │───▶│   New Key   │      │
│     │   Request   │    │   Invalidate│    │   Generated │      │
│     └─────────────┘    └─────────────┘    └─────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Architecture

### Data Storage Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    Data Storage Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  File-Based JSON Database                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  database/                                                  │ │
│  │  ├─ users/                                                  │ │
│  │  │  ├─ user-{emailHash}.json                               │ │
│  │  │  └─ ...                                                  │ │
│  │  ├─ config/                                                 │ │
│  │  │  └─ system.json                                          │ │
│  │  └─ sessions/                                               │ │
│  │     ├─ session-{sessionId}.json                            │ │
│  │     └─ ...                                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  User Data Schema                                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  {                                                         │ │
│  │    "_id": "uuid",                                          │ │
│  │    "email": "user@example.com",                            │ │
│  │    "passwordHash": "bcrypt_hash",                          │ │
│  │    "profile": { ... },                                     │ │
│  │    "apiKey": { ... },                                      │ │
│  │    "security": { ... },                                    │ │
│  │    "usage": { ... },                                       │ │
│  │    "timestamps": { ... },                                  │ │
│  │    "emailVerification": { ... }                           │ │
│  │  }                                                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  System Configuration Schema                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  {                                                         │ │
│  │    "emailVerificationEnabled": false,                     │ │
│  │    "defaultRateLimit": 1000,                              │ │
│  │    "maxFailedLogins": 30,                                 │ │
│  │    "passwordResetTokenExpiry": 3600000,                   │ │
│  │    "sessionMaxAge": 86400000,                             │ │
│  │    "apiKeyPrefix": "sk_live_",                            │ │
│  │    "apiKeyLength": 32,                                    │ │
│  │    "passwordRequirements": { ... },                       │ │
│  │    "supportedCountries": [ ... ],                         │ │
│  │    "rateLimitPeriods": { ... },                           │ │
│  │    "security": { ... },                                  │ │
│  │    "features": { ... },                                   │ │
│  │    "logging": { ... }                                     │ │
│  │  }                                                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│                    Data Flow Patterns                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Atomic Operations                                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  1. Create temporary file                                   │ │
│  │  2. Write data to temp file                                 │ │
│  │  3. Atomic rename (temp → final)                           │ │
│  │  4. Cleanup on failure                                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Data Validation Pipeline                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  1. Input Sanitization                                     │ │
│  │  2. Format Validation                                       │ │
│  │  3. Business Rule Validation                                │ │
│  │  4. Security Checks                                         │ │
│  │  5. Data Persistence                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Error Handling Strategy                                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  1. Try Operation                                           │ │
│  │  2. Catch Specific Errors                                   │ │
│  │  3. Log Error Details                                       │ │
│  │  4. Return User-Friendly Message                            │ │
│  │  5. Rollback if Necessary                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────────┐
│                    Scalability Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Current Architecture (Single Instance)                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │ │
│  │  │   Load      │    │   Express   │    │   File      │      │ │
│  │  │   Balancer  │    │   Server    │    │   Storage   │      │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Future Architecture (Multi-Instance)                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │ │
│  │  │   Load      │    │   Express   │    │   Redis     │      │ │
│  │  │   Balancer  │    │   Server 1  │    │   Session   │      │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘      │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │ │
│  │  │   CDN       │    │   Express   │    │   MongoDB   │      │ │
│  │  │   (Static)  │    │   Server 2  │    │   Database  │      │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Migration Path                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  1. Implement Redis for session storage                     │ │
│  │  2. Migrate to MongoDB for user data                        │ │
│  │  3. Add horizontal scaling with load balancer              │ │
│  │  4. Implement CDN for static assets                        │ │
│  │  5. Add monitoring and logging infrastructure              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    Performance Optimization                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Caching Strategy                                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │ │
│  │  │   Browser   │    │   Server   │    │   Database  │      │ │
│  │  │   Cache     │    │   Cache    │    │   Cache     │      │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Request Optimization                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ├─ Response Compression (gzip)                              │ │
│  │  ├─ Static Asset Minification                               │ │
│  │  ├─ Image Optimization                                      │ │
│  │  ├─ Lazy Loading                                            │ │
│  │  └─ CDN Integration                                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Database Optimization                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ├─ Connection Pooling                                      │ │
│  │  ├─ Query Optimization                                      │ │
│  │  ├─ Indexing Strategy                                       │ │
│  │  ├─ Data Partitioning                                       │ │
│  │  └─ Read Replicas                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Monitoring & Observability

### Logging Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Logging Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Log Levels & Categories                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │ │
│  │  │   ERROR     │    │   WARN      │    │   INFO      │      │ │
│  │  │   - System  │    │   - Rate    │    │   - Request │      │ │
│  │  │   - Auth    │    │   - Usage   │    │   - Response│      │ │
│  │  │   - PDF     │    │   - Config  │    │   - Session │      │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Log Storage & Rotation                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ├─ File-based logging with rotation                        │ │
│  │  ├─ Structured JSON format                                  │ │
│  │  ├─ Request ID correlation                                  │ │
│  │  ├─ Error stack traces                                      │ │
│  │  └─ Performance metrics                                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Monitoring Metrics                                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ├─ Request/Response times                                  │ │
│  │  ├─ Error rates by endpoint                                 │ │
│  │  ├─ User authentication metrics                             │ │
│  │  ├─ PDF generation statistics                               │ │
│  │  ├─ API key usage patterns                                  │ │
│  │  └─ System resource utilization                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

### Environment Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    Deployment Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Environment Layers                                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │ │
│  │  │   Development│    │   Staging  │    │   Production│      │ │
│  │  │   - Local    │    │   - Testing│    │   - Live    │      │ │
│  │  │   - Debug    │    │   - QA      │    │   - Secure  │      │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Configuration Management                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ├─ Environment variables                                   │ │
│  │  ├─ Configuration files                                     │ │
│  │  ├─ Secrets management                                       │ │
│  │  ├─ Feature flags                                           │ │
│  │  └─ Runtime configuration                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Infrastructure Components                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ├─ Web Server (Express.js)                                │ │
│  │  ├─ Process Manager (PM2)                                  │ │
│  │  ├─ Reverse Proxy (Nginx)                                   │ │
│  │  ├─ SSL/TLS Termination                                     │ │
│  │  ├─ Static File Serving                                     │ │
│  │  └─ Health Check Endpoints                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Future Enhancements

### Planned Architecture Improvements

1. **Microservices Architecture**
   - Split PDF generation into separate service
   - Implement service mesh with Istio
   - Add API gateway for service discovery

2. **Database Migration**
   - Migrate from file-based to MongoDB
   - Implement database sharding
   - Add read replicas for performance

3. **Caching Layer**
   - Implement Redis for session storage
   - Add CDN for static assets
   - Implement application-level caching

4. **Monitoring & Observability**
   - Add Prometheus metrics collection
   - Implement Grafana dashboards
   - Add distributed tracing with Jaeger

5. **Security Enhancements**
   - Implement OAuth 2.0 / OpenID Connect
   - Add multi-factor authentication
   - Implement API versioning strategy

6. **Performance Optimization**
   - Implement horizontal pod autoscaling
   - Add database connection pooling
   - Optimize PDF generation with worker threads

This architecture documentation provides a comprehensive overview of the PDF Service system, its components, data flows, and future scalability considerations. The modular design allows for easy maintenance, testing, and future enhancements while maintaining security and performance standards.
