import type { MutationResolvers } from "../../../types.generated.ts";
import { auth } from "../../../../auth.ts";
import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import { otcgs } from "../../../../db/index.ts";
import { user as userTable } from "../../../../db/otcgs/schema.ts";
import { GraphqlContext } from "../../../../server.ts";

export const firstTimeSetup: NonNullable<MutationResolvers["firstTimeSetup"]> = async (
  _parent,
  { userDetails },
  ctx: GraphqlContext,
) => {
  let createdUserId: string | undefined;

  try {
    // Use asResponse to get the Set-Cookie headers from the signup response,
    // which we forward to the browser so the user is automatically signed in.
    const signUpResponse = await auth.api.signUpEmail({
      body: {
        email: userDetails.email,
        password: userDetails.password,
        name: userDetails.firstName,
      },
      headers: fromNodeHeaders(ctx.req.headers),
      asResponse: true,
    });

    const signUpData = await signUpResponse.json();

    if (!signUpResponse.ok) {
      throw new Error(signUpData.message ?? "Failed to create user account");
    }

    createdUserId = signUpData.user?.id;

    if (!createdUserId) {
      throw new Error("Failed to create user account");
    }

    // Directly update the role in the database since no admin exists yet
    // to authorize the setRole API call during first-time setup
    await otcgs.update(userTable).set({ role: "admin" }).where(eq(userTable.id, createdUserId));

    // Forward Set-Cookie headers from the signup response to the browser
    const setCookies = signUpResponse.headers.getSetCookie();
    for (const cookie of setCookies) {
      ctx.res.append("Set-Cookie", cookie);
    }

    console.log("Initial admin user has been created successfully.");
    return createdUserId;
  } catch (error) {
    // If the user was created but a subsequent step failed, clean up the
    // partially created user so setup can be retried cleanly
    if (createdUserId) {
      try {
        await otcgs.delete(userTable).where(eq(userTable.id, createdUserId));
        console.log("Rolled back partially created user after setup failure.");
      } catch (cleanupError) {
        console.error("Failed to clean up user after setup failure:", cleanupError);
      }
    }

    const message = error instanceof Error ? error.message : "An unexpected error occurred during setup";
    console.error("First time setup failed:", message);
    throw new Error(message);
  }
};
