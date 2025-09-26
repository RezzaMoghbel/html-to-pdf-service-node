#!/usr/bin/env node

/**
 * Dedicated test runner for bundleHtml2PDF endpoint
 * Runs comprehensive tests for the bundleHtml2PDF functionality
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

// Test configuration
const SERVER_URL = process.env.TEST_SERVER_URL || "http://localhost:9005";
const API_ENDPOINT = "/api/v1/bundle/bundleHtml2PDF";

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

/**
 * Make HTTP request to the API
 */
function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: "localhost",
      port: 9005,
      path: API_ENDPOINT,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData,
          isPdf: res.headers["content-type"] === "application/pdf",
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Run a single test
 */
async function runTest(testName, testData, expectedStatus = 200) {
  console.log(`${colors.blue}🧪 Running: ${testName}${colors.reset}`);
  testResults.total++;

  try {
    const response = await makeRequest(testData);

    if (response.statusCode === expectedStatus && response.isPdf) {
      console.log(`${colors.green}✅ PASSED: ${testName}${colors.reset}`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Content-Type: ${response.headers["content-type"]}`);
      console.log(
        `   Content-Length: ${response.headers["content-length"]} bytes`
      );
      testResults.passed++;
      return true;
    } else {
      console.log(`${colors.red}❌ FAILED: ${testName}${colors.reset}`);
      console.log(
        `   Expected status: ${expectedStatus}, got: ${response.statusCode}`
      );
      console.log(`   Expected PDF, got: ${response.headers["content-type"]}`);
      if (response.statusCode !== 200) {
        console.log(`   Response: ${response.data.substring(0, 200)}...`);
      }
      testResults.failed++;
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR: ${testName}${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * Test scenarios for bundleHtml2PDF
 */
const testScenarios = [
  {
    name: "Simple HTML Test",
    data: {
      html: "<h1>Test PDF</h1><p>This is a simple test document.</p>",
    },
  },
  {
    name: "HTML with PDF Options",
    data: {
      html: "<h1>Test PDF with Options</h1><p>Testing landscape mode and custom margins.</p>",
      pdfOptions: {
        format: "A4",
        landscape: true,
        margin: {
          top: "2cm",
          right: "2cm",
          bottom: "2cm",
          left: "2cm",
        },
      },
    },
  },
  {
    name: "Simple pdfDocumentBundle Test",
    data: {
      pdfDocumentBundle: {
        head: {
          title: "Test Document",
          styles: [
            {
              content: "body { font-family: Arial, sans-serif; margin: 20px; }",
            },
          ],
        },
        body: {
          pages: [
            {
              content:
                "<h1>Test Document</h1><p>This is a test using pdfDocumentBundle format.</p>",
            },
          ],
        },
      },
    },
  },
  {
    name: "HTML Content Field Test",
    data: {
      htmlContent:
        "<h1>HTML Content Test</h1><p>Testing htmlContent field.</p>",
    },
  },
  {
    name: "Different PDF Formats Test",
    data: {
      html: "<h1>Format Test</h1><p>Testing different PDF formats.</p>",
      pdfOptions: {
        format: "Letter",
      },
    },
  },
  {
    name: "Scale Option Test",
    data: {
      html: "<h1>Scale Test</h1><p>Testing scale option.</p>",
      pdfOptions: {
        scale: 1.5,
      },
    },
  },
  {
    name: "Print Background Test",
    data: {
      html: '<h1 style="background-color: yellow;">Background Test</h1><p style="background-color: lightblue;">Testing printBackground.</p>',
      pdfOptions: {
        printBackground: true,
      },
    },
  },
  {
    name: "Invalid Request (Missing Content)",
    data: {},
    expectedStatus: 200, // Server returns error PDF, not 500
  },
];

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(
    `${colors.bold}${colors.blue}🚀 Starting bundleHtml2PDF Tests${colors.reset}\n`
  );

  // Check if server is running
  try {
    const healthResponse = await makeRequest({});
    console.log(`${colors.green}✅ Server is running${colors.reset}\n`);
  } catch (error) {
    console.log(
      `${colors.red}❌ Server is not running. Please start the server with 'npm run dev'${colors.reset}`
    );
    process.exit(1);
  }

  // Run all test scenarios
  for (const scenario of testScenarios) {
    await runTest(scenario.name, scenario.data, scenario.expectedStatus);
    console.log(""); // Empty line for readability
  }

  // Print summary
  console.log(`${colors.bold}📊 Test Summary:${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.blue}📈 Total: ${testResults.total}${colors.reset}`);

  if (testResults.failed === 0) {
    console.log(
      `\n${colors.green}${colors.bold}🎉 All tests passed!${colors.reset}`
    );
    process.exit(0);
  } else {
    console.log(
      `\n${colors.red}${colors.bold}💥 Some tests failed!${colors.reset}`
    );
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch((error) => {
  console.error(
    `${colors.red}💥 Test runner error: ${error.message}${colors.reset}`
  );
  process.exit(1);
});
