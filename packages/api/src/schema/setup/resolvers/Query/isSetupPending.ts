import { count } from "drizzle-orm";
import { otcgs } from "../../../../db";
import type { QueryResolvers } from "../../../types.generated";
import { user } from "../../../../db/otcgs/schema";
export const isSetupPending: NonNullable<QueryResolvers["isSetupPending"]> = async (_parent, _arg, _ctx) => {
  const [{ count: userCount }] = await otcgs.select({ count: count() }).from(user);
  return userCount === 0;
};
