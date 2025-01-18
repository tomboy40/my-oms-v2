import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  SESSION_SECRET: z.string(),
  DLAS_API_URL: z.string(),
  DLAS_EVT_URL: z.string(),
  ODS_API_URL: z.string()
});

let env: z.infer<typeof envSchema>;

try {
  const parsed = envSchema.parse(process.env);
  env = parsed;
} catch (error) {
  if (error instanceof z.ZodError) {
    throw new Error(
      `❌ Invalid environment variables: ${error.errors.map((e) => e.message).join(', ')}`
    );
  }
  throw error;
}

export { env }; 