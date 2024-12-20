import { useCallback, useMemo } from 'react';
import { useSearchParams, useSubmit } from '@remix-run/react';
import type { SearchParams } from '~/utils/search.server';

interface UseSearchOptions {
  defaultLimit?: number;
  defaultSortBy?: string;
  defaultSortDirection?: 'asc' | 'desc';
}

export function useSearch(options: UseSearchOptions = {}) {
  const {
    defaultLimit = 10,
    defaultSortBy = 'updatedAt',
    defaultSortDirection = 'desc'
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();

  const currentParams = useMemo((): SearchParams => {
    const params: SearchParams = {
      query: searchParams.get('query') || undefined,
      limit: Number(searchParams.get('limit')) || defaultLimit,
      offset: Number(searchParams.get('offset')) || 0,
      sortBy: searchParams.get('sortBy') || defaultSortBy,
      sortDirection: (searchParams.get('sortDirection') || defaultSortDirection) as 'asc' | 'desc',
    };

    // Extract filters
    const filters: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      if (!['query', 'limit', 'offset', 'sortBy', 'sortDirection'].includes(key)) {
        filters[key] = value || undefined;
      }
    });

    if (Object.keys(filters).length > 0) {
      params.filters = filters;
    }

    return params;
  }, [searchParams, defaultLimit, defaultSortBy, defaultSortDirection]);

  const setSearch = useCallback((newParams: Partial<SearchParams>) => {
    const updatedParams = new URLSearchParams(searchParams);

    // Reset offset when changing search query or filters
    if (newParams.query !== undefined || newParams.filters !== undefined) {
      updatedParams.set('offset', '0');
    }

    // Update search parameters
    Object.entries(newParams).forEach(([key, value]) => {
      if (key === 'filters' && value) {
        // Handle filters separately
        Object.entries(value).forEach(([filterKey, filterValue]) => {
          if (filterValue) {
            updatedParams.set(filterKey, filterValue);
          } else {
            updatedParams.delete(filterKey);
          }
        });
      } else if (value) {
        updatedParams.set(key, String(value));
      } else {
        updatedParams.delete(key);
      }
    });

    setSearchParams(updatedParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const resetSearch = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const submitSearch = useCallback((formData: FormData) => {
    submit(formData, { method: 'GET', replace: true });
  }, [submit]);

  return {
    searchParams: currentParams,
    setSearch,
    resetSearch,
    submitSearch
  };
} 