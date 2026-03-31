import { count, or, eq, isNull } from "drizzle-orm";
import { otcgs } from "../../../../db";
import type { QueryResolvers } from "../../../types.generated";
import { user } from "../../../../db/otcgs/schema";
export const isSetupPending: NonNullable<QueryResolvers["isSetupPending"]> = async (_parent, _arg, _ctx) => {
  // Exclude anonymous users from the count — anonymous users are auto-created
  // by the session middleware and should not prevent first-time setup
  const [{ count: userCount }] = await otcgs
    .select({ count: count() })
    .from(user)
    .where(or(eq(user.isAnonymous, false), isNull(user.isAnonymous)));
  return userCount === 0;
};
