// utils/buildHtmlFromPdfDocumentBundle.js
// Builds a full HTML document from pdfDocumentBundle, with validation & sane fallbacks.

function htmlEscape(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMetaTags(meta = []) {
  if (!Array.isArray(meta)) return "";
  return meta
    .map((m) => {
      const attrs = Object.entries(m || {})
        .filter(([, v]) => v != null && v !== "")
        .map(([k, v]) => {
          const name = k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
          const val = String(v).replace(/"/g, "&quot;");
          return `${name}="${val}"`;
        })
        .join(" ");
      return attrs ? `<meta ${attrs} />` : "";
    })
    .join("");
}

function buildStyleTags(styles = []) {
  if (!Array.isArray(styles)) return "";
  return styles
    .map((s) => {
      if (!s || typeof s !== "object") return "";
      if (s.type === "inline" && typeof s.content === "string") {
        return `<style>${s.content}</style>`;
      }
      if (s.type === "src" && typeof s.url === "string" && s.url.trim()) {
        return `<link rel="stylesheet" href="${s.url}" />`;
      }
      return "";
    })
    .join("");
}

function buildScriptTags(scripts = []) {
  if (!Array.isArray(scripts)) return "";
  return scripts
    .map((s) => {
      if (!s || typeof s !== "object") return "";
      if (s.type === "inline" && typeof s.content === "string") {
        return `<script>${s.content}</script>`;
      }
      if (s.type === "src" && typeof s.url === "string" && s.url.trim()) {
        return `<script src="${s.url}"></script>`;
      }
      return "";
    })
    .join("");
}

function buildErrorHtml(message) {
  const safe = htmlEscape(message);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>PDF Error</title>
  <style>
    html, body { height: 100%; margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; }
    .page { width: 210mm; height: 297mm; padding: 20mm; box-sizing: border-box; }
    h1 { color: #b91c1c; margin: 0 0 12px; }
    p { line-height: 1.5; color: #374151; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
    @page { size: A5; margin: 0; }
  </style>
</head>
<body>
  <section class="page">
    <h1>Something went wrong</h1>
    <p>Please contact us via our online chat, report the issue and we may be able to provide you with a policy certificate manually.</p>
    <p><strong>Detail:</strong> <code>${safe}</code></p>
  </section>
</body>
</html>`;
}

/* ---------- helpers for layout ---------- */
function sanitizeCssColor(v, fallback = "#000") {
  const s = (v == null ? "" : String(v)).trim();
  if (!s) return fallback;
  return s.replace(/;+\s*$/, "");
}

function cssForLayout(layout = {}) {
  const page = layout.page || {};
  const size = page.size || "A4";

  // Map common sizes
  let width, height;
  if (typeof size === "object") {
    width = size.width || "210mm";
    height = size.height || "297mm";
  } else {
    switch (String(size).toUpperCase()) {
      case "A4":
        width = "210mm";
        height = "297mm";
        break;
      case "LETTER":
        width = "8.5in";
        height = "11in";
        break;
      case "LEGAL":
        width = "8.5in";
        height = "14in";
        break;
      default:
        width = "210mm";
        height = "297mm";
    }
  }

  const headerH = page.headerHeight || "20mm";
  const footerH = page.footerHeight || "14mm";

  const sf = layout.safeFrame || {};
  const sfEnabled = sf.enabled !== false; // default true
  const sfStroke = sf.stroke || "1px";
  const sfColor = sf.color || "#000";
  const sfTop = sf.topOffset || "0";
  const sfBottom = sf.bottomOffset || "0";
  // NEW: left/right offsets
  const sfLeft = sf.leftOffset || "0";
  const sfRight = sf.rightOffset || "0";

  return `
<style id="insure-layout">
:root{
  --page-width: ${width};
  --page-height: ${height};
  --header-h: ${headerH};
  --footer-h: ${footerH};

  --pad-v: 5mm;
  --pad-h: 10mm;

  /* Safe frame vars */
  --frame-stroke: ${sfStroke};
  --frame-color: ${sfColor};
  --safe-top-offset: ${sfTop};
  --safe-bottom-offset: ${sfBottom};
  --safe-left-offset: ${sfLeft};
  --safe-right-offset: ${sfRight};
}

html,body{margin:0;padding:0;background:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial,"Noto Sans";}
.document{background:#fff;}
.page{
  width:var(--page-width);
  height:var(--page-height);
  margin:0 auto;
  position:relative;
  overflow:hidden;
  page-break-after:always;
  background:#fff;
}
.page:last-child{page-break-after:auto;}

header{
  height:var(--header-h);
  padding:0 var(--pad-h);
  display:flex;align-items:center;justify-content:space-between;
  border-bottom:1px solid #e5e7eb;box-sizing:border-box;
}
/* Override header height for pages with custom heights */
.page[data-header-height] header {
  height: var(--page-header-height, var(--header-h)) !important;
}
footer{
  height:var(--footer-h);
  padding:0 var(--pad-h);
  display:flex;align-items:center;justify-content:space-between;
  color:#6b7280;font-size:10px;border-top:1px solid #e5e7eb;
  position:absolute;left:0;right:0;bottom:0;box-sizing:border-box;
}
/* Override footer height for pages with custom heights */
.page[data-footer-height] footer {
  height: var(--page-footer-height, var(--footer-h)) !important;
}

/* Header utility classes */
.hdr{
  height: var(--header-h);
  padding: 5px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0;
  width: 100%;
  overflow: hidden;
}
.hdr[data-align="left"]   { justify-content: flex-start; }
.hdr[data-align="center"] { justify-content: center; }
.hdr[data-align="right"]  { justify-content: flex-end; }
.hdr[data-mode="edges"]  { justify-content: space-between; }
.hdr[data-mode="spread"] { justify-content: space-evenly; }
.hdr[data-equalize="true"] > .slot { flex: 1 1 0; }

.hdr > .slot{
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}
.hdr > .slot img,
.hdr > .slot svg{
  display: block;
  max-height: calc(var(--header-h) - 10px);
  width: auto;
  max-width: 100%;
  object-fit: contain;
}
.hdr > .slot.text{
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Footer utility classes */
.ftr{
  height: var(--footer-h);
  padding: 5px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.ftr[data-align="left"]   { justify-content: flex-start; }
.ftr[data-align="center"] { justify-content: center; }
.ftr[data-align="right"]  { justify-content: flex-end; }
.ftr > .slot{
  display: flex;
  align-items: center;
  min-width: 0;
}
.ftr > .slot.text{
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Fix logo sizing for pages with custom header heights */
.page[data-header-height] .hdr {
  height: var(--page-header-height, var(--header-h)) !important;
}
.page[data-header-height] .hdr > .slot img,
.page[data-header-height] .hdr > .slot svg {
  max-height: calc(var(--page-header-height, var(--header-h)) - 10px) !important;
}

/* Fix footer sizing for pages with custom footer heights */
.page[data-footer-height] .ftr {
  height: var(--page-footer-height, var(--footer-h)) !important;
}

/* Body fills between header/footer */
main.body{
  position:absolute;left:0;right:0;
  top:var(--header-h);bottom:var(--footer-h);
  padding:var(--pad-v) var(--pad-h);
  box-sizing:border-box;overflow:hidden;
}

/* Pages with no header should start from top */
.page.no-header main.body {
  top: 0 !important;
}

/* Pages with no footer should extend to bottom */
.page.no-footer main.body {
  bottom: 0 !important;
}

/* Visible safe frame (inset outline that doesn't change layout) */
${
  sfEnabled
    ? `
main.body::before{
  content:"";
  position:absolute;
  left:var(--safe-left-offset);
  right:var(--safe-right-offset);
  top:var(--safe-top-offset);
  bottom:var(--safe-bottom-offset);
  box-shadow: inset 0 0 0 var(--frame-stroke) var(--frame-color);
  pointer-events:none;
  box-sizing:border-box;
  z-index:2;
}`
    : ""
}

.page.no-header > header,
.page.no-footer > footer{ visibility:hidden; }

.flow{ padding-bottom:3mm; }
.flow > *{ break-inside: avoid; }
.forcePageEnd{ page-break-after:always; break-after:page; }

@media print{
  @page{ size: ${width} ${height}; margin:0; }
  body{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page{ box-shadow:none; margin:0; }
}
</style>`;
}

function paginatorScript() {
  return `<script id="insure-paginator">
window.addEventListener('load', () => {
  const BUFFER = 2;

  // Apply page-specific header/footer heights
  function applyPageSpecificHeights() {
    document.querySelectorAll('.page').forEach(page => {
      const headerHeight = page.getAttribute('data-header-height');
      const footerHeight = page.getAttribute('data-footer-height');
      const hasNoHeader = page.classList.contains('no-header');
      const hasNoFooter = page.classList.contains('no-footer');
      
      // Handle header
      if (hasNoHeader) {
        // Page has Display Header: false, so header height should be 0
        const body = page.querySelector('main.body');
        if (body) {
          body.style.top = '0';
          body.style.setProperty('top', '0', 'important');
        }
      } else if (headerHeight) {
        // Page has custom header height
        const header = page.querySelector('header');
        const body = page.querySelector('main.body');
        if (header) {
          header.style.height = headerHeight;
          // Set CSS custom property for the page
          page.style.setProperty('--page-header-height', headerHeight);
        }
        if (body) {
          body.style.top = headerHeight;
        }
      }
      
      // Handle footer
      if (hasNoFooter) {
        // Page has Display Footer: false, so footer height should be 0
        const body = page.querySelector('main.body');
        if (body) {
          body.style.bottom = '0';
          body.style.setProperty('bottom', '0', 'important');
        }
      } else if (footerHeight) {
        // Page has custom footer height
        const footer = page.querySelector('footer');
        const body = page.querySelector('main.body');
        if (footer) {
          footer.style.height = footerHeight;
          // Set CSS custom property for the page
          page.style.setProperty('--page-footer-height', footerHeight);
        }
        if (body) {
          body.style.bottom = footerHeight;
        }
      }
    });
  }

  function ensureFlow(page){
    const body = page.querySelector('main.body');
    let flow = body.querySelector(':scope > .flow');
    if(!flow){
      flow = document.createElement('div');
      flow.className = 'flow';
      const kids = Array.from(body.childNodes);
      body.innerHTML = '';
      kids.forEach(k => flow.appendChild(k));
      body.appendChild(flow);
    }
    return { page, body, flow };
  }

  function makePageAfter(prevPage){
    const clone = prevPage.cloneNode(true);
    const cBody = clone.querySelector('main.body');
    cBody.innerHTML = '';
    const cFlow = document.createElement('div'); cFlow.className = 'flow';
    cBody.appendChild(cFlow);
    prevPage.parentNode.insertBefore(clone, prevPage.nextSibling);
    
    // Apply page-specific heights to the new page
    const headerHeight = prevPage.getAttribute('data-header-height');
    const footerHeight = prevPage.getAttribute('data-footer-height');
    const hasNoHeader = prevPage.classList.contains('no-header');
    const hasNoFooter = prevPage.classList.contains('no-footer');
    
    if (hasNoHeader) {
      clone.classList.add('no-header');
      const body = clone.querySelector('main.body');
      if (body) body.style.top = '0';
    } else if (headerHeight) {
      clone.setAttribute('data-header-height', headerHeight);
      const header = clone.querySelector('header');
      const body = clone.querySelector('main.body');
      if (header) {
        header.style.height = headerHeight;
        // Set CSS custom property for the cloned page
        clone.style.setProperty('--page-header-height', headerHeight);
      }
      if (body) body.style.top = headerHeight;
    }
    
    if (hasNoFooter) {
      clone.classList.add('no-footer');
      const body = clone.querySelector('main.body');
      if (body) body.style.bottom = '0';
    } else if (footerHeight) {
      clone.setAttribute('data-footer-height', footerHeight);
      const footer = clone.querySelector('footer');
      const body = clone.querySelector('main.body');
      if (footer) {
        footer.style.height = footerHeight;
        // Set CSS custom property for the cloned page
        clone.style.setProperty('--page-footer-height', footerHeight);
      }
      if (body) body.style.bottom = footerHeight;
    }
    
    return { page: clone, body: cBody, flow: cFlow };
  }

  function paginatePage(original){
    const { body, flow } = ensureFlow(original);
    const items = Array.from(flow.children);
    flow.innerHTML = '';

    const pages = [];
    let cur = { page: original, body, flow };
    pages.push(cur.page);

    const rootCS = getComputedStyle(document.documentElement);
    const safeBottomOffset = parseFloat(rootCS.getPropertyValue('--safe-bottom-offset')) || 0;

    for(const el of items){
      if(el.classList && el.classList.contains('forcePageEnd')){
        if(cur.flow.childElementCount > 0){
          cur = makePageAfter(cur.page);
          pages.push(cur.page);
        }
        continue;
      }

      cur.flow.appendChild(el);

      const elRect = el.getBoundingClientRect();
      const bodyRect = cur.body.getBoundingClientRect();
      const bodyCS = getComputedStyle(cur.body);
      const padBottom = parseFloat(bodyCS.paddingBottom) || 0;

      // Allow content down to the inside edge of the padding minus safe offset
      const safeBottom = bodyRect.bottom - padBottom - safeBottomOffset;

      if(elRect.bottom > safeBottom - BUFFER){
        cur.flow.removeChild(el);
        const next = makePageAfter(cur.page);
        pages.push(next.page);
        next.flow.appendChild(el);
        cur = next;
      }
    }
    return pages;
  }

  // Apply page-specific heights first
  applyPageSpecificHeights();

  const originals = Array.from(document.querySelectorAll('.page'));
  let allPages = [];
  for(const pg of originals){
    const created = paginatePage(pg);
    allPages = allPages.concat(created);
  }

  // optional page numbering
  const total = allPages.length;
  allPages.forEach((pg, i) => {
    const cur = pg.querySelector('.footer .pagecount .current');
    const tot = pg.querySelector('.footer .pagecount .total');
    if(cur) cur.textContent = String(i + 1);
    if(tot) tot.textContent = String(total);
  });
});
</script>`;
}

function buildPageSectionAttrs(section = {}, options = {}, pageData = {}) {
  const cls = section?.class ? String(section.class) : "";
  const extra = [];
  if (options && options.showHeader === false) extra.push("no-header");
  if (options && options.showFooter === false) extra.push("no-footer");

  const finalClass = [cls, ...extra].filter(Boolean).join(" ").trim();
  const clsAttr = finalClass
    ? ` class="${finalClass.replace(/"/g, "&quot;")}"`
    : "";

  const dt =
    section?.dataTitle != null
      ? ` data-title="${String(section.dataTitle).replace(/"/g, "&quot;")}"`
      : "";

  // Add page-specific height data attributes
  const heightAttrs = [];
  if (pageData.headerHeight) {
    const headerHeight = String(pageData.headerHeight).trim();
    const formattedHeight = /^\d+(\.\d+)?$/.test(headerHeight)
      ? `${headerHeight}mm`
      : headerHeight;
    heightAttrs.push(
      ` data-header-height="${formattedHeight.replace(/"/g, "&quot;")}"`
    );
  }
  if (pageData.footerHeight) {
    const footerHeight = String(pageData.footerHeight).trim();
    const formattedHeight = /^\d+(\.\d+)?$/.test(footerHeight)
      ? `${footerHeight}mm`
      : footerHeight;
    heightAttrs.push(
      ` data-footer-height="${formattedHeight.replace(/"/g, "&quot;")}"`
    );
  }

  return `${clsAttr}${dt}${heightAttrs.join("")}`;
}

function normalizeBundle(b) {
  if (!b || typeof b !== "object")
    throw new Error("pdfDocumentBundle must be an object.");

  const head = b.head ?? {};
  const body = b.body ?? {};
  const scripts = Array.isArray(b.scripts) ? b.scripts : [];
  const header = typeof b.header === "string" ? b.header : "";
  const footer = typeof b.footer === "string" ? b.footer : "";
  const layout = b.layout || {}; // NEW
  const security = b.security || {}; // NEW

  if (!head.title) throw new Error("head.title is required");
  if (!Array.isArray(head.meta)) head.meta = [];
  if (!Array.isArray(head.styles)) head.styles = [];
  if (!Array.isArray(body.pages))
    throw new Error("body.pages must be an array");

  return {
    head,
    layout,
    security,
    body: { document: body.document ?? {}, pages: body.pages },
    header,
    footer,
    scripts,
  };
}

let createDOMPurify = null,
  JSDOM = null,
  sanitizeHtml = null;
try {
  JSDOM = require("jsdom").JSDOM;
  createDOMPurify = require("dompurify");
} catch {
  /* optional; ignore if not installed */
}
try {
  sanitizeHtml = require("sanitize-html");
} catch {
  /* optional; ignore if not installed */
}

function maybeSanitize(html, security) {
  if (!html || !security || security.sanitizeHtml !== true) return html;
  try {
    if (JSDOM && createDOMPurify) {
      const { window } = new JSDOM("");
      const DOMPurify = createDOMPurify(window);
      return DOMPurify.sanitize(html, { WHOLE_DOCUMENT: false });
    }
    if (sanitizeHtml) {
      return sanitizeHtml(html, {
        allowedTags: false,
        allowedAttributes: false,
      });
    }
    return html; // pass-through if no sanitizer available
  } catch {
    return html; // never block output
  }
}

function buildHtmlFromPdfDocumentBundle(pdfDocumentBundle) {
  const normalized = normalizeBundle(pdfDocumentBundle);
  const {
    head,
    body,
    header: globalHeader,
    footer: globalFooter,
    scripts,
    layout,
    security,
  } = normalized;

  const title = head.title ? `<title>${htmlEscape(head.title)}</title>` : "";
  const meta = buildMetaTags(head.meta);

  // 1) Inject our base layout CSS first (user styles can override specifics)
  const layoutCss = cssForLayout(layout);

  // 2) User styles
  const styles = buildStyleTags(head.styles);

  // 3) Built-in paginator if requested (default: enabled)
  const scriptBase =
    layout && layout.useBuiltInPaginator !== false ? paginatorScript() : "";

  // 4) User scripts (filter out old paginator scripts if we're using built-in paginator)
  const filteredScripts =
    layout && layout.useBuiltInPaginator !== false
      ? scripts.filter((s) => {
          if (s.type === "inline" && typeof s.content === "string") {
            // Remove old paginator scripts that don't have applyPageSpecificHeights
            const hasLoadListener = s.content.includes(
              "window.addEventListener('load'"
            );
            const hasApplyHeights = s.content.includes(
              "applyPageSpecificHeights"
            );
            const hasPaginateFunction =
              s.content.includes("function paginate(");

            // Keep scripts that don't have load listeners, or have applyPageSpecificHeights
            // Also remove scripts that have old paginate function without applyPageSpecificHeights
            if (hasLoadListener && !hasApplyHeights && hasPaginateFunction) {
              return false; // Remove old paginator scripts
            }
            return true;
          }
          return true;
        })
      : scripts;
  const scriptTags = buildScriptTags(filteredScripts);

  const docClass = body.document?.class
    ? ` class="${String(body.document.class).replace(/"/g, "&quot;")}"`
    : "";

  const pages = (body.pages || []).filter(
    (p) => p && typeof p.body === "string" && p.body.trim().length > 0
  );
  if (!pages.length) {
    throw new Error("No valid pages to render (all pages missing body).");
  }

  const pagesHtml = pages
    .map((p) => {
      const secAttrs = buildPageSectionAttrs(
        p.section || {},
        p.options || {},
        p
      );

      // precedence: page.header/footer -> global -> empty (if show* true)
      const wantHeader = p.options?.showHeader !== false;
      const wantFooter = p.options?.showFooter !== false;

      const headerHtml = !wantHeader
        ? "" // No header element at all when showHeader is false
        : typeof p.header === "string" && p.header.trim()
        ? p.header
        : globalHeader && globalHeader.trim()
        ? globalHeader
        : `<header></header>`;

      const footerHtml = !wantFooter
        ? "" // No footer element at all when showFooter is false
        : typeof p.footer === "string" && p.footer.trim()
        ? p.footer
        : globalFooter && globalFooter.trim()
        ? globalFooter
        : `<footer></footer>`;

      const bodyHtml =
        /<main\b[^>]*class=["'][^"']*\bbody\b[^"']*["'][^>]*>/i.test(p.body)
          ? p.body
          : `<main class="body">${p.body}</main>`;

      // Optional sanitize (non-blocking)
      const safeHeader = maybeSanitize(headerHtml, security);
      const safeFooter = maybeSanitize(footerHtml, security);
      const safeBody = maybeSanitize(bodyHtml, security);

      return `<section${secAttrs}>${safeHeader}${safeBody}${safeFooter}</section>`;
    })
    .join("");

  return [
    "<!DOCTYPE html>",
    `<html lang="en">`,
    "<head>",
    `<meta charset="utf-8" />`,
    `<meta name="viewport" content="width=device-width,initial-scale=1" />`,
    title,
    meta,
    layoutCss, // our base A4 + paddings + safe frame + flags
    styles, // user's styles (can override)
    "</head>",
    `<body><div${docClass}>${pagesHtml}</div>${scriptBase}${scriptTags}</body>`,
    "</html>",
  ].join("");
}

module.exports = { buildHtmlFromPdfDocumentBundle, buildErrorHtml };
