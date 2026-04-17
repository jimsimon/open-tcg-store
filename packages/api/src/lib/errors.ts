/**
 * Typed application error classes for consistent error handling across services.
 *
 * Services throw these typed errors; the GraphQL layer formats them appropriately
 * (stripping stack traces in production, mapping to correct HTTP-equivalent codes).
 */

/** Base class for all application errors. */
export class AppError extends Error {
  /** Machine-readable error code for clients to programmatically handle errors. */
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

/** The requested resource was not found. */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND');
  }
}

/** The input provided by the client is invalid. */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

/** The user is not authenticated. */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHENTICATED');
  }
}

/** The user doesn't have sufficient permissions for this operation. */
export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'FORBIDDEN');
  }
}

/** A business rule or state conflict prevents the operation. */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT');
  }
}

/** The feature is not yet implemented. */
export class NotImplementedError extends AppError {
  constructor(message = 'This feature is not yet implemented') {
    super(message, 'NOT_IMPLEMENTED');
  }
}

/**
 * Format an error for GraphQL responses. In production, strips stack traces
 * and internal details from non-AppError exceptions to prevent information leakage.
 */
export function formatGraphQLError(error: unknown): { message: string; extensions?: { code: string } } {
  if (error instanceof AppError) {
    return {
      message: error.message,
      extensions: { code: error.code },
    };
  }

  // In production, don't expose internal error messages or stack traces
  if (process.env.NODE_ENV === 'production') {
    return {
      message: 'An unexpected error occurred',
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    };
  }

  // In development, pass through the original message for debugging
  return {
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  };
}
