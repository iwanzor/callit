import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST || "46.101.215.137",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USERNAME || "callit",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "callit",
  },
});
