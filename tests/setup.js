// Test setup file
// This file runs before each test file

// Increase timeout for PDF generation tests
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Helper to create test HTML content
  createTestHtml: (title = "Test", content = "Test content") => {
    return `<html><head><title>${title}</title></head><body><h1>${title}</h1><p>${content}</p></body></html>`;
  },

  // Helper to create test bundle data
  createTestBundle: (html = "<h1>Test</h1>") => {
    return {
      html: html,
    };
  },

  // Helper to create test pdfDocumentBundle
  createTestPdfDocumentBundle: (pages = ["<h1>Page 1</h1>"]) => {
    return {
      head: {
        title: "Test Document",
        styles: [
          {
            content: "body { font-family: Arial, sans-serif; }",
          },
        ],
      },
      body: {
        pages: pages.map((content) => ({ content })),
      },
    };
  },
};
