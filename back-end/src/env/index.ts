import z from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.string().default('3333'),
  JWT_SECRET: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  const err = z.treeifyError(_env.error).properties;
  console.error('Variáveis de ambiente inválidas:', err);
  throw new Error('Variáveis de ambiente inválidas');
}

export const env = _env.data;
