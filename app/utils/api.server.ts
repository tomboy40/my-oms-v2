import { json } from '@remix-run/node';
import type { TypedResponse } from '@remix-run/node';

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: Record<string, string[]>;
  };
  metadata?: {
    total?: number;
    limit?: number;
    offset?: number;
  };
};

export function successResponse<T>(
  data: T,
  metadata?: ApiResponse<T>['metadata']
): TypedResponse<ApiResponse<T>> {
  return json({
    success: true,
    data,
    ...(metadata ? { metadata } : {}),
  });
}

export function errorResponse(
  message: string,
  status: number = 500,
  details?: Record<string, string[]>
): TypedResponse<ApiResponse<never>> {
  return json(
    {
      success: false,
      error: {
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

export function paginationParams(request: Request) {
  const url = new URL(request.url);
  return {
    limit: Number(url.searchParams.get('limit')) || 10,
    offset: Number(url.searchParams.get('offset')) || 0,
    sortBy: url.searchParams.get('sortBy'),
    sortDirection: url.searchParams.get('sortDirection') as 'asc' | 'desc' | null,
  };
} 