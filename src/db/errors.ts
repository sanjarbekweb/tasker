export type ErrorCode =
  | "DATABASE_ERROR"
  | "VALIDATION_ERROR"
  | "CONFLICT_ERROR"
  | "NOT_FOUND_ERROR"
  | "MIGRATION_ERROR"
  | "SYNC_ERROR"
  | "PERMISSION_ERROR";

export abstract class AppBaseError extends Error {
  abstract readonly code: ErrorCode;
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DatabaseError extends AppBaseError {
  readonly code = "DATABASE_ERROR" as const;
}

export class ValidationError extends AppBaseError {
  readonly code = "VALIDATION_ERROR" as const;
  readonly issues?: unknown;

  constructor(message: string, issues?: unknown, cause?: unknown) {
    super(message, cause);
    this.issues = issues;
  }
}

export class ConflictError extends AppBaseError {
  readonly code = "CONFLICT_ERROR" as const;
}

export class NotFoundError extends AppBaseError {
  readonly code = "NOT_FOUND_ERROR" as const;
  readonly entityName?: string;
  readonly entityId?: string;

  constructor(message: string, entityName?: string, entityId?: string, cause?: unknown) {
    super(message, cause);
    this.entityName = entityName;
    this.entityId = entityId;
  }
}

export class MigrationError extends AppBaseError {
  readonly code = "MIGRATION_ERROR" as const;
}

export class SyncError extends AppBaseError {
  readonly code = "SYNC_ERROR" as const;
}

export class PermissionError extends AppBaseError {
  readonly code = "PERMISSION_ERROR" as const;
}
