import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { otcgs } from '../db/otcgs/index';
import { companySettings } from '../db/otcgs/company-settings-schema';
import { decryptIfPresent } from '../lib/encryption';

// ---------------------------------------------------------------------------
// Stripe client cache (per-org, keyed by encrypted key to auto-invalidate)
// ---------------------------------------------------------------------------

const clientCache = new Map<string, { client: Stripe; keyHash: string }>();

/**
 * Get a Stripe client for the given organization.
 * Decrypts the stored API key and caches the client instance.
 * Throws if Stripe is not enabled or not configured.
 */
async function getStripeClient(): Promise<Stripe> {
  const [row] = await otcgs
    .select({
      stripeEnabled: companySettings.stripeEnabled,
      stripeApiKey: companySettings.stripeApiKey,
    })
    .from(companySettings)
    .where(eq(companySettings.id, 1))
    .limit(1);

  if (!row?.stripeEnabled) {
    throw new Error('Stripe integration is not enabled');
  }

  if (!row.stripeApiKey) {
    throw new Error('Stripe API key is not configured');
  }

  // Use the encrypted key as a cache key — if the key changes, the cache auto-invalidates
  const cached = clientCache.get('stripe');
  if (cached && cached.keyHash === row.stripeApiKey) {
    return cached.client;
  }

  const apiKey = decryptIfPresent(row.stripeApiKey);
  if (!apiKey) {
    throw new Error('Failed to decrypt Stripe API key');
  }

  const client = new Stripe(apiKey);
  clientCache.set('stripe', { client, keyHash: row.stripeApiKey });
  return client;
}

// ---------------------------------------------------------------------------
// PaymentIntent operations
// ---------------------------------------------------------------------------

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Create a Stripe PaymentIntent for the given amount.
 */
export async function createPaymentIntent(amountCents: number, currency = 'usd'): Promise<PaymentIntentResult> {
  if (amountCents <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  const stripe = await getStripeClient();

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency,
    automatic_payment_methods: { enabled: true },
  });

  if (!intent.client_secret) {
    throw new Error('Stripe did not return a client secret');
  }

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
}

/**
 * Retrieve the current status of a PaymentIntent.
 */
export async function getPaymentIntentStatus(paymentIntentId: string): Promise<string> {
  const stripe = await getStripeClient();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return intent.status;
}

/**
 * Cancel a PaymentIntent (e.g., if the POS transaction is abandoned).
 */
export async function cancelPaymentIntent(paymentIntentId: string): Promise<boolean> {
  const stripe = await getStripeClient();
  await stripe.paymentIntents.cancel(paymentIntentId);
  return true;
}

// ---------------------------------------------------------------------------
// Terminal connection token
// ---------------------------------------------------------------------------

export interface TerminalConnectionTokenResult {
  secret: string;
}

/**
 * Create a Stripe Terminal ConnectionToken for the client-side Terminal SDK.
 */
export async function createTerminalConnectionToken(): Promise<TerminalConnectionTokenResult> {
  const stripe = await getStripeClient();
  const token = await stripe.terminal.connectionTokens.create();
  return { secret: token.secret };
}
