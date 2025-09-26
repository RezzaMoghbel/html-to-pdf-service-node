const request = require("supertest");
const app = require("../app");
const fs = require("fs");
const path = require("path");

describe("Integration Tests", () => {
  describe("Bundle PDF with Real Data", () => {
    it("should generate PDF from test.json data", async () => {
      // Load test data
      const testDataPath = path.join(__dirname, "..", "test-data", "test.json");
      const testData = JSON.parse(fs.readFileSync(testDataPath, "utf8"));

      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe("End-to-End PDF Generation Workflow", () => {
    it("should handle complex bundle with all features", async () => {
      const complexBundle = {
        pdfDocumentBundle: {
          head: {
            title: "Complex Test Document",
            styles: [
              {
                content: `
                  body { 
                    font-family: Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                  }
                  .header { 
                    background-color: #f0f0f0; 
                    padding: 10px; 
                    text-align: center; 
                  }
                  .footer { 
                    background-color: #f0f0f0; 
                    padding: 10px; 
                    text-align: center; 
                    margin-top: 20px; 
                  }
                  .page-break { 
                    page-break-before: always; 
                  }
                `,
              },
            ],
          },
          body: {
            pages: [
              {
                content: `
                  <div class="header">
                    <h1>Page 1</h1>
                  </div>
                  <p>This is the first page with complex styling.</p>
                  <ul>
                    <li>Feature 1</li>
                    <li>Feature 2</li>
                    <li>Feature 3</li>
                  </ul>
                `,
              },
              {
                content: `
                  <div class="page-break"></div>
                  <div class="header">
                    <h1>Page 2</h1>
                  </div>
                  <p>This is the second page.</p>
                  <table border="1" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <th>Item</th>
                      <th>Value</th>
                    </tr>
                    <tr>
                      <td>Test Item</td>
                      <td>Test Value</td>
                    </tr>
                  </table>
                `,
              },
            ],
          },
        },
      };

      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send(complexBundle);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe("Performance Tests", () => {
    it("should handle large HTML content efficiently", async () => {
      // Generate large HTML content
      let largeHtml = "<html><body>";
      for (let i = 0; i < 1000; i++) {
        largeHtml += `<h2>Section ${i}</h2><p>This is paragraph ${i} with some content to make it larger.</p>`;
      }
      largeHtml += "</body></html>";

      const startTime = Date.now();

      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send({ html: largeHtml });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it("should handle multiple concurrent requests", async () => {
      const htmlContent = "<html><body><h1>Concurrent Test</h1></body></html>";

      // Send 5 concurrent requests
      const promises = Array(5)
        .fill()
        .map(() =>
          request(app)
            .post("/api/v1/bundle/bundleHtml2PDF")
            .send({ html: htmlContent })
        );

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toBe("application/pdf");
      });
    });
  });

  describe("Error Recovery Tests", () => {
    it("should recover from malformed JSON in bundle", async () => {
      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .set("Content-Type", "application/json")
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });

    it("should handle missing required fields gracefully", async () => {
      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send({ invalidField: "test" });

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    });
  });
});
