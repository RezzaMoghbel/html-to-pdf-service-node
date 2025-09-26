# Test Data for Enhanced BundleHtml2PDF API

## Overview

This folder contains test JSON files for the enhanced `bundleHtml2PDF` endpoint. The endpoint now supports both the original `pdfDocumentBundle` format and the new simplified `html` format.

## Working Files

### 1. `simple-bundle-test.json` ✅ WORKING

- **Format**: `pdfDocumentBundle` (original format)
- **Description**: Simple test with basic styling and one page
- **Status**: ✅ Tested and working
- **Usage**: Use this as a template for your own `pdfDocumentBundle` requests

### 2. `simple-test.json` ✅ WORKING

- **Format**: `html` (new simplified format)
- **Description**: Simple HTML with header/footer configuration
- **Status**: ✅ Tested and working
- **Usage**: Use this for simple HTML-to-PDF conversions

## Issue with Complex Files

### Problem

The complex JSON files with extensive CSS styling are failing due to JSON parsing errors. The issue is with the CSS content that contains special characters and formatting that breaks JSON parsing.

### Root Cause

- CSS content with `\r\n` characters
- Complex CSS with quotes and special characters
- Large inline styles that exceed JSON parsing limits

## Solution

### Option 1: Use the Working Simple Template

Copy `simple-bundle-test.json` and modify it with your content:

```json
{
  "pdfDocumentBundle": {
    "head": {
      "title": "Your Document Title",
      "meta": [
        { "charset": "utf-8" },
        { "name": "viewport", "content": "width=device-width,initial-scale=1" }
      ],
      "styles": [
        {
          "type": "inline",
          "content": "<style>/* Your CSS here - keep it simple */</style>"
        }
      ]
    },
    "layout": {
      "page": {
        "size": "A4",
        "margin": {
          "top": "0mm",
          "right": "0mm",
          "bottom": "0mm",
          "left": "0mm"
        },
        "headerHeight": "15mm",
        "footerHeight": "10mm"
      },
      "useBuiltInPaginator": true
    },
    "body": {
      "document": { "class": "document" },
      "pages": [
        {
          "section": { "class": "page", "dataTitle": "Page Title" },
          "options": { "showHeader": true, "showFooter": true },
          "body": "<main class=\"body\"><h1>Your Content Here</h1></main>"
        }
      ]
    },
    "header": "<header><div>Your Header</div></header>",
    "footer": "<footer><div>Your Footer</div></footer>"
  },
  "pdfOptions": {
    "format": "A4",
    "printBackground": true,
    "margin": {
      "top": "1cm",
      "right": "1cm",
      "bottom": "1cm",
      "left": "1cm"
    }
  }
}
```

### Option 2: Use the New HTML Format

For simpler cases, use the new `html` format:

```json
{
  "html": "<!DOCTYPE html><html><head><title>Document</title><style>/* CSS */</style></head><body><h1>Content</h1></body></html>",
  "pdfOptions": {
    "format": "A4",
    "printBackground": true,
    "margin": { "top": "1cm", "right": "1cm", "bottom": "1cm", "left": "1cm" }
  },
  "header": {
    "enabled": true,
    "content": "<div>Header Content</div>",
    "height": "20mm"
  },
  "footer": {
    "enabled": true,
    "content": "<div>Footer Content</div>",
    "height": "15mm"
  }
}
```

## Testing

To test any of these files:

```powershell
Invoke-WebRequest -Uri "http://localhost:9005/api/v1/bundle/bundleHtml2PDF" -Method POST -Headers @{"Content-Type"="application/json"} -Body (Get-Content test-data/test.json -Raw) -OutFile "output.pdf"
```

## Recommendations

1. **Start Simple**: Use the working templates and gradually add complexity
2. **External CSS**: Consider moving complex CSS to external files or CDN
3. **Minify CSS**: Remove unnecessary whitespace and newlines from CSS
4. **Test Incrementally**: Add one page at a time to identify issues

## API Endpoints

- **Swagger UI**: http://localhost:9005/swagger
- **Health Check**: http://localhost:9005/health
- **Test Page**: http://localhost:9005/test-pdf.html
- **API Docs**: http://localhost:9005/api-docs.html
