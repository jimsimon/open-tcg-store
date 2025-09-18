import type { MutationResolvers } from "../../../types.generated.ts";
import { auth } from "../../../../auth.ts";
import { fromNodeHeaders } from "better-auth/node";
import { GraphqlContext } from "../../../../server.ts";

export const firstTimeSetup: NonNullable<MutationResolvers["firstTimeSetup"]> = async (
  _parent,
  { userDetails },
  ctx: GraphqlContext,
) => {
  const { user } = await auth.api.signUpEmail({
    body: {
      email: userDetails.email,
      password: userDetails.password,
      name: userDetails.firstName,
    },
  });

  await auth.api.setRole({
    body: {
      userId: user.id,
      role: "admin",
    },
    headers: fromNodeHeaders(ctx.req.headers),
  });

  console.log("Initial admin user has been created successfully.");
  return user.id;
};
