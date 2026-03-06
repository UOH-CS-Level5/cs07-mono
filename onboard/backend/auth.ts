import { fileURLToPath } from "node:url";
import { Database } from "bun:sqlite";
import { betterAuth } from "better-auth";

const databasePath = fileURLToPath(new URL("./data/app.sqlite", import.meta.url));

export const auth = betterAuth({
  secret: Bun.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-dev-secret-change-me",
  baseURL: Bun.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: new Database(databasePath, { create: true }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    "http://localhost:5173",
    "capacitor://localhost",
    "http://localhost",
  ],
});
