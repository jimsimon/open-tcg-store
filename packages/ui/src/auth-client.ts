import { createAuthClient } from "better-auth/client";
import { adminClient, anonymousClient } from "better-auth/client/plugins";
import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  inventory: ["create", "read", "update", "delete"],
} as const;

const ac = createAccessControl(statement);

const adminRole = ac.newRole({
  inventory: ["create", "read", "update", "delete"],
});

const employeeRole = ac.newRole({
  inventory: ["create", "read", "update", "delete"],
});

const roles = {
  admin: adminRole,
  employee: employeeRole,
};

export const authClient = createAuthClient({
  baseURL: "http://localhost:5174",
  plugins: [
    adminClient({
      ac,
      roles,
    }),
    anonymousClient(),
  ],
});
