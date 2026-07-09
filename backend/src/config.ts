import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function list(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  googleClientId: required('GOOGLE_CLIENT_ID'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  allowedEmailDomains: list('ALLOWED_EMAIL_DOMAINS'),
  adminEmails: list('ADMIN_EMAILS'),
  // OneSignal push (optional — if unset, push is skipped and the app still runs).
  // App ID is the UUID from the OneSignal dashboard; key is the REST API Key.
  oneSignalAppId: process.env.ONESIGNAL_APP_ID ?? '',
  oneSignalApiKey: process.env.ONESIGNAL_KEY ?? '',
  // SMTP for outgoing email (optional — if host/user/pass unset, email is skipped).
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: (process.env.SMTP_SECURE ?? 'false') === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    // Address the email is sent "from"; falls back to SMTP_USER.
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '',
  },
  // Base URL of the web app, used to build links inside emails.
  webAppUrl: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim(),
  // Teamwork integration (optional). `domain` is the site host (e.g. acme.teamwork.com);
  // `apiToken` is a Teamwork API key. If unset, the task-autofill endpoint returns 503.
  teamwork: {
    // Accept a full URL or bare host; store the bare host (no protocol/trailing slash).
    domain: (process.env.TEAMWORK_DOMAIN ?? '')
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .trim(),
    apiToken: process.env.TEAMWORK_API_TOKEN ?? '',
  },
};

export function isAllowedEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return config.allowedEmailDomains.includes(domain);
}

export function isAdminEmail(email: string): boolean {
  return config.adminEmails.includes(email.toLowerCase());
}
