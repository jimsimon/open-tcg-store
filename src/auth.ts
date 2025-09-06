import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { otcgs } from "./db";
import * as schema from "./db/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(otcgs, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [admin()],
});
