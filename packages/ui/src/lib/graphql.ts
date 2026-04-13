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

const APP_URL = typeof process !== 'undefined' ? process.env.APP_URL || 'http://localhost' : '';

/**
 * Server-side variant of `execute` that forwards explicit headers (e.g. Cookie)
 * to the GraphQL endpoint. Used during SSR where `credentials: 'include'` has
 * no effect and the session cookie must be forwarded manually.
 */
export async function executeWithHeaders<TResult>(
  query: TypedDocumentString<TResult, Record<string, never>>,
  headers: Record<string, string>,
): Promise<ExecutionResult<TResult>> {
  const response = await fetch(`${APP_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/graphql-response+json',
      ...headers,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
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
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response.json() as Promise<ExecutionResult<TResult>>;
}
