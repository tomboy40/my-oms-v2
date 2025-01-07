import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { Search, AlertCircle, RefreshCw } from "lucide-react";
import { ServiceTable } from "./service-table";
import type { ITService } from "~/types/db";

interface SearchParams {
  query: string;
  sortBy: string;
  sortDirection: "asc" | "desc";
  page: number;
  pageSize: number;
  filters?: {
    appInstStatus?: string;
    environment?: string;
    appCriticality?: string;
  };
}

interface SearchServicesProps {
  initialData: ITService[];
  total: number;
  error?: string;
  searchParams: SearchParams;
}

const isValidAppId = (value: string) => {
  const numValue = Number(value);
  return !isNaN(numValue) && Number.isInteger(numValue) && numValue > 0;
};

export function SearchServices({ initialData, total, error, searchParams }: SearchServicesProps) {
  const [inputValue, setInputValue] = useState(searchParams.query);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const handleSearch = () => {
    if (!inputValue.trim()) return;

    const params = new URLSearchParams({
      query: inputValue.trim(),
      page: "1", // Reset to first page on new search
      pageSize: searchParams.pageSize.toString(),
      sortBy: searchParams.sortBy,
      sortDirection: searchParams.sortDirection
    });

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

  const handleSync = async (appInstanceId: string) => {
    if (!isValidAppId(appInstanceId)) return;

    setIsSyncing(true);
    try {
      const response = await fetch("/api/ods/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appInstanceId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to sync with ODS");
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
            Search by Application ID or Name
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-neutral-400" aria-hidden="true" />
          </div>
          <input
            id="search-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search by Application ID or Name"
            className="block w-full rounded-lg border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            role="searchbox"
            aria-label="Search services by Application ID or Name"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!inputValue.trim() || isSyncing}
          className="min-w-[100px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          aria-label="Search services"
        >
          Search
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

      {!error && initialData.length === 0 && searchParams.query && (
        <div className="rounded-md border border-gray-200 bg-white p-12">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">No services found</h3>
            {isValidAppId(searchParams.query) ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-500">
                  Would you like to synchronize data from ODS for Application ID: {searchParams.query}?
                </p>
                <button
                  onClick={() => handleSync(searchParams.query)}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Sync from ODS
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                Try searching with a different Application name or ID, or enter a valid Application ID to sync with ODS
              </p>
            )}
          </div>
        </div>
      )}

      {initialData.length > 0 && (
        <ServiceTable
          data={initialData}
          total={total}
          pageSize={searchParams.pageSize}
          page={searchParams.page}
          sortBy={searchParams.sortBy}
          sortDirection={searchParams.sortDirection}
          searchQuery={searchParams.query}
          onStateChange={handleTableStateChange}
          onSync={handleSync}
          isSyncing={isSyncing}
        />
      )}
    </div>
  );
}