// utils/email.js
// Tiny Nodemailer wrapper for success/failure notifications.

const nodemailer = require("nodemailer");

function createTransport() {
  // Configure via env for safety
  // e.g. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE ("true"/"false")
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE = "true",
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT) {
    // No email configured; provide a noop transport-like object.
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === "true",
    auth:
      SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

async function sendEmail({ to, subject, text, from }) {
  const transport = createTransport();
  if (!transport) {
    console.warn("Email transport not configured. Skipping email send.");
    return { skipped: true };
  }
  const mailFrom = from || process.env.MAIL_FROM || "no-reply@example.co.uk";
  return transport.sendMail({ from: mailFrom, to, subject, text });
}

module.exports = { sendEmail };
