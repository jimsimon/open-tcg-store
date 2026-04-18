import type { TypedDocumentString } from '../graphql/graphql';
import { Exact } from '../graphql/graphql';

interface ExecutionResult<T> {
  data: T;
  errors?: ExecutionError[];
}

interface ExecutionError {
  message: string;
  locations: [
    {
      line: number;
      column: number;
    },
  ];
  path: string[];
}

const APP_URL = globalThis.process?.env?.APP_URL || (typeof window === 'undefined' ? 'http://localhost' : '');
const API_INTERNAL_URL =
  globalThis.process?.env?.API_INTERNAL_URL || (typeof window === 'undefined' ? 'http://localhost:5174' : '');

/** Default request timeout in milliseconds (30 seconds) */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Server-side variant of `execute` that forwards explicit headers (e.g. Cookie)
 * to the GraphQL endpoint. Used during SSR where `credentials: 'include'` has
 * no effect and the session cookie must be forwarded manually.
 */
export async function executeWithHeaders<TResult>(
  query: TypedDocumentString<TResult, Record<string, never>>,
  headers: Record<string, string>,
): Promise<ExecutionResult<TResult>> {
  const response = await fetch(`${API_INTERNAL_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/graphql-response+json',
      // Origin is required for the API's CSRF middleware to allow POST requests
      // that carry a session cookie (forwarded from the browser during SSR).
      Origin: APP_URL || 'http://localhost',
      ...headers,
    },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}`);
  }

  return response.json() as Promise<ExecutionResult<TResult>>;
}

export async function execute<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Exact<{ [key: string]: never }>
    ? []
    : TVariables extends Record<string, never>
      ? []
      : [TVariables]
) {
  const response = await fetch(`${APP_URL}/graphql`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/graphql-response+json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}`);
  }

  return response.json() as Promise<ExecutionResult<TResult>>;
}
