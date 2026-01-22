import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    PORT: z.string().transform(Number).default('3001'),

    // MongoDB
    MONGODB_URI: z.string().url().default('mongodb://localhost:27017/iot_monitor'),
    MONGODB_DB_NAME: z.string().default('iot_monitor'),

    // JWT
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    // CORS
    CORS_ORIGIN: z.string().default('http://localhost:3000'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

    // Export Settings
    EXPORT_MAX_RECORDS: z.string().transform(Number).default('100000'),
    EXPORT_SIGNED_URL_EXPIRES: z.string().transform(Number).default('3600'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;
