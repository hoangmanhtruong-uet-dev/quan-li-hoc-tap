export const AUTHORIZATION_ERROR_CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'WORKSPACE_NOT_FOUND',
  'MEMBERSHIP_NOT_FOUND',
  'INSUFFICIENT_PERMISSION',
  'LAST_OWNER_CANNOT_LEAVE',
] as const;

export type AuthorizationErrorCode = (typeof AUTHORIZATION_ERROR_CODES)[number];

const STATUS_BY_CODE: Record<AuthorizationErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  WORKSPACE_NOT_FOUND: 404,
  MEMBERSHIP_NOT_FOUND: 404,
  INSUFFICIENT_PERMISSION: 403,
  LAST_OWNER_CANNOT_LEAVE: 409,
};

export class AuthorizationError extends Error {
  readonly status: number;

  constructor(readonly code: AuthorizationErrorCode, message = code) {
    super(message);
    this.name = 'AuthorizationError';
    this.status = STATUS_BY_CODE[code];
  }
}

