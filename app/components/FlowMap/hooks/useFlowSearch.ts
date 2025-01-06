import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useNavigation } from '@remix-run/react';

interface UseFlowSearchOptions {
  initialSearchTerm?: string;
  onSearch?: (query: string) => void;
}

export function useFlowSearch({ initialSearchTerm = '', onSearch }: UseFlowSearchOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(!!initialSearchTerm);
  const currentSearchTerm = searchParams.get('search') || '';

  // Initialize search params if initial term provided and no current search term
  useEffect(() => {
    if (initialSearchTerm && !currentSearchTerm) {
      setSearchParams({ search: initialSearchTerm }, { replace: true });
      setIsExpanded(true);
    }
  }, [initialSearchTerm, currentSearchTerm, setSearchParams]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    if (query && query !== currentSearchTerm) {
      setSearchParams({ search: query }, { replace: true });
      onSearch?.(query);
      setIsExpanded(true);
    }
  }, [setSearchParams, onSearch, currentSearchTerm]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchParams({}, { replace: true });
    setIsExpanded(false);
  }, [setSearchParams]);

  return {
    searchTerm: currentSearchTerm,
    handleSearch,
    clearSearch,
    isExpanded,
    setIsExpanded
  };
}
