import type { MutationResolvers } from "./../../../types.generated";
import { eq } from "drizzle-orm";
import { authClient } from "../../../../auth-client.ts";
import { user } from "../../../../db/auth-schema.ts";
import { db } from "../../../../db/index.ts";

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
    const { affectedRows } = await db
      .update(user)
      .set({
        role: "admin",
      })
      .where(eq(user.id, data?.user.id));
    if (affectedRows === 1) {
      console.log("Default admin user has been created successfully.");
      return data.user.id;
    }
    throw new Error("Failed to set the admin role for the default Admin user.");
  }

  throw new Error(
    "An unknown error occurred when attempting to complete the first time setup.",
  );
};
