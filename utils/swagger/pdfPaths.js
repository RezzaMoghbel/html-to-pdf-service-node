// utils/swagger/pdfPaths.js

// Define the paths object
const pdfPaths = {
  "/api/v1/html2pdf/convert": {
    post: {
      summary: "Convert HTML or pdfDocumentBundle to PDF",
      description:
        "Accepts either HTML content or a pdfDocumentBundle and returns a PDF. Supports basic PDF options like format, margins, and orientation.",
      tags: ["Bundle"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                html: {
                  type: "string",
                  description: "HTML content to convert to PDF",
                  example: "<html><body><h1>Hello World</h1></body></html>",
                },
                htmlContent: {
                  type: "string",
                  description: "Alternative field for HTML content",
                  example:
                    "<h1>Simple content</h1><p>This will be wrapped in HTML structure</p>",
                },
                pdfDocumentBundle: {
                  $ref: "#/components/schemas/PdfDocumentBundle",
                },
                pdfOptions: {
                  type: "object",
                  description: "PDF generation options",
                  properties: {
                    format: {
                      type: "string",
                      enum: ["A4", "A3", "Letter", "Legal"],
                      default: "A4",
                    },
                    margin: {
                      type: "object",
                      properties: {
                        top: { type: "string", example: "1cm" },
                        right: { type: "string", example: "1cm" },
                        bottom: { type: "string", example: "1cm" },
                        left: { type: "string", example: "1cm" },
                      },
                    },
                    landscape: { type: "boolean", default: false },
                    scale: {
                      type: "number",
                      minimum: 0.1,
                      maximum: 2,
                      default: 1,
                    },
                    printBackground: { type: "boolean", default: true },
                  },
                },
                emailTo: { type: "string", format: "email" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "PDF generated successfully",
          headers: {
            "Content-Disposition": {
              description: "Attachment header for file download",
              schema: {
                type: "string",
                example: 'attachment; filename="html2pdf.pdf"',
              },
            },
            "Content-Type": {
              description: "PDF MIME type",
              schema: { type: "string", example: "application/pdf" },
            },
          },
          content: {
            "application/pdf": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
        400: { description: "Invalid payload" },
        500: { description: "Rendering error" },
      },
    },
  },
};

module.exports = {
  paths: pdfPaths,
  components: {
    schemas: {},
  },
};
