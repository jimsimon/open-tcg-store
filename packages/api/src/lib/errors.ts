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
