const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

/**
 * Initialize Nodemailer transporter.
 * Only creates transporter if SMTP credentials are configured.
 */
function initializeEmailService() {
  if (!config.email.host || !config.email.user) {
    logger.warn('⚠️  Email service not configured — emails will be logged to console');
    return;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  logger.info('✅ Email service configured');
}

/**
 * Send an email.
 * Falls back to console logging if transporter is not configured.
 *
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 */
async function sendEmail({ to, subject, html, text }) {
  if (!transporter) {
    // Fallback: log email to console (useful for development)
    logger.info('📧 Email (dev mode — not sent):', {
      to,
      subject,
      preview: html.substring(0, 200),
    });
    return;
  }

  const mailOptions = {
    from: config.email.from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text fallback
  };

  const info = await transporter.sendMail(mailOptions);
  logger.info('Email sent', { to, subject, messageId: info.messageId });
}

module.exports = {
  initializeEmailService,
  sendEmail,
};
