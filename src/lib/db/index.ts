import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Create the connection pool using individual env vars
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "callit",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create drizzle instance
export const db = drizzle(pool, { schema, mode: "default" });

// Export types
export type Database = typeof db;
export * from "./schema";
