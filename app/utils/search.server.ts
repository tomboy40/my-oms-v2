import { sql } from 'drizzle-orm';
import { interfaces, itServices } from '../../drizzle/schema';
import { env } from '~/env.server';
import { desc, asc, like, and, or, SQL } from 'drizzle-orm';

export interface SearchParams {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, string | undefined>;
}

// Helper function to create case-insensitive contains condition
function createContainsCondition(field: any, value: string): SQL {
  // SQLite doesn't support ILIKE, so we use LOWER() with COALESCE for null safety
  return sql`LOWER(COALESCE(${field}, '')) LIKE LOWER(${'%' + value + '%'})`;
}

export function buildSearchWhereClause(
  params: SearchParams,
  searchableFields: string[],
  exactMatchFields: string[] = [],
  table: typeof interfaces | typeof itServices
): SQL | undefined {
  const conditions: SQL[] = [];

  // Handle search query
  if (params.query) {
    const searchValue = params.query.trim();
    const searchConditions: SQL[] = [];
    
    // Handle exact match fields first
    if (exactMatchFields.length > 0) {
      const exactMatches = exactMatchFields.map(field => 
        sql`${table[field]} = ${searchValue}`
      );
      if (exactMatches.length > 0) {
        searchConditions.push(or(...exactMatches));
      }
    }

    // Handle searchable fields
    if (searchableFields.length > 0) {
      const likeConditions = searchableFields.map(field =>
        createContainsCondition(table[field], searchValue)
      );
      if (likeConditions.length > 0) {
        searchConditions.push(or(...likeConditions));
      }
    }

    if (searchConditions.length > 0) {
      conditions.push(or(...searchConditions));
    }
  }

  // Handle filters
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value && table[key]) {
        conditions.push(sql`${table[key]} = ${value}`);
      }
    });
  }

  // If no conditions, return undefined to get all records
  if (conditions.length === 0) {
    return undefined;
  }

  // Combine all conditions with AND
  return and(...conditions);
}

export function buildSearchOrderBy(
  params: SearchParams,
  searchableFields: string[],
  exactMatchFields: string[] = [],
  table: typeof interfaces | typeof itServices
): SQL[] {
  const { sortDirection = 'asc' } = params;
  
  // Determine the sort field, fallback to first searchable field if invalid
  const sortField = params.sortBy && table[params.sortBy] 
    ? params.sortBy 
    : searchableFields[0];

  return [
    sortDirection === 'asc' 
      ? asc(table[sortField])
      : desc(table[sortField])
  ];
}

export function buildPaginationParams(params: SearchParams) {
  return {
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize
  };
}

export function validateSearchParams(
  params: SearchParams,
  allowedSortFields: string[],
  allowedFilters: string[]
): SearchParams {
  const validatedParams: SearchParams = {
    query: params.query,
    page: Math.max(1, params.page || 1),
    pageSize: Math.min(100, Math.max(1, params.pageSize || 10)),
    sortBy: params.sortBy && allowedSortFields.includes(params.sortBy)
      ? params.sortBy
      : allowedSortFields[0],
    sortDirection: params.sortDirection === 'desc' ? 'desc' : 'asc',
    filters: {}
  };

  // Validate filters if they exist
  if (params.filters) {
    validatedParams.filters = Object.fromEntries(
      Object.entries(params.filters)
        .filter(([key, value]) => 
          allowedFilters.includes(key) && 
          value !== undefined && 
          value !== ''
        )
    );
  }

  return validatedParams;
}