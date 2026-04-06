import type { MutationResolvers } from '../../../types.generated.ts';
import { auth } from '../../../../auth.ts';
import { fromNodeHeaders } from 'better-auth/node';
import { eq } from 'drizzle-orm';
import { otcgs } from '../../../../db/index.ts';
import { user as userTable } from '../../../../db/otcgs/schema.ts';
import { storeSettings } from '../../../../db/otcgs/settings-schema.ts';
import { storeSupportedGame } from '../../../../db/otcgs/store-supported-game-schema.ts';
import { GraphqlContext } from '../../../../server.ts';

export const firstTimeSetup: NonNullable<MutationResolvers['firstTimeSetup']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
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
    // (createUser, listUsers, banUser, etc.). The 'owner' role has full admin
    // plugin permissions. The organization membership handles app-level permissions.
    await otcgs.update(userTable).set({ role: 'owner' }).where(eq(userTable.id, createdUserId));

    // 3. Save company settings (companyName + ein) to store_settings
    await otcgs
      .insert(storeSettings)
      .values({
        companyName: args.company.companyName,
        ein: args.company.ein,
      })
      .onConflictDoUpdate({
        target: storeSettings.id,
        set: {
          companyName: args.company.companyName,
          ein: args.company.ein,
        },
      });

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

    // 5b. Save supported games for the newly created organization
    if (!args.supportedGameCategoryIds || args.supportedGameCategoryIds.length === 0) {
      throw new Error('At least one supported game must be selected');
    }
    await otcgs.insert(storeSupportedGame).values(
      args.supportedGameCategoryIds.map((categoryId: number) => ({
        organizationId: orgResponse.id,
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
    // the partially created user so setup can be retried cleanly.
    if (createdUserId) {
      try {
        await otcgs.delete(userTable).where(eq(userTable.id, createdUserId));
        console.log('Rolled back partially created user after setup failure.');
      } catch (cleanupError) {
        console.error('Failed to clean up user after setup failure:', cleanupError);
      }
    }

    const message = error instanceof Error ? error.message : 'An unexpected error occurred during setup';
    console.error('First time setup failed:', message);
    throw new Error(message);
  }
};
