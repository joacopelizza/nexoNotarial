import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  INITIAL_USERNAME: z.string().min(3),
  INITIAL_EMAIL: z.string().email(),
  INITIAL_PASSWORD: z.string().min(12),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(15),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().positive().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default(''),
  PUBLIC_APP_URL: z.string().url().default('http://localhost:5173'),
});

export const config = schema.parse(process.env);
export const mailConfigured = Boolean(
  config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASSWORD && config.SMTP_FROM,
);
