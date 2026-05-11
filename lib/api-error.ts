import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

type JsonBody = { message: string; details?: unknown };

export const apiError = (message: string, status: number, details?: unknown) => {
  const body: JsonBody = { message };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
};

export const apiInternalError = (logTag: string, err: unknown) => {
  console.log(`[${logTag}]`, err);
  return apiError('Internal error', 500);
};

export const apiZodError = (error: ZodError) =>
  apiError('Validation failed', 400, error.flatten());
