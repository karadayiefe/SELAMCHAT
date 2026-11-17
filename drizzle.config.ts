import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.TIDB_HOST!,
    port: Number(process.env.TIDB_PORT),
    user: process.env.TIDB_USER!,
    password: process.env.TIDB_PASSWORD!,
    database: process.env.TIDB_DATABASE!,
    ssl: {
      minVersion: "TLSv1.2",
    },
  },
});
