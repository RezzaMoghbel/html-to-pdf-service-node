# PDF Service Node.js

A comprehensive Node.js service for generating PDFs from HTML content with support for single pages and document bundles.

## Features

- **Bundle HTML to PDF**: Create multi-page PDF documents from HTML bundles
- **PDF Generation**: Support for custom CSS, JavaScript, headers, and footers
- **RESTful API**: Clean API endpoints with Swagger documentation
- **Test UI**: Interactive web interfaces for testing PDF generation
- **Comprehensive Testing**: Full test suite with integration tests

## API Endpoints

### Health Check

- `GET /health` - Service health status
- `GET /health/detailed` - Detailed health status with uptime information

### Bundle HTML to PDF

- `POST /api/v1/bundle/bundleHtml2PDF` - Convert HTML bundle to PDF

## Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start the Service**

   ```bash
   npm start
   ```

3. **Access the API**
   - API Documentation: `http://localhost:9005/api-docs.html`
   - Test UI: `http://localhost:9005/pages/html2pdf-test-ui.html`

## Configuration

The service uses environment variables for configuration. See `config/environment.js` for available options.

## Testing

Run the test suite:

```bash
npm test
```

## Project Structure

```
├── config/                 # Configuration files
├── middleware/             # Express middleware
├── public/                 # Static web files and test UIs
├── routes/                 # API route handlers
├── tests/                  # Test files and test data
├── utils/                  # Utility functions
├── test-data/              # Sample data for testing
└── app.js                  # Main application entry point
```

## Test Data

The `test-data/` directory contains sample JSON files for testing the bundle PDF functionality. These files are not included in version control but are available locally for development and testing.

## License

This project is proprietary software.
