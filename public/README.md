# Public Directory Structure

This directory contains all static assets and pages served by the PDF Service.

## Directory Organization

```
public/
├── README.md                    # This file - documentation
├── index.html                   # Main landing page
├── 404.html                     # Custom 404 error page
├── css/                         # Stylesheets
│   └── health-status.css        # Health status widget styles
├── js/                          # JavaScript files
│   └── health-status.js         # Health status widget functionality
├── pages/                       # HTML pages
│   ├── api-docs.html           # API documentation
│   ├── api-reference.html      # API reference guide
│   ├── html2pdf-test-ui.html                  # Test UI for HTML2PDF Pro
│   └── test-pdf.html           # PDF testing page
└── assets/                      # Static assets (images, fonts, etc.)
    └── (future assets)
```

## File Descriptions

### Root Level

- **`index.html`** - Main landing page with service overview and navigation
- **`404.html`** - Custom 404 error page with health status widget

### CSS Directory (`css/`)

- **`health-status.css`** - Styles for the health status widget including animations

### JavaScript Directory (`js/`)

- **`health-status.js`** - Health status widget class and functionality

### Pages Directory (`pages/`)

- **`api-docs.html`** - Comprehensive API documentation with examples
- **`api-reference.html`** - Quick API reference with code examples
- **`html2pdf-test-ui.html`** - Interactive test interface for HTML2PDF Pro
- **`test-pdf.html`** - Simple PDF testing interface

### Assets Directory (`assets/`)

- Reserved for static assets like images, fonts, icons, etc.

## URL Structure

- `/` → `index.html`
- `/404` → `404.html` (served by error handler)
- `/pages/api-docs.html` → API documentation
- `/pages/api-reference.html` → API reference
- `/pages/html2pdf-test-ui.html` → Test UI
- `/pages/test-pdf.html` → PDF testing
- `/css/health-status.css` → Health widget styles
- `/js/health-status.js` → Health widget script

## Health Status Widget

The health status widget is included on all pages and provides:

- Real-time service health monitoring
- Pulsing heartbeat animation (green = healthy, red = issues)
- Detailed health information on hover
- Auto-refresh every 30 seconds

## Maintenance

When adding new files:

- **HTML pages** → Place in `pages/` directory
- **CSS files** → Place in `css/` directory
- **JavaScript files** → Place in `js/` directory
- **Images/fonts** → Place in `assets/` directory

Update this README when adding new files or changing the structure.
