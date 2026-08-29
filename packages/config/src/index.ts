import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({
    path: path.resolve(__dirname, "../../../.env"),
});

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
    PISTON_URL: z.string().default("http://127.0.0.1:2000"),
    ADMIN_SECRET_KEY: z.string().min(6, "ADMIN_SECRET_KEY must be at least 6 characters"),
    ALLOWED_ORIGINS: z.string().default("http://localhost:5173,http://localhost:3000"),
});

const env = envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    PISTON_URL: process.env.PISTON_URL,
    ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY || (process.env.NODE_ENV === "production" ? undefined : "AF_DEV_SECRET_KEY"),
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
});

export const config = {
    environment: env.NODE_ENV,
    isProduction: env.NODE_ENV === "production",
    port: Number(env.PORT),
    databaseUrl: env.DATABASE_URL,
    pistonUrl: env.PISTON_URL,
    adminSecretKey: env.ADMIN_SECRET_KEY,
    allowedOrigins: env.ALLOWED_ORIGINS.split(",").map(o => o.trim()).filter(Boolean),
    redis: {
        host: env.REDIS_HOST,
        port: Number(env.REDIS_PORT),
    },
};
