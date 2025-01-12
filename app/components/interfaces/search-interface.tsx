import { useState } from "react";
import { useNavigate, useSubmit } from "@remix-run/react";
import { Search, AlertCircle, RefreshCw } from "lucide-react";
import { InterfaceTable } from "./interface-table";
import { InterfaceSkeleton } from "./interface-skeleton";
import type { Interface } from "~/types/db";
import { useSettings } from "~/contexts/settings-context";

interface SearchParams {
  query?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
  filters?: {
    status?: string;
    priority?: string;
  };
  excludeInactiveInterface?: boolean;
}

interface SearchInterfaceProps {
  initialData?: Interface[];
  total?: number;
  error?: string;
  searchParams: SearchParams;
}

const isValidAppId = (value: string) => /^\d+$/.test(value.trim());

export function SearchInterface({ initialData = [], total = 0, error, searchParams }: SearchInterfaceProps) {
  const [inputValue, setInputValue] = useState(searchParams.query ?? "");
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  const submit = useSubmit();
  const { excludeInactiveInterface } = useSettings();

  const handleSearch = () => {
    if (!inputValue.trim()) return;

    const params = new URLSearchParams();
    
    // Add search query
    params.append('query', inputValue.trim());
    
    // Add pagination and sorting with defaults
    params.append('page', '1'); // Reset to first page on new search
    params.append('pageSize', searchParams.pageSize.toString());
    params.append('sortBy', searchParams.sortBy);
    params.append('sortDirection', searchParams.sortDirection);

    // Add exclude inactive parameter only if enabled
    if (excludeInactiveInterface) {
      params.append('excludeInactive', 'true');
    }
    
    // Add filters if they exist
    if (searchParams.filters) {
      Object.entries(searchParams.filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
    }

    navigate(`?${params.toString()}`);
  };

  const handleSync = async () => {
    if (!inputValue.trim() || !isValidAppId(inputValue)) return;

    setIsSyncing(true);
    try {
      const formData = new FormData();
      formData.append('appid', inputValue.trim());

      const response = await fetch("/api/dlas/sync", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to sync with DLAS");
      }

      // Refresh the search results
      handleSearch();
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTableStateChange = (newState: {
    page: number;
    pageSize: number;
    sortBy: string;
    sortDirection: "asc" | "desc";
  }) => {
    const params = new URLSearchParams();

    // Add search query if it exists
    if (inputValue.trim()) {
      params.append('query', inputValue.trim());
    }

    // Add pagination and sorting
    params.append('page', newState.page.toString());
    params.append('pageSize', newState.pageSize.toString());
    params.append('sortBy', newState.sortBy);
    params.append('sortDirection', newState.sortDirection);

    // Add exclude inactive parameter only if enabled
    if (excludeInactiveInterface) {
      params.append('excludeInactive', 'true');
    }

    // Add filters if they exist
    if (searchParams.filters) {
      Object.entries(searchParams.filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
    }

    navigate(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">
            Search by Application ID
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-neutral-400" aria-hidden="true" />
          </div>
          <input
            id="search-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter Application ID (numbers only)"
            className="block w-full rounded-lg border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            role="searchbox"
            aria-label="Search interfaces by Application ID"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!inputValue.trim() || isSyncing}
          className="min-w-[100px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          aria-label="Search interfaces"
        >
          Search
        </button>
        <button
          onClick={handleSync}
          disabled={!inputValue.trim() || !isValidAppId(inputValue) || isSyncing}
          className="min-w-[120px] px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          aria-label="Sync with DLAS"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin inline-block" aria-hidden="true" />
              <span>Syncing...</span>
            </>
          ) : (
            "Sync DLAS"
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4" role="alert">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-700">Error</h3>
              <div className="mt-2 text-sm text-red-600">{error}</div>
            </div>
          </div>
        </div>
      )}

      {!error && initialData.length === 0 && (
        <div className="text-center py-12" role="status">
          <div className="text-neutral-600">No interfaces found</div>
          <p className="text-sm text-neutral-400 mt-2">
            Try searching with a different Application ID or sync with DLAS
          </p>
        </div>
      )}

      {initialData.length > 0 && (
        <InterfaceTable
          data={initialData}
          total={total}
          pageSize={searchParams.pageSize}
          page={searchParams.page}
          sortBy={searchParams.sortBy}
          sortDirection={searchParams.sortDirection}
          onStateChange={handleTableStateChange}
        />
      )}
    </div>
  );
}