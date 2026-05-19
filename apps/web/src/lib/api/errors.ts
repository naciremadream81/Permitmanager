import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]', error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        message: error.errors[0]?.message ?? 'Invalid input',
        details: error.errors,
      },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    if (
      error.message.includes('Record to update not found') ||
      error.message.includes('Record to delete does not exist') ||
      error.message.includes('No record was found')
    ) {
      return NextResponse.json({ error: 'Not found', message: 'Resource not found' }, { status: 404 });
    }
    if (error.message.includes('Unique constraint failed')) {
      return NextResponse.json({ error: 'Conflict', message: 'Resource already exists' }, { status: 409 });
    }
  }

  return NextResponse.json(
    { error: 'Internal server error', message: 'An unexpected error occurred' },
    { status: 500 },
  );
}

export function notFound(message = 'Resource not found'): NextResponse {
  return NextResponse.json({ error: 'Not found', message }, { status: 404 });
}

export function forbidden(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: 'Forbidden', message }, { status: 403 });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: 'Bad request', message }, { status: 400 });
}
