import nodemailer from 'nodemailer';
import env from '../configs/env.js';
import logger from './logger.js';

// ── Singleton transporter ──────────────────────────────────────────────────────
// Created once; reused for every send (keeps the TCP connection pool alive and
// avoids the overhead of re-establishing STARTTLS on every call).
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: env.EMAIL_SMTP_HOST,
    port: env.EMAIL_SMTP_PORT,
    secure: false, // port 587 uses STARTTLS (upgradeBeforeSend), not implicit TLS
    auth: {
      user: env.EMAIL_SMTP_USER,
      pass: env.EMAIL_SMTP_PASS,
    },
    // Brevo requires these on some plans; harmless on others
    tls: { rejectUnauthorized: true },
  });

  return _transporter;
}

/**
 * Call once at application boot (non-blocking — a transient network hiccup
 * will not crash startup, but a bad credential/unverified-sender config WILL
 * be logged loudly so it is caught immediately rather than on the first send).
 */
export async function verifyEmailConfig() {
  try {
    const transport = getTransporter();
    await transport.verify();
    logger.info('Email: SMTP connection verified OK', {
      host: env.EMAIL_SMTP_HOST,
      port: env.EMAIL_SMTP_PORT,
      user: env.EMAIL_SMTP_USER,
    });
  } catch (err) {
    // Log loudly but do not crash — the app remains functional; email simply fails.
    logger.error('Email: SMTP verification FAILED — check credentials / verified sender', {
      host: env.EMAIL_SMTP_HOST,
      port: env.EMAIL_SMTP_PORT,
      user: env.EMAIL_SMTP_USER,
      error: err.message,
    });
  }
}

/**
 * Shared send helper.  Always applies the configured from-address so no call
 * site needs to remember to set it.
 *
 * @param {import('nodemailer').SendMailOptions} options — standard nodemailer options (without `from`)
 * @returns {Promise<import('nodemailer').SentMessageInfo>}
 */
export async function sendMail(options) {
  const transporter = getTransporter();
  return transporter.sendMail({
    from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_ADDRESS}>`,
    ...options,
  });
}

/**
 * Convenience sleep used between bulk sends to respect Brevo's daily sending
 * limits on shared plans (free tier: 300/day, starter: varies).
 * Default: 300ms — keeps a 50-payslip batch well under 1 req/sec.
 *
 * @param {number} [ms=300]
 */
export function sleep(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Classify a nodemailer / SMTP error so the bulk-send summary can surface
 * actionable failure reasons instead of a raw error message.
 *
 * @param {Error} err
 * @returns {'RATE_LIMITED' | 'INVALID_ADDRESS' | 'AUTH_FAILED' | 'UNKNOWN'}
 */
export function classifySmtpError(err) {
  const msg = (err.message ?? '').toLowerCase();
  const code = (err.responseCode ?? err.code ?? '').toString();

  // Brevo returns 421 or 450 for rate limiting; also catches "too many" text
  if (['421', '450'].includes(code) || msg.includes('too many') || msg.includes('rate limit')) {
    return 'RATE_LIMITED';
  }
  // 550/553/554 — bad recipient / unverified sender
  if (['550', '551', '552', '553', '554'].includes(code) || msg.includes('invalid address') || msg.includes('no such user')) {
    return 'INVALID_ADDRESS';
  }
  // 535 — authentication failure
  if (code === '535' || msg.includes('authentication') || msg.includes('auth')) {
    return 'AUTH_FAILED';
  }
  return 'UNKNOWN';
}
