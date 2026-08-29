import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Ensure root and environment DATABASE_URL is always loaded
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
