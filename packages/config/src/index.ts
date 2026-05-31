import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({
    path: path.resolve(__dirname, "../../../.env"),
});

const envSchema = z.object(
    {
        PORT: z.string().default("3000"),
        DATABASE_URL: z.string(),
        REDIS_HOST: z.string().default("localhost"),
        REDIS_PORT: z.string().default("6379"),

    }
);

const env = envSchema.parse(process.env);

export const config = {
    port: Number(env.PORT),
    databaseUrl: env.DATABASE_URL,

    redis: {
        host: env.REDIS_HOST,
        port: Number(env.REDIS_PORT)
    },
}