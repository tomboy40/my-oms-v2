import { json } from '@remix-run/node';
import { z } from 'zod';

export class ValidationError extends Error {
  constructor(public errors: z.ZodError) {
    super('Validation Error');
    this.name = 'ValidationError';
  }
}

export async function validateRequest<T>(
  request: Request,
  schema: z.Schema<T>
): Promise<T> {
  const data = await request.json();
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error);
    }
    throw error;
  }
}

export function handleError(error: unknown) {
  if (error instanceof ValidationError) {
    return json(
      { 
        error: 'Validation Error', 
        details: error.errors.flatten().fieldErrors 
      },
      { status: 400 }
    );
  }

  console.error('API Error:', error);
  return json(
    { 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    },
    { status: 500 }
  );
} 