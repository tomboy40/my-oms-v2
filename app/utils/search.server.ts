import type { Prisma } from '@prisma/client';
import { env } from '~/env.server';

export interface SearchParams {
  query?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, string | undefined>;
}

export type WhereClause = Prisma.ITServiceWhereInput | Prisma.InterfaceWhereInput;
export type OrderByClause = Prisma.ITServiceOrderByWithRelationInput | Prisma.InterfaceOrderByWithRelationInput;

// Helper function to create case-insensitive contains condition
function createContainsCondition(field: string, value: string) {
  // For SQLite, convert both field and value to lowercase
  if (env.DATABASE_URL.includes('sqlite')) {
    return Prisma.sql`LOWER(${Prisma.raw(field)}) LIKE LOWER(${`%${value}%`})`;
  }
  // For PostgreSQL, use ilike
  return {
    contains: value,
    mode: 'insensitive'
  };
}

export function buildSearchWhereClause(
  params: SearchParams,
  searchableFields: string[],
  exactMatchFields: string[] = []
): WhereClause {
  const { query, filters = {} } = params;
  const conditions: any[] = [];

  // Handle text search
  if (query) {
    if (/^\d+$/.test(query)) {
      // If query is numeric, search in exact match fields
      conditions.push({
        OR: exactMatchFields.map(field => ({
          [field]: query
        }))
      });
    } else {
      // If query is text, search in searchable fields with case-insensitive contains
      conditions.push({
        OR: searchableFields.map(field => ({
          [field]: { contains: query.toLowerCase() }
        }))
      });
    }
  }

  // Handle filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      conditions.push({ [key]: value });
    }
  });

  return conditions.length > 0 ? { AND: conditions } : {};
}

export function buildSearchOrderBy(
  params: SearchParams,
  defaultSortField: string
): OrderByClause {
  const { sortBy, sortDirection = 'asc' } = params;
  return {
    [sortBy || defaultSortField]: sortDirection
  };
}

export function buildPaginationParams(params: SearchParams): { limit: number; offset: number } {
  const limit = Math.min(Number(params.limit) || 10, 100); // Cap at 100 items per page
  const offset = Number(params.offset) || 0;
  return { limit, offset };
}

export function validateSearchParams(
  params: SearchParams,
  allowedSortFields: string[],
  allowedFilters: string[]
): SearchParams {
  const validatedParams: SearchParams = {
    query: params.query,
    limit: Math.min(Number(params.limit) || 10, 100),
    offset: Number(params.offset) || 0,
    sortDirection: params.sortDirection === 'desc' ? 'desc' : 'asc'
  };

  // Validate sort field
  if (params.sortBy && allowedSortFields.includes(params.sortBy)) {
    validatedParams.sortBy = params.sortBy;
  }

  // Validate filters
  if (params.filters) {
    validatedParams.filters = {};
    Object.entries(params.filters).forEach(([key, value]) => {
      if (allowedFilters.includes(key) && value !== undefined) {
        validatedParams.filters![key] = value;
      }
    });
  }

  return validatedParams;
} 