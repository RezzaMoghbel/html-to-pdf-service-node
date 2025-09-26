const {
  buildHtmlFromPdfDocumentBundle,
} = require("../utils/buildHtmlFromPdfDocumentBundle");

describe("Utility Functions Tests", () => {
  describe("buildHtmlFromPdfDocumentBundle", () => {
    it("should build HTML from valid pdfDocumentBundle", () => {
      const bundle = {
        head: {
          title: "Test Document",
          styles: [
            {
              content: "body { font-family: Arial; }",
            },
          ],
        },
        body: {
          pages: [
            {
              body: "<h1>Page 1</h1><p>Content</p>",
            },
          ],
        },
      };

      const result = buildHtmlFromPdfDocumentBundle(bundle);
      expect(result).toContain("<title>Test Document</title>");
      expect(result).toContain("<h1>Page 1</h1>");
      expect(result).toContain("<!DOCTYPE html>");
    });

    it("should handle multiple pages", () => {
      const bundle = {
        head: {
          title: "Multi-page Document",
        },
        body: {
          pages: [{ body: "<h1>Page 1</h1>" }, { body: "<h1>Page 2</h1>" }],
        },
      };

      const result = buildHtmlFromPdfDocumentBundle(bundle);
      expect(result).toContain("<h1>Page 1</h1>");
      expect(result).toContain("<h1>Page 2</h1>");
    });

    it("should handle multiple styles", () => {
      const bundle = {
        head: {
          title: "Test Document",
          styles: [
            { content: "body { margin: 0; }" },
            { content: "h1 { color: blue; }" },
          ],
        },
        body: {
          pages: [{ body: "<h1>Test</h1>" }],
        },
      };

      const result = buildHtmlFromPdfDocumentBundle(bundle);
      expect(result).toContain("<title>Test Document</title>");
      expect(result).toContain("<h1>Test</h1>");
    });

    it("should throw error for missing title", () => {
      const bundle = {
        head: {
          styles: [{ content: "body { margin: 0; }" }],
        },
        body: {
          pages: [{ body: "<h1>Test</h1>" }],
        },
      };

      expect(() => buildHtmlFromPdfDocumentBundle(bundle)).toThrow(
        "head.title is required"
      );
    });

    it("should throw error for missing pages array", () => {
      const bundle = {
        head: {
          title: "Test Document",
        },
        body: {},
      };

      expect(() => buildHtmlFromPdfDocumentBundle(bundle)).toThrow(
        "body.pages must be an array"
      );
    });

    it("should throw error for empty pages array", () => {
      const bundle = {
        head: { title: "Test" },
        body: { pages: [] },
      };

      expect(() => buildHtmlFromPdfDocumentBundle(bundle)).toThrow(
        "No valid pages to render"
      );
    });
  });
});
