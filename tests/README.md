# Testing Guide

This directory contains comprehensive tests for the PDF Service Node.js application.

## Test Structure

### Unit Tests

- `utils.test.js` - Tests for utility functions
- `api.test.js` - Tests for API endpoints

### Integration Tests

- `integration.test.js` - End-to-end integration tests
- `bundleHtml2PDF.test.js` - Bundle PDF generation tests

### Custom Test Runners

- `run-tests.js` - Custom test runner for bundle functionality
- `bundleHtml2PDF-runner.js` - Specific runner for bundle tests

## Running Tests

### Run All Tests

```bash
npm test
```

This runs unit tests, integration tests, and bundle tests in sequence.

### Run Specific Test Types

#### Unit Tests Only

```bash
npm run test:unit
```

#### API Tests Only

```bash
npm run test:api
```

#### Integration Tests Only

```bash
npm run test:integration
```

#### All Jest Tests

```bash
npm run test:all
```

#### Bundle Tests (Custom Runner)

```bash
npm run test:bundle
```

### Development Mode

#### Watch Mode (Reruns tests on file changes)

```bash
npm run test:watch
```

#### Coverage Report

```bash
npm run test:coverage
```

#### Bundle Tests with Watch

```bash
npm run test:bundle:watch
```

## Test Data

Test data is located in the `test-data/` directory:

- `test.json` - Basic test data

## Test Configuration

- **Jest Config**: `jest.config.js`
- **Test Setup**: `tests/setup.js`
- **Timeout**: 30 seconds (for PDF generation)
- **Environment**: Node.js

## Test Coverage

The test suite covers:

- ✅ All API endpoints
- ✅ Utility functions
- ✅ Error handling
- ✅ Input validation
- ✅ PDF generation
- ✅ Bundle functionality
- ✅ Integration workflows
- ✅ Performance scenarios

## Prerequisites

1. **Server Running**: For integration tests, the server must be running

   ```bash
   npm run dev
   ```

2. **Dependencies**: All test dependencies are installed with `npm install`

3. **Test Data**: Ensure test data files exist in `test-data/` directory

## Troubleshooting

### Common Issues

1. **Server Not Running**

   - Error: Connection refused
   - Solution: Start server with `npm run dev`

2. **Timeout Errors**

   - Error: Test timeout exceeded
   - Solution: Increase timeout in `jest.config.js` or check server performance

3. **PDF Generation Failures**

   - Error: PDF generation failed
   - Solution: Check Puppeteer installation and system dependencies

4. **Memory Issues**
   - Error: Out of memory
   - Solution: Run tests with `--runInBand` flag (already configured)

### Debug Mode

Run tests with verbose output:

```bash
npm run test:all -- --verbose
```

Run specific test file:

```bash
npx jest tests/api.test.js --verbose
```

## Adding New Tests

1. **Unit Tests**: Add to existing test files or create new ones
2. **Integration Tests**: Add to `integration.test.js`
3. **API Tests**: Add to `api.test.js`
4. **Custom Tests**: Create new files following the naming pattern `*.test.js`

## Test Best Practices

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock External Dependencies**: Mock file system, network calls
4. **Clean Up**: Clean up after tests if needed
5. **Independent Tests**: Tests should not depend on each other
6. **Fast Tests**: Keep unit tests fast, integration tests can be slower
