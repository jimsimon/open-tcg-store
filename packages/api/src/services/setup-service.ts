import { auth } from '../auth';
import { fromNodeHeaders } from 'better-auth/node';
import { count, eq, or, isNull } from 'drizzle-orm';
import { otcgs } from '../db/index';
import { user as userTable } from '../db/otcgs/schema';
import { companySettings } from '../db/otcgs/company-settings-schema';
import { storeSupportedGame } from '../db/otcgs/store-supported-game-schema';
import type { IncomingMessage } from 'node:http';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SetupUserDetails {
  email: string;
  password: string;
  firstName: string;
}

interface SetupCompanyDetails {
  companyName: string;
  ein?: string | null;
}

interface SetupStoreDetails {
  name: string;
  slug: string;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zip: string;
  phone?: string | null;
}

// ---------------------------------------------------------------------------
// isSetupPending
// ---------------------------------------------------------------------------

/**
 * Check if first-time setup is still pending (no non-anonymous users exist).
 */
export async function isSetupPending(): Promise<boolean> {
  const [{ count: userCount }] = await otcgs
    .select({ count: count() })
    .from(userTable)
    .where(or(eq(userTable.isAnonymous, false), isNull(userTable.isAnonymous)));
  return userCount === 0;
}

// ---------------------------------------------------------------------------
// firstTimeSetup
// ---------------------------------------------------------------------------

/**
 * Execute the first-time setup flow:
 * 1. Guard against re-execution (atomic check + company settings insert)
 * 2. Create admin user
 * 3. Create organization
 * 4. Set active org
 * 5. Save supported games
 * 6. Fresh sign-in to get correct role in session
 *
 * Returns the session token on success.
 */
export async function performFirstTimeSetup(
  userDetails: SetupUserDetails,
  company: SetupCompanyDetails,
  store: SetupStoreDetails,
  supportedGameCategoryIds: number[],
  req: IncomingMessage,
  setCookie: (cookie: string) => void,
): Promise<string> {
  // Guard: prevent re-execution after setup is already complete.
  await otcgs.transaction(async (tx) => {
    const [{ count: userCount }] = await tx
      .select({ count: count() })
      .from(userTable)
      .where(or(eq(userTable.isAnonymous, false), isNull(userTable.isAnonymous)));

    if (userCount > 0) {
      throw new Error('Setup has already been completed. This operation cannot be performed again.');
    }

    await tx
      .insert(companySettings)
      .values({
        companyName: company.companyName,
        ein: company.ein,
      })
      .onConflictDoUpdate({
        target: companySettings.id,
        set: {
          companyName: company.companyName,
          ein: company.ein,
        },
      });
  });

  let createdUserId: string | undefined;

  try {
    // 1. Create the admin user account
    const signUpResponse = await auth.api.signUpEmail({
      body: {
        email: userDetails.email,
        password: userDetails.password,
        name: userDetails.firstName,
      },
      headers: fromNodeHeaders(req.headers),
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

    // 2. Set global user.role to 'owner'
    await otcgs.update(userTable).set({ role: 'owner' }).where(eq(userTable.id, createdUserId));

    // 3. Build headers from sign-up session cookies
    const signUpCookies = signUpResponse.headers.getSetCookie();
    const signUpHeaders = new Headers();
    for (const cookie of signUpCookies) {
      signUpHeaders.append('cookie', cookie);
    }

    // 4. Create the first organization
    const orgResponse = await auth.api.createOrganization({
      body: {
        name: store.name,
        slug: store.slug,
        street1: store.street1,
        street2: store.street2 || '',
        city: store.city,
        state: store.state,
        zip: store.zip,
        phone: store.phone || '',
      },
      headers: signUpHeaders,
    });

    if (!orgResponse) {
      throw new Error('Failed to create organization');
    }

    // 5. Set active organization
    await auth.api.setActiveOrganization({
      headers: signUpHeaders,
      body: { organizationId: orgResponse.id },
    });

    // 5b. Save supported games
    if (!supportedGameCategoryIds || supportedGameCategoryIds.length === 0) {
      throw new Error('At least one supported game must be selected');
    }
    await otcgs.insert(storeSupportedGame).values(
      supportedGameCategoryIds.map((categoryId: number) => ({
        categoryId,
      })),
    );

    console.log('Initial admin user and organization have been created successfully.');

    // 6. Fresh sign-in to get correct role in session
    const signInResponse = await auth.api.signInEmail({
      body: {
        email: userDetails.email,
        password: userDetails.password,
      },
      headers: fromNodeHeaders(req.headers),
      asResponse: true,
    });

    if (!signInResponse.ok) {
      throw new Error('Setup completed but failed to create authenticated session. Please sign in manually.');
    }

    const signInData = await signInResponse.json();

    // Forward fresh session cookies to the browser
    const freshCookies = signInResponse.headers.getSetCookie();
    for (const cookie of freshCookies) {
      setCookie(cookie);
    }

    return signInData.token;
  } catch (error) {
    // Rollback: clean up partially created data
    try {
      if (createdUserId) {
        await otcgs.delete(userTable).where(eq(userTable.id, createdUserId));
      }
      await otcgs.delete(companySettings);
      console.log('Rolled back setup data after failure.');
    } catch (cleanupError) {
      console.error('Failed to clean up after setup failure:', cleanupError);
    }

    const message = error instanceof Error ? error.message : 'An unexpected error occurred during setup';
    console.error('First time setup failed:', message);
    throw new Error(message);
  }
}
