import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  APP_URL: z.url().default("http://localhost:5173"),
  APP_URLS: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must have at least 8 characters"),
  ASAAS_BASE_URL: z.url(),
  ASAAS_API_KEY: z.string().optional(),
  ASAAS_WEBHOOK_TOKEN: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formattedIssues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${formattedIssues}`);
}

export const env = parsedEnv.data;

export const allowedAppUrls = env.APP_URLS
  ? env.APP_URLS.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  : [env.APP_URL];

export const envFlags = {
  hasDatabaseUrl: Boolean(env.DATABASE_URL),
  hasSupabaseUrl: Boolean(env.SUPABASE_URL),
  hasSupabaseAnonKey: Boolean(env.SUPABASE_ANON_KEY),
  hasSupabaseServiceRoleKey: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
  hasAsaasApiKey: Boolean(env.ASAAS_API_KEY),
  hasAsaasWebhookToken: Boolean(env.ASAAS_WEBHOOK_TOKEN),
  hasTelegramBotToken: Boolean(env.TELEGRAM_BOT_TOKEN),
  hasTelegramWebhookSecret: Boolean(env.TELEGRAM_WEBHOOK_SECRET)
};

export function isProduction() {
  return env.NODE_ENV === "production";
}
