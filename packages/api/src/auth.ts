import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAccessControl } from "better-auth/plugins/access";
import { admin, anonymous } from "better-auth/plugins";
import { otcgs } from "./db";
import * as schema from "./db/otcgs/schema";

const statement = {
  inventory: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

const adminRole = ac.newRole({
  inventory: ["create", "read", "update", "delete"],
});

const employeeRole = ac.newRole({
  inventory: ["create", "read", "update", "delete"],
});

export const roles = {
  admin: adminRole,
  employee: employeeRole,
};

export const auth = betterAuth({
  database: drizzleAdapter(otcgs, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      ac,
      roles,
    }),
    anonymous(),
  ],
});
