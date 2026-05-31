import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

const postgresPool  = new Pool({
	connectionString: DATABASE_URL,
});

const adapter = new PrismaPg(postgresPool);

export const prisma = new PrismaClient({
	adapter,
});