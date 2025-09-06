import type { MutationResolvers } from "./../../../types.generated";
import { eq } from "drizzle-orm";
import { authClient } from "../../../../auth-client.ts";
import { user } from "../../../../db/auth-schema.ts";
import { otcgs } from "../../../../db/index.ts";

export const firstTimeSetup: NonNullable<MutationResolvers['firstTimeSetup']> = async (_parent, { userDetails }, _ctx) => {
  const { data, error } = await authClient.signUp.email({
    email: userDetails.email,
    password: userDetails.password,
    name: userDetails.firstName,
  });

  if (error) {
    throw error;
  }

  if (data) {
    const { rowsAffected } = await otcgs
      .update(user)
      .set({
        role: "admin",
      })
      .where(eq(user.id, data?.user.id));
    if (rowsAffected === 1) {
      console.log("Initial admin user has been created successfully.");
      return data.user.id;
    }
    throw new Error("Failed to set the admin role for the initial Admin user.");
  }

  throw new Error(
    "An unknown error occurred when attempting to complete the first time setup.",
  );
};
