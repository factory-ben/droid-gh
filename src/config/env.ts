import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  GITHUB_APP_ID: z.string().min(1, "GITHUB_APP_ID is required"),
  GITHUB_PRIVATE_KEY: z
    .string()
    .min(1, "GITHUB_PRIVATE_KEY is required")
    .transform((value) => value.replace(/\\n/g, "\n")),
  GITHUB_WEBHOOK_SECRET: z.string().min(1, "GITHUB_WEBHOOK_SECRET is required"),
  FACTORY_API_KEY: z.string().optional(),
  FACTORY_BASE_URL: z.string().url().default("https://app.factory.ai"),
  FACTORY_WORKFLOW_ID: z.string().optional()
});

export type AppConfig = z.infer<typeof envSchema>;

export const appConfig: AppConfig = envSchema.parse(process.env);

export const port = appConfig.PORT;
