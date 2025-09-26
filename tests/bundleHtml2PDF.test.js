const request = require("supertest");
const app = require("../app");

describe("bundleHtml2PDF Endpoint", () => {
  describe("POST /api/v1/bundle/bundleHtml2PDF", () => {
    it("should generate PDF from simple HTML", async () => {
      const testData = {
        html: "<h1>Test PDF</h1><p>This is a simple test document.</p>",
      };

      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send(testData)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain("attachment");
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);
    }, 10000);

    it("should generate PDF from HTML with custom options", async () => {
      const testData = {
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
      };

      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send(testData)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain("attachment");
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);
    }, 10000);

    it("should generate PDF from pdfDocumentBundle format", async () => {
      const testData = {
        pdfDocumentBundle: {
          head: {
            title: "Test Document",
            styles: [
              {
                content:
                  "body { font-family: Arial, sans-serif; margin: 20px; }",
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
      };

      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send(testData)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain("attachment");
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);
    }, 10000);

    it("should handle htmlContent field", async () => {
      const testData = {
        htmlContent:
          "<h1>HTML Content Test</h1><p>Testing htmlContent field.</p>",
      };

      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send(testData)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);
    }, 10000);

    it("should return error PDF for invalid request", async () => {
      const testData = {}; // Empty request

      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send(testData)
        .expect(200); // Server returns error PDF, not 500

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["x-error"]).toBe("true");
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it("should handle different PDF formats", async () => {
      const formats = ["A4", "A3", "Letter", "Legal"];

      for (const format of formats) {
        const testData = {
          html: `<h1>Test ${format} Format</h1><p>Testing ${format} format.</p>`,
          pdfOptions: { format },
        };

        const response = await request(app)
          .post("/api/v1/bundle/bundleHtml2PDF")
          .send(testData)
          .expect(200);

        expect(response.headers["content-type"]).toBe("application/pdf");
        expect(response.body).toBeInstanceOf(Buffer);
        expect(response.body.length).toBeGreaterThan(0);
      }
    }, 15000); // Increase timeout to 15 seconds

    it("should handle landscape orientation", async () => {
      const testData = {
        html: "<h1>Landscape Test</h1><p>This should be in landscape mode.</p>",
        pdfOptions: {
          landscape: true,
        },
      };

      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send(testData)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);
    }, 10000);

    it("should handle custom margins", async () => {
      const testData = {
        html: "<h1>Margin Test</h1><p>Testing custom margins.</p>",
        pdfOptions: {
          margin: {
            top: "3cm",
            right: "2cm",
            bottom: "3cm",
            left: "2cm",
          },
        },
      };

      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send(testData)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);
    }, 10000);

    it("should handle scale option", async () => {
      const testData = {
        html: "<h1>Scale Test</h1><p>Testing scale option.</p>",
        pdfOptions: {
          scale: 1.5,
        },
      };

      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send(testData)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);
    }, 10000);

    it("should handle printBackground option", async () => {
      const testData = {
        html: `
          <h1 style="background-color: yellow;">Background Test</h1>
          <p style="background-color: lightblue;">Testing printBackground option.</p>
        `,
        pdfOptions: {
          printBackground: true,
        },
      };

      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send(testData)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);
    }, 10000);
  });
});
