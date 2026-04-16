/**
 * Lazy-load the auth client to avoid SSR issues.
 */
let _authClient: typeof import('../auth-client').authClient | undefined;

export async function getAuthClient() {
  if (!_authClient) {
    const mod = await import('../auth-client');
    _authClient = mod.authClient;
  }
  return _authClient;
}
