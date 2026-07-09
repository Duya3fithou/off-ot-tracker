import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config';

/**
 * SMTP email transport. Configured via SMTP_* env vars (see .env.example).
 * Like the push sender, this is fire-and-forget: it never throws, so an email
 * failure can't break the request that triggered it.
 */

let transporter: Transporter | null = null;

function isConfigured(): boolean {
  const { host, user, pass } = config.smtp;
  return Boolean(host && user && pass);
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
}

interface Mail {
  to: string[];
  subject: string;
  text: string;
  html?: string;
}

/** Send an email. Returns silently (logging) if SMTP isn't configured or send fails. */
export async function sendMail(mail: Mail): Promise<void> {
  const recipients = [...new Set(mail.to)].filter(Boolean);
  if (recipients.length === 0) return;
  if (!isConfigured()) {
    console.warn('[email] SMTP not configured (SMTP_HOST / SMTP_USER / SMTP_PASS) — skipping');
    return;
  }
  try {
    await getTransporter().sendMail({
      from: config.smtp.from,
      to: recipients.join(', '),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  } catch (err) {
    console.error('[email] Failed to send:', err);
  }
}
