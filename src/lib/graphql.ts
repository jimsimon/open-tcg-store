import type { TypedDocumentString } from "../graphql/graphql";

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

export async function execute<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
) {
  const response = await fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/graphql-response+json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  return response.json() as Promise<ExecutionResult<TResult>>;
}
