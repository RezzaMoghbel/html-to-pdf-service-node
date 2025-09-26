const request = require("supertest");
const app = require("../app");

describe("PDF Service API Tests", () => {
  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/v1/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status");
      expect(response.body.status).toBe("healthy");
    });

    it("should return detailed health status", async () => {
      const response = await request(app).get("/api/v1/health/detailed");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
    });
  });

  describe("Bundle HTML to PDF", () => {
    it("should generate PDF from HTML bundle", async () => {
      const bundleData = {
        html: "<h1>Bundle Test</h1><p>This is a bundle test.</p>",
      };

      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send(bundleData);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    });

    it("should generate PDF from pdfDocumentBundle", async () => {
      const bundleData = {
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
        .send(bundleData);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    });

    it("should handle empty bundle data gracefully", async () => {
      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send({});

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .set("Content-Type", "application/json")
        .send("invalid json");

      expect(response.status).toBe(400);
    });

    it("should handle missing content-type header", async () => {
      const response = await request(app)
        .post("/api/v1/bundle/bundleHtml2PDF")
        .send("raw data");

      expect(response.status).toBe(400);
    });
  });
});
