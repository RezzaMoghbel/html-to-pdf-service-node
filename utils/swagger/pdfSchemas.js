// utils/swagger/pdfSchemas.js
module.exports = {
  components: {
    schemas: {
      PdfOptions: {
        type: "object",
        properties: {
          format: {
            type: "string",
            enum: [
              "Letter",
              "Legal",
              "Tabloid",
              "Ledger",
              "A0",
              "A1",
              "A2",
              "A3",
              "A4",
              "A5",
            ],
          },
          printBackground: { type: "boolean", default: true },
          preferCSSPageSize: { type: "boolean", default: true },
          margin: {
            type: "object",
            properties: {
              top: { type: "string", example: "0" },
              right: { type: "string", example: "0" },
              bottom: { type: "string", example: "0" },
              left: { type: "string", example: "0" },
            },
          },
        },
      },

      StyleRef: {
        type: "object",
        required: ["type"],
        properties: {
          type: { type: "string", enum: ["inline", "src"] },
          content: { type: "string", description: "Required when type=inline" },
          url: {
            type: "string",
            format: "uri",
            description: "Required when type=src",
          },
        },
        oneOf: [
          {
            required: ["type", "content"],
            properties: { type: { const: "inline" } },
          },
          { required: ["type", "url"], properties: { type: { const: "src" } } },
        ],
      },

      ScriptRef: {
        type: "object",
        required: ["type"],
        properties: {
          type: { type: "string", enum: ["inline", "src"] },
          content: { type: "string", description: "Required when type=inline" },
          url: {
            type: "string",
            format: "uri",
            description: "Required when type=src",
          },
        },
        oneOf: [
          {
            required: ["type", "content"],
            properties: { type: { const: "inline" } },
          },
          { required: ["type", "url"], properties: { type: { const: "src" } } },
        ],
      },

      PdfHead: {
        type: "object",
        required: ["title", "meta", "styles"],
        properties: {
          title: { type: "string" },
          meta: {
            type: "array",
            description: "Array of meta tag objects.",
            items: { type: "object", additionalProperties: true },
            example: [
              { charset: "utf-8" },
              {
                name: "viewport",
                content: "width=device-width,initial-scale=1",
              },
            ],
          },
          styles: {
            type: "array",
            items: { $ref: "#/components/schemas/StyleRef" },
          },
        },
      },

      PdfPage: {
        type: "object",
        required: ["section", "body"],
        properties: {
          header: {
            type: "string",
            description: "Optional page-level header HTML",
          },
          headerHeight: {
            type: "string",
            description:
              "Optional page-specific header height (overrides global headerHeight)",
            example: "20mm",
          },
          section: {
            type: "object",
            properties: {
              class: { type: "string", example: "page" },
              dataTitle: { type: "string", example: "Policy Details" },
            },
          },
          body: {
            type: "string",
            description:
              "Plain HTML string. If empty/missing, the page is skipped.",
          },
          footer: {
            type: "string",
            description: "Optional page-level footer HTML",
          },
          footerHeight: {
            type: "string",
            description:
              "Optional page-specific footer height (overrides global footerHeight)",
            example: "15mm",
          },
        },
      },

      PdfBody: {
        type: "object",
        required: ["pages"],
        properties: {
          document: {
            type: "object",
            properties: {
              class: { type: "string", example: "document" },
            },
          },
          pages: {
            type: "array",
            items: { $ref: "#/components/schemas/PdfPage" },
          },
        },
      },

      PdfDocumentBundle: {
        type: "object",
        required: ["head", "body"],
        properties: {
          head: { $ref: "#/components/schemas/PdfHead" },
          body: { $ref: "#/components/schemas/PdfBody" },
          header: {
            type: "string",
            description: "Global header HTML (fallback if page.header absent)",
          },
          footer: {
            type: "string",
            description: "Global footer HTML (fallback if page.footer absent)",
          },
          scripts: {
            type: "array",
            items: { $ref: "#/components/schemas/ScriptRef" },
          },
        },
      },
    },
  },
};
