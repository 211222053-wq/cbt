import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("file:ryuexam.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default("RyuExam CBT"),
  SESSION_COOKIE_NAME: z.string().default("ryuexam_session"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(12),
  RATE_LIMIT_WINDOW_SEC: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(8),
});

export const env = envSchema.parse(process.env);
