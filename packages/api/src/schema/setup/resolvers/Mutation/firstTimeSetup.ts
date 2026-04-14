import type { MutationResolvers } from '../../../types.generated.ts';
import { auth } from '../../../../auth.ts';
import { fromNodeHeaders } from 'better-auth/node';
import { count, eq, or, isNull } from 'drizzle-orm';
import { otcgs } from '../../../../db/index.ts';
import { user as userTable } from '../../../../db/otcgs/schema.ts';
import { companySettings } from '../../../../db/otcgs/company-settings-schema.ts';
import { storeSupportedGame } from '../../../../db/otcgs/store-supported-game-schema.ts';
import { GraphqlContext } from '../../../../server.ts';

export const firstTimeSetup: NonNullable<MutationResolvers['firstTimeSetup']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  // Guard: prevent re-execution after setup is already complete.
  // Use a transaction to atomically check for existing non-anonymous users AND
  // insert the company settings row. This prevents TOCTOU races where two
  // concurrent requests both see zero users and proceed past the guard.
  // The company_settings insert acts as the atomic "claim" — the first request
  // succeeds, and any concurrent request will find the user count > 0 or hit
  // a conflict on the settings row.
  await otcgs.transaction(async (tx) => {
    const [{ count: userCount }] = await tx
      .select({ count: count() })
      .from(userTable)
      .where(or(eq(userTable.isAnonymous, false), isNull(userTable.isAnonymous)));

    if (userCount > 0) {
      throw new Error('Setup has already been completed. This operation cannot be performed again.');
    }

    // Insert company settings inside the transaction so the row exists before
    // the transaction commits — a concurrent request would either see the
    // user count > 0 (after the signUpEmail below) or be serialized by SQLite's
    // write lock on this transaction.
    await tx
      .insert(companySettings)
      .values({
        companyName: args.company.companyName,
        ein: args.company.ein,
      })
      .onConflictDoUpdate({
        target: companySettings.id,
        set: {
          companyName: args.company.companyName,
          ein: args.company.ein,
        },
      });
  });

  let createdUserId: string | undefined;

  try {
    // 1. Create the admin user account
    const signUpResponse = await auth.api.signUpEmail({
      body: {
        email: args.userDetails.email,
        password: args.userDetails.password,
        name: args.userDetails.firstName,
      },
      headers: fromNodeHeaders(ctx.req.headers),
      asResponse: true,
    });

    const signUpData = await signUpResponse.json();

    if (!signUpResponse.ok) {
      throw new Error(signUpData.message ?? 'Failed to create user account');
    }

    createdUserId = signUpData.user?.id;

    if (!createdUserId) {
      throw new Error('Failed to create user account');
    }

    // 2. Set the global user.role to 'owner' so the admin() plugin's APIs work
    // (createUser, listUsers, etc.). The 'owner' role has full admin
    // plugin permissions. The organization membership handles app-level permissions.
    await otcgs.update(userTable).set({ role: 'owner' }).where(eq(userTable.id, createdUserId));

    // 3. Company settings already saved in the guard transaction above.

    // Build headers from the sign-up session cookies so org creation
    // is authenticated as the newly created user.
    // NOTE: We intentionally do NOT forward these signup cookies to the browser.
    // The signup session contains stale data (the default role from before we
    // updated it to 'owner'). A fresh sign-in at the end provides cookies
    // with the correct role.
    const signUpCookies = signUpResponse.headers.getSetCookie();
    const signUpHeaders = new Headers();
    for (const cookie of signUpCookies) {
      signUpHeaders.append('cookie', cookie);
    }

    // 4. Create the first organization (store location)
    const orgResponse = await auth.api.createOrganization({
      body: {
        name: args.store.name,
        slug: args.store.slug,
        street1: args.store.street1,
        street2: args.store.street2 || '',
        city: args.store.city,
        state: args.store.state,
        zip: args.store.zip,
        phone: args.store.phone || '',
      },
      headers: signUpHeaders,
    });

    if (!orgResponse) {
      throw new Error('Failed to create organization');
    }

    // 5. Set the newly created organization as the user's active organization
    await auth.api.setActiveOrganization({
      headers: signUpHeaders,
      body: {
        organizationId: orgResponse.id,
      },
    });

    // 5b. Save supported games (company-wide setting)
    if (!args.supportedGameCategoryIds || args.supportedGameCategoryIds.length === 0) {
      throw new Error('At least one supported game must be selected');
    }
    await otcgs.insert(storeSupportedGame).values(
      args.supportedGameCategoryIds.map((categoryId: number) => ({
        categoryId,
      })),
    );

    console.log('Initial admin user and organization have been created successfully.');

    // 6. Create a fresh session by signing in. The signup session contains
    // stale data (the default 'user' role assigned at signup time, before the
    // DB update to 'owner'). Better Auth's session_data cookie caches the user
    // object, so getSession() on subsequent requests would return the old role,
    // causing all permission checks to fail. A fresh sign-in creates a new
    // session that reads the current user.role ('owner') from the database.
    // The session-creation hook in auth.ts also auto-sets activeOrganizationId
    // from the membership created in step 4.
    const signInResponse = await auth.api.signInEmail({
      body: {
        email: args.userDetails.email,
        password: args.userDetails.password,
      },
      headers: fromNodeHeaders(ctx.req.headers),
      asResponse: true,
    });

    if (!signInResponse.ok) {
      throw new Error('Setup completed but failed to create authenticated session. Please sign in manually.');
    }

    const signInData = await signInResponse.json();

    // Forward the fresh session cookies (with correct role) to the browser
    const freshCookies = signInResponse.headers.getSetCookie();
    for (const cookie of freshCookies) {
      ctx.res.append('Set-Cookie', cookie);
    }

    // 7. Return the fresh session token
    return signInData.token;
  } catch (error) {
    // Rollback: if the user was created but a subsequent step failed, clean up
    // the partially created user and company settings so setup can be retried cleanly.
    try {
      if (createdUserId) {
        await otcgs.delete(userTable).where(eq(userTable.id, createdUserId));
      }
      // Clean up company settings inserted in the guard transaction
      await otcgs.delete(companySettings);
      console.log('Rolled back setup data after failure.');
    } catch (cleanupError) {
      console.error('Failed to clean up after setup failure:', cleanupError);
    }

    const message = error instanceof Error ? error.message : 'An unexpected error occurred during setup';
    console.error('First time setup failed:', message);
    throw new Error(message);
  }
};
