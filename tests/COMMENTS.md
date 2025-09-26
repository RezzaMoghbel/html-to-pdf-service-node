# Test Files Documentation

This document explains the purpose and usage of each test file in the `tests/` directory.

### ✅ **Active Test Files (Used in package.json scripts)**

#### 1. `api.test.js` - **API Endpoint Tests**

- **Purpose**: Tests all API endpoints for the PDF service
- **Usage**: `npm run test:api`
- **What it tests**:
  - Health check endpoints (`/health`, `/health/detailed`)
  - Bundle HTML to PDF conversion (`/api/v1/bundle/bundleHtml2PDF`)
  - PDF generation with various HTML inputs
  - Error handling for invalid inputs
  - Response headers and content types
- **Status**: ✅ **ACTIVE** - Referenced in package.json

#### 2. `utils.test.js` - **Utility Functions Tests**

- **Purpose**: Tests utility functions used throughout the application
- **Usage**: `npm run test:unit`
- **What it tests**:
  - `buildHtmlFromPdfDocumentBundle()` function
  - Edge cases and error handling
- **Status**: ✅ **ACTIVE** - Referenced in package.json

#### 3. `integration.test.js` - **Integration Tests**

- **Purpose**: Tests the complete workflow with real test data
- **Usage**: `npm run test:integration`
- **What it tests**:
  - End-to-end PDF generation with real JSON data
  - Bundle HTML to PDF with test-data files
  - Advanced sample data processing
  - File system integration
- **Status**: ✅ **ACTIVE** - Referenced in package.json

#### 4. `bundleHtml2PDF.test.js` - **Bundle HTML to PDF Tests**

- **Purpose**: Jest-based tests for bundle HTML to PDF functionality
- **Usage**: `npm run test:bundleHtml2PDF:jest`
- **What it tests**:
  - Simple HTML bundle processing
  - Complex multi-page documents
  - Error handling for invalid bundles
  - Response validation
- **Status**: ✅ **ACTIVE** - Referenced in package.json

#### 5. `run-tests.js` - **Custom Test Runner**

- **Purpose**: Custom test runner for bundle functionality
- **Usage**: `npm run test:bundle` and `npm run test:scenario`
- **What it does**:
  - Runs HTTP requests to test endpoints
  - Tests both HTML and pdfDocumentBundle formats
  - Provides colored console output
  - Generates test result reports
- **Status**: ✅ **ACTIVE** - Referenced in package.json

#### 6. `bundleHtml2PDF-runner.js` - **Dedicated Bundle Test Runner**

- **Purpose**: Specialized test runner for bundleHtml2PDF endpoint
- **Usage**: `npm run test:bundleHtml2PDF`
- **What it does**:
  - Comprehensive testing of bundle functionality
  - Multiple test scenarios
  - Performance testing
  - Detailed reporting
- **Status**: ✅ **ACTIVE** - Referenced in package.json

#### 7. `setup.js` - **Test Setup Configuration**

- **Purpose**: Global test configuration and utilities
- **Usage**: Automatically loaded by Jest
- **What it provides**:
  - Jest timeout configuration (30 seconds)
  - Console mocking for cleaner test output
  - Global test utilities (`testUtils`)
  - Helper functions for creating test data
- **Status**: ✅ **ACTIVE** - Referenced in jest.config.js

## 🗂️ **Supporting Files**

#### 8. `README.md` - **Test Documentation**

- **Purpose**: Documentation for the test suite
- **Status**: ✅ **KEEP** - Provides valuable documentation

#### 9. `test-data/` - **Test Data Directory**

- **Purpose**: Contains JSON test data files used in integration tests
- **Files**: 3 JSON files + documentation
  - `test.json` - Basic test data (used in integration tests)
  - `README.md` - Test data documentation
  - `USAGE_ANALYSIS.md` - Usage analysis and cleanup documentation
- **Status**: ✅ **KEEP** - Used by integration tests

#### 10. `results/` - **Test Results Directory**

- **Purpose**: Stores test result files (excluded by .gitignore)
- **Status**: ✅ **KEEP** - Directory structure needed
