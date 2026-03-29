import type { MutationResolvers } from "../../../types.generated.ts";
import { auth } from "../../../../auth.ts";
import { eq } from "drizzle-orm";
import { otcgs } from "../../../../db/index.ts";
import { user as userTable } from "../../../../db/otcgs/schema.ts";

export const firstTimeSetup: NonNullable<MutationResolvers["firstTimeSetup"]> = async (
  _parent,
  { userDetails },
  _ctx,
) => {
  let createdUserId: string | undefined;

  try {
    const { user } = await auth.api.signUpEmail({
      body: {
        email: userDetails.email,
        password: userDetails.password,
        name: userDetails.firstName,
      },
    });
    createdUserId = user.id;

    // Directly update the role in the database since no admin exists yet
    // to authorize the setRole API call during first-time setup
    await otcgs.update(userTable).set({ role: "admin" }).where(eq(userTable.id, user.id));

    console.log("Initial admin user has been created successfully.");
    return user.id;
  } catch (error) {
    // If the user was created but the role update failed, clean up the
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
