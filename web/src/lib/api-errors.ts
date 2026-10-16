import { NextResponse } from 'next/server';
import { AuthorizationError } from './authorization-errors';

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  console.error(error);
  return NextResponse.json(
    { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } },
    { status: 500 },
  );
}

