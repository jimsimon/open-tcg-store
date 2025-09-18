import { createAuthClient } from "better-auth/client";
import { adminClient, anonymousClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "http://localhost:5174",
  plugins: [adminClient(), anonymousClient()]
});
