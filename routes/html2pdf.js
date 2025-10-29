// routes/bundleHtml2PDF.js
const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const {
  buildHtmlFromPdfDocumentBundle,
  buildErrorHtml,
} = require("../utils/buildHtmlFromPdfDocumentBundle");
const { sendEmail } = require("../utils/email");

// API KEY AUTHENTICATION - Added for authentication system
const { apiKeyAuth } = require("../middleware/apiKeyAuth");

const router = express.Router();

// --- small helpers ---
function nowStamp() {
  const d = new Date();
  const iso = d.toISOString().replace(/[:.]/g, "-");
  return iso;
}

/**
 * Compress a PDF buffer using pdf-lib
 * @param {Buffer} pdfBuffer - The original PDF buffer
 * @returns {Promise<Buffer>} - The compressed PDF buffer
 */
async function compressPDF(pdfBuffer) {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Save the document with compression enabled
    // pdf-lib automatically applies compression when saving
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: true, // Enable object streams for better compression
      addDefaultPage: false,
    });

    return Buffer.from(compressedPdfBytes);
  } catch (error) {
    console.warn(
      "PDF compression failed, returning original PDF:",
      error.message
    );
    return pdfBuffer; // Return original if compression fails
  }
}

async function writeLogFile({ ok, details }) {
  try {
    const dir = path.join(process.cwd(), "logs");
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(
      dir,
      `pdf-${ok ? "success" : "error"}-${nowStamp()}.txt`
    );
    const lines = [
      `timestamp: ${new Date().toISOString()}`,
      `status: ${ok ? "success" : "error"}`,
      `details: ${details || "n/a"}`,
      "",
    ].join("\n");
    await fs.writeFile(file, lines, "utf8");
    return file;
  } catch (e) {
    console.warn("Failed to write log file:", e.message);
    return null;
  }
}

/**
 * POST /convert
 * Simple endpoint that accepts either HTML content or pdfDocumentBundle
 * API KEY AUTHENTICATION - Added for authentication system
 */
router.post("/convert", apiKeyAuth, async (req, res) => {
  let browser;
  let ok = false;
  let logDetails = "";

  try {
    const {
      html,
      htmlContent,
      pdfDocumentBundle,
      pdfOptions = {},
      emailTo,
    } = req.body;

    // Determine the HTML content to use
    let markup;
    if (pdfDocumentBundle && typeof pdfDocumentBundle === "object") {
      // Use the existing bundle system
      markup = buildHtmlFromPdfDocumentBundle(pdfDocumentBundle);
    } else {
      // Use direct HTML content
      const htmlToUse = html || htmlContent;
      if (!htmlToUse) {
        throw new Error(
          'Either "html", "htmlContent", or "pdfDocumentBundle" must be provided'
        );
      }
      markup = htmlToUse;
    }

    if (!markup || typeof markup !== "string" || !markup.trim()) {
      throw new Error("Failed to generate HTML content from provided input");
    }

    // Launch browser
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
      ],
    });

    const page = await browser.newPage();

    // Set content
    await page.setContent(markup, { waitUntil: "networkidle0" });

    // Generate PDF with provided options or defaults
    let pdfBuffer = await page.pdf({
      format: pdfOptions.format || "A4",
      printBackground: pdfOptions.printBackground !== false,
      margin: pdfOptions.margin || {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm",
      },
      landscape: pdfOptions.landscape || false,
      scale: pdfOptions.scale || 1,
      ...pdfOptions,
    });

    // Apply compression if requested
    const originalSize = pdfBuffer.length;
    if (pdfOptions.compress) {
      pdfBuffer = await compressPDF(pdfBuffer);
      const compressedSize = pdfBuffer.length;
      const compressionRatio = (
        ((originalSize - compressedSize) / originalSize) *
        100
      ).toFixed(1);
      console.log(
        `PDF compressed: ${originalSize} bytes -> ${compressedSize} bytes (${compressionRatio}% reduction)`
      );
    }

    // Success flow
    ok = true;
    logDetails = `PDF generated successfully. Size: ${pdfBuffer.length} bytes${
      pdfOptions.compress ? ` (compressed from ${originalSize} bytes)` : ""
    }`;
    await writeLogFile({ ok: true, details: logDetails });

    // Send success email if requested
    if (emailTo) {
      const sizeText = pdfOptions.compress
        ? `Size: ${Math.round(
            pdfBuffer.length / 1024
          )}KB (compressed from ${Math.round(originalSize / 1024)}KB)`
        : `Size: ${Math.round(pdfBuffer.length / 1024)}KB`;

      await sendEmail({
        to: emailTo,
        subject: "PDF generated successfully",
        text: `Your PDF has been generated successfully.\n\n${sizeText}\nGenerated at: ${new Date().toISOString()}`,
      }).catch((e) => console.warn("Email (success) failed:", e.message));
    }

    // Set response headers
    const filename = `html2pdf-${Date.now()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (err) {
    console.error("Error generating PDF:", err);

    // Build fallback error HTML
    const errorMessage = err.message || "An unknown error occurred";
    const fallbackHtml = buildErrorHtml(
      `PDF generation failed: ${errorMessage}\n\nPlease check your input and try again.`
    );

    try {
      // Launch browser for error PDF if not already launched
      if (!browser) {
        browser = await puppeteer.launch({
          headless: "new",
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
      }

      const page = await browser.newPage();
      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
      });

      // Failure flow
      ok = false;
      logDetails = `Error: ${errorMessage}`;
      await writeLogFile({ ok: false, details: logDetails });

      // Send failure email if requested
      if (req.body?.emailTo) {
        await sendEmail({
          to: req.body.emailTo,
          subject: "PDF generation failed",
          text: `PDF generation failed with the following error:\n\n${errorMessage}`,
        }).catch((e) => console.warn("Email (failure) failed:", e.message));
      }

      // Return error PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="html2pdf-error.pdf"'
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader("X-Error", "true");

      return res.end(pdfBuffer);
    } catch (fallbackErr) {
      console.error("Fallback PDF failed:", fallbackErr);

      // Final fallback: return JSON error
      await writeLogFile({
        ok: false,
        details: `Fallback failed: ${fallbackErr?.message || fallbackErr}`,
      });

      return res.status(500).json({
        success: false,
        error: {
          message: "PDF generation failed and fallback also failed",
          originalError: errorMessage,
          fallbackError: fallbackErr?.message || "Unknown fallback error",
          timestamp: new Date().toISOString(),
        },
      });
    }
  } finally {
    // Clean up browser
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.warn("Failed to close browser:", closeErr.message);
      }
    }
  }
});

module.exports = router;
