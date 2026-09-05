import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  // ── Email / Brevo SMTP ─────────────────────────────────────────────────────
  // All four are REQUIRED — the app will refuse to start without them, which
  // surfaces misconfiguration immediately rather than on the first email attempt.
  EMAIL_SMTP_HOST: z.string().min(1),
  EMAIL_SMTP_PORT: z.coerce.number().int().positive().default(587),
  EMAIL_SMTP_USER: z.string().min(1),
  EMAIL_SMTP_PASS: z.string().min(1),
  EMAIL_FROM_ADDRESS: z.string().email(),
  EMAIL_FROM_NAME: z.string().default('PeoplePay360'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌  Invalid environment — fix the following before starting the server:');
  const errors = parsed.error.flatten().fieldErrors;
  for (const [field, messages] of Object.entries(errors)) {
    console.error(`    ${field}: ${messages.join(', ')}`);
  }
  process.exit(1);
}

const env = parsed.data;

export default {
  ...env,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  corsOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  cookieSecure: env.COOKIE_SECURE === 'true',
};

