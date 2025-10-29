# PDF Service API Documentation

## Overview

The PDF Service provides a comprehensive REST API for HTML-to-PDF conversion with user authentication, API key management, and usage tracking. This document describes all available endpoints, request/response formats, authentication methods, and error handling.

## Base URL

```
Production: https://your-domain.com
Development: http://localhost:9005
```

## API Versioning

The API uses URL-based versioning:
- Current version: `v1`
- API prefix: `/api/v1`

## Authentication

### API Key Authentication

All PDF generation endpoints require API key authentication. API keys are prefixed with `sk_live_` and are 40 characters long.

**Header Format:**
```
X-API-Key: sk_live_example_key_replace_with_real
```

**Rate Limiting:**
- Default: 1000 requests per hour per API key
- Configurable per user
- IP-based additional limiting

### Session Authentication

User management endpoints use session-based authentication with CSRF protection.

**Session Requirements:**
- Valid session cookie
- CSRF token in request headers
- User must be authenticated

## Error Handling

### Error Response Format

All errors follow a consistent JSON format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (optional)",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_API_KEY` | API key is invalid or expired |
| `RATE_LIMIT_EXCEEDED` | Request rate limit exceeded |
| `VALIDATION_ERROR` | Request validation failed |
| `USER_NOT_FOUND` | User does not exist |
| `ACCOUNT_BLOCKED` | User account is blocked |
| `INVALID_CREDENTIALS` | Login credentials are invalid |
| `EMAIL_ALREADY_EXISTS` | Email address already registered |
| `INVALID_TOKEN` | Password reset or verification token is invalid |
| `PDF_GENERATION_FAILED` | PDF generation process failed |

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "01/01/1990",
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "New York",
    "postcode": "10001",
    "country": "US"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "profile": { ... },
      "emailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "message": "Registration successful. Please check your email for verification."
  }
}
```

**Validation Rules:**
- Email: Valid email format, unique
- Password: 8-128 characters, mixed case, numbers, special characters
- Confirm Password: Must match password
- First Name: 1-50 characters, letters only
- Last Name: 1-50 characters, letters only
- Date of Birth: DD/MM/YYYY format, 13+ years old
- Address1: 1-100 characters, required
- Address2: 0-100 characters, optional
- City: 1-50 characters, required
- Postcode: Valid format for country
- Country: Must be in supported countries list

### POST /auth/login

Authenticate user and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "profile": { ... },
      "emailVerified": true,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "session": {
      "id": "session_id",
      "expiresAt": "2024-01-02T00:00:00.000Z"
    }
  }
}
```

**Rate Limiting:**
- 5 attempts per 15 minutes per IP
- Account locked after 30 failed attempts

### POST /auth/logout

Terminate user session.

**Headers:**
```
X-CSRF-Token: csrf_token_here
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /auth/forgot-password

Request password reset token.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset instructions sent to your email"
}
```

**Rate Limiting:**
- 3 requests per hour per email
- 10 requests per hour per IP

### POST /auth/reset-password

Reset password using token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### POST /auth/verify-email

Verify email address using token.

**Request Body:**
```json
{
  "token": "verification_token_here"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### POST /auth/resend-verification

Resend email verification.

**Headers:**
```
X-CSRF-Token: csrf_token_here
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

**Rate Limiting:**
- 3 requests per hour per user

## Dashboard Endpoints

### GET /dashboard/profile

Get user profile information.

**Headers:**
```
X-CSRF-Token: csrf_token_here
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "profile": { ... },
      "emailVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLogin": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### PUT /dashboard/profile

Update user profile.

**Headers:**
```
X-CSRF-Token: csrf_token_here
```

**Request Body:**
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "01/01/1990",
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "New York",
    "postcode": "10001",
    "country": "US"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "message": "Profile updated successfully"
  }
}
```

### GET /dashboard/stats

Get user usage statistics.

**Headers:**
```
X-CSRF-Token: csrf_token_here
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "usage": {
      "totalRequests": 150,
      "requestsToday": 5,
      "requestsThisMonth": 45,
      "lastRequest": "2024-01-01T00:00:00.000Z"
    },
    "rateLimit": {
      "limit": 1000,
      "remaining": 850,
      "resetAt": "2024-01-01T01:00:00.000Z",
      "period": "hour"
    },
    "apiKey": {
      "key": "sk_live_***masked***",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastUsed": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### POST /dashboard/api-key/generate

Generate new API key for user.

**Headers:**
```
X-CSRF-Token: csrf_token_here
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "apiKey": "sk_live_example_key_replace_with_real",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "message": "API key generated successfully"
  }
}
```

### POST /dashboard/api-key/regenerate

Regenerate existing API key.

**Headers:**
```
X-CSRF-Token: csrf_token_here
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "apiKey": "sk_live_new_key_here",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "message": "API key regenerated successfully"
  }
}
```

### POST /dashboard/change-password

Change user password.

**Headers:**
```
X-CSRF-Token: csrf_token_here
```

**Request Body:**
```json
{
  "currentPassword": "CurrentPassword123!",
  "newPassword": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## PDF Generation Endpoints

### POST /api/v1/html2pdf/convert

Convert HTML to PDF with optional compression.

**Headers:**
```
X-API-Key: sk_live_example_key_replace_with_real
Content-Type: application/json
```

**Request Body:**
```json
{
  "html": "<html><body><h1>Hello World</h1></body></html>",
  "pdfOptions": {
    "format": "A4",
    "margin": {
      "top": "1cm",
      "right": "1cm",
      "bottom": "1cm",
      "left": "1cm"
    },
    "displayHeaderFooter": false,
    "printBackground": true,
    "compress": true
  }
}
```

**Alternative Request (PDF Document Bundle):**
```json
{
  "pdfDocumentBundle": {
    "html": "<html><body><h1>Hello World</h1></body></html>",
    "css": "body { font-family: Arial; }",
    "js": "console.log('Hello');",
    "options": {
      "format": "A4",
      "margin": {
        "top": "1cm",
        "right": "1cm",
        "bottom": "1cm",
        "left": "1cm"
      },
      "displayHeaderFooter": false,
      "printBackground": true,
      "compress": true
    }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pdfUrl": "/api/v1/html2pdf/download/pdf_123456789.pdf",
    "filename": "document.pdf",
    "size": 245760,
    "compressed": true,
    "originalSize": 512000,
    "compressionRatio": 0.48,
    "generatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**PDF Options:**
- `format`: Page format (A4, A3, Letter, Legal, etc.)
- `margin`: Page margins (top, right, bottom, left)
- `displayHeaderFooter`: Show header/footer
- `printBackground`: Include background colors/images
- `compress`: Enable PDF compression
- `landscape`: Landscape orientation
- `scale`: Page scale factor (0.1-2.0)

**Rate Limiting:**
- Based on user's API key rate limit
- Additional IP-based limiting

### GET /api/v1/html2pdf/download/:filename

Download generated PDF file.

**Headers:**
```
X-API-Key: sk_live_example_key_replace_with_real
```

**Response (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="document.pdf"
Content-Length: 245760

[PDF Binary Data]
```

**File Cleanup:**
- Files are automatically deleted after 1 hour
- Maximum 1000 files per user

## Rate Limiting

### Rate Limit Headers

All API responses include rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 850
X-RateLimit-Reset: 1640995200
X-RateLimit-Period: hour
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again later.",
    "details": {
      "limit": 1000,
      "remaining": 0,
      "resetAt": "2024-01-01T01:00:00.000Z",
      "period": "hour"
    },
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

## Webhook Endpoints (Future)

### POST /webhooks/pdf-complete

Webhook for PDF generation completion (planned).

**Request Body:**
```json
{
  "event": "pdf.completed",
  "data": {
    "userId": "uuid",
    "pdfId": "pdf_123456789",
    "status": "success",
    "downloadUrl": "/api/v1/html2pdf/download/pdf_123456789.pdf",
    "generatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const PDFService = {
  baseURL: 'https://your-domain.com/api/v1',
  apiKey: 'sk_live_example_key_replace_with_real',

  async generatePDF(html, options = {}) {
    const response = await fetch(`${this.baseURL}/html2pdf/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({
        html,
        pdfOptions: {
          format: 'A4',
          compress: true,
          ...options
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    return await response.json();
  }
};

// Usage
try {
  const result = await PDFService.generatePDF('<h1>Hello World</h1>');
  console.log('PDF generated:', result.data.pdfUrl);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Python

```python
import requests
import json

class PDFService:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.api_key = api_key
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }

    def generate_pdf(self, html, options=None):
        if options is None:
            options = {}
        
        data = {
            'html': html,
            'pdfOptions': {
                'format': 'A4',
                'compress': True,
                **options
            }
        }
        
        response = requests.post(
            f'{self.base_url}/html2pdf/convert',
            headers=self.headers,
            json=data
        )
        
        if response.status_code != 200:
            error = response.json()
            raise Exception(error['error']['message'])
        
        return response.json()

# Usage
pdf_service = PDFService(
    'https://your-domain.com/api/v1',
    'sk_live_example_key_replace_with_real'
)

try:
    result = pdf_service.generate_pdf('<h1>Hello World</h1>')
    print('PDF generated:', result['data']['pdfUrl'])
except Exception as e:
    print('Error:', str(e))
```

### cURL Examples

**Generate PDF:**
```bash
curl -X POST "https://your-domain.com/api/v1/html2pdf/convert" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_example_key_replace_with_real" \
  -d '{
    "html": "<html><body><h1>Hello World</h1></body></html>",
    "pdfOptions": {
      "format": "A4",
      "compress": true
    }
  }'
```

**Download PDF:**
```bash
curl -X GET "https://your-domain.com/api/v1/html2pdf/download/document.pdf" \
  -H "X-API-Key: sk_live_example_key_replace_with_real" \
  -o "document.pdf"
```

## Testing

### Test Environment

- Base URL: `http://localhost:9005`
- Test API Key: `sk_live_test_example_replace_with_real`
- Rate Limits: 100 requests per minute

### Test Data

**Valid HTML:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Document</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Test PDF Generation</h1>
    <p>This is a test document for PDF generation.</p>
</body>
</html>
```

**Invalid HTML (for error testing):**
```html
<invalid>unclosed tag
```

## Changelog

### Version 1.0.0 (2024-01-01)
- Initial API release
- User authentication and registration
- API key management
- PDF generation with compression
- Rate limiting and usage tracking
- Session management
- Password reset functionality

### Planned Features
- Webhook support for async PDF generation
- Batch PDF generation
- PDF templates and variables
- Advanced PDF options (watermarks, headers, footers)
- API versioning strategy
- OAuth 2.0 integration
- Multi-factor authentication

## Support

For API support and questions:
- Email: api-support@your-domain.com
- Documentation: https://your-domain.com/docs
- Status Page: https://status.your-domain.com

## License

This API is proprietary software. Unauthorized use is prohibited.
