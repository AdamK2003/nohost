import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "turso",
  dbCredentials: {
    url: "file:./cohost.db",
  },
});
