import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : undefined;
const host = process.env.TIDB_HOST ?? databaseUrl?.hostname;
const user = process.env.TIDB_USER ?? (databaseUrl ? decodeURIComponent(databaseUrl.username) : "");
const password = process.env.TIDB_PASSWORD ?? (databaseUrl ? decodeURIComponent(databaseUrl.password) : "");
const database =
  process.env.TIDB_DATABASE ??
  (databaseUrl ? decodeURIComponent(databaseUrl.pathname.replace(/^\//, "")) : "");

const migrationRequested = process.argv.some(argument => argument === "migrate");
if (migrationRequested && (!host || !user || !database)) {
  throw new Error("Database credentials are required to run Drizzle migrations.");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: host ?? "127.0.0.1",
    port: Number(process.env.TIDB_PORT || databaseUrl?.port || 3306),
    user,
    password,
    database,
    ssl: {
      minVersion: "TLSv1.2",
    },
  },
});
