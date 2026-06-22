import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({
    path: path.resolve(__dirname, "../../../.env"),
});

const envSchema = z.object(
    {
        NODE_ENV: z.enum([
           "development",
           "test",
           "production",
        ]).default("development"),
        PORT: z.coerce.number().int().min(1).max(65535).default(3000),
        DATABASE_URL: z.url(),
        REDIS_HOST: z.string().default("localhost"),
        REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),

    }
);

const env = envSchema.parse(process.env);

export const config = {
    environment: env.NODE_ENV,
    port: Number(env.PORT),
    databaseUrl: env.DATABASE_URL,

    redis: {
        host: env.REDIS_HOST,
        port: Number(env.REDIS_PORT)
    },
}