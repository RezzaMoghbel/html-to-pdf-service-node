// swagger.js (root)
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Import centralized pieces
const { components } = require("./utils/swagger/pdfSchemas");
const { paths } = require("./utils/swagger/pdfPaths");

// Base Swagger configuration (keeps your existing servers + route scanning)
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "PDF Service API",
      version: "2.0.0",
      description:
        "Comprehensive API for PDF generation, conversion, and processing with enhanced security and monitoring capabilities.\n\n**📥 PDF Download Instructions:**\n- All PDF endpoints return downloadable files\n- Click 'Try it out' → 'Execute' to test endpoints\n- The browser will automatically download the generated PDF\n- PDFs are generated with proper filenames for easy identification\n\n**🔐 Authentication:**\n- All API endpoints require an API key\n- Click the 'Authorize' button 🔓 at the top of this page to add your API key\n- You can use either the X-API-Key header or Bearer token authentication\n- Format: `sk_live_your_api_key_here`",
      contact: {
        name: "PDF Service Support",
        email: "support@pdf-service.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "https://html2pdf.test-api.co.uk",
        description: "Production server",
      },
      {
        url: "http://localhost:9005",
        description: "Local development server",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Health check and monitoring endpoints",
      },
      {
        name: "Bundle",
        description: "PDF bundle processing endpoints",
      },
    ],
  },
  apis: ["./routes/*.js"], // Scan route files for JSDoc comments
};

const generated = swaggerJsDoc(swaggerOptions);

// Merge paths/components from centralized utils
const swaggerDocs = {
  ...generated,
  components: {
    ...(generated.components || {}),
    ...(components || {}),
    // Merge nested "schemas" too, in case some already exist
    schemas: {
      ...((generated.components && generated.components.schemas) || {}),
      ...((components && components.schemas) || {}),
    },
    // Add security schemes for API key authentication
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API key for authentication. Format: sk_live_...",
      },
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "API Key",
        description: "API key as Bearer token. Use your API key directly (format: sk_live_...)",
      },
    },
  },
  paths: {
    ...(generated.paths || {}),
    ...(paths || {}),
  },
};

module.exports = { swaggerUi, swaggerDocs };
