import { useState, useEffect } from "react";
import { useNavigate, useSubmit } from "@remix-run/react";
import { Search, AlertCircle, RefreshCw } from "lucide-react";
import { InterfaceTable } from "./interface-table";
import { InterfaceSkeleton } from "./interface-skeleton";
import type { Interface } from "~/types/db";
import { useSettings } from "~/contexts/settings-context";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "~/components/ui/select";
import { LoadingState } from "~/components/ui/loading-state";

// Constants for special values
const ALL_ORG_VALUE = "__all__";

interface SearchParams {
  query?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
  filters?: {
    status?: string;
    priority?: string;
    level4Org?: string;
    level5Org?: string;
  };
  excludeInactiveInterface?: boolean;
}

interface SearchInterfaceProps {
  initialData?: Interface[];
  total?: number;
  error?: string;
  searchParams: SearchParams;
}

interface Organization {
  id: string;
  name: string;
  isAll?: boolean;
}

interface HEETOrganization {
  id: string;
  name: string;
  level: number;
  level4Id: string;
  level4: string;
}

const isValidAppId = (value: string) => /^\d+$/.test(value.trim());

export function SearchInterface({ initialData = [], total = 0, error, searchParams }: SearchInterfaceProps) {
  const [inputValue, setInputValue] = useState(searchParams.query ?? "");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [allOrganizations, setAllOrganizations] = useState<HEETOrganization[]>([]);
  const [level4Orgs, setLevel4Orgs] = useState<Organization[]>([]);
  const [level5Orgs, setLevel5Orgs] = useState<Organization[]>([]);
  const [selectedLevel4Org, setSelectedLevel4Org] = useState<string>(
    new URLSearchParams(window.location.search).get('level4Org') || ALL_ORG_VALUE
  );
  const [selectedLevel5Org, setSelectedLevel5Org] = useState<string | undefined>(
    new URLSearchParams(window.location.search).get('level5Org') || undefined
  );
  const [orgError, setOrgError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const submit = useSubmit();
  const { excludeInactiveInterface } = useSettings();

  // Fetch organization data on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      setIsLoadingOrgs(true);
      setOrgError(null);
      
      try {
        const response = await fetch('/api/heet/org');
        if (!response.ok) {
          throw new Error('Failed to fetch organization data');
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch organization data');
        }

        // Store all organizations for filtering
        setAllOrganizations(data.data.organizations);

        // Add "All" option at the beginning of Level 4 orgs
        const orgs = [
          { id: ALL_ORG_VALUE, name: "All", isAll: true },
          ...data.data.level4Organizations
        ];
        
        setLevel4Orgs(orgs);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setOrgError(error instanceof Error ? error.message : 'Failed to fetch organizations');
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, []);

  // Update Level 5 organizations when Level 4 selection changes
  useEffect(() => {
    if (!selectedLevel4Org || selectedLevel4Org === ALL_ORG_VALUE) {
      setLevel5Orgs([]);
      return;
    }

    // Filter Level 5 organizations based on selected Level 4
    const filteredOrgs = allOrganizations
      .filter(org => org.level === 5 && org.level4Id === selectedLevel4Org)
      .map(org => ({
        id: org.id,
        name: org.name
      }));

    // Add "All" option at the beginning
    const orgs = [
      { id: ALL_ORG_VALUE, name: "All", isAll: true },
      ...filteredOrgs
    ];

    setLevel5Orgs(orgs);
  }, [selectedLevel4Org, allOrganizations]);

  // Sync URL parameters with state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const level4Param = params.get('level4Org');
    const level5Param = params.get('level5Org');

    if (level4Param && level4Param !== selectedLevel4Org) {
      setSelectedLevel4Org(level4Param);
    }
    if (level5Param !== selectedLevel5Org) {
      setSelectedLevel5Org(level5Param || undefined);
    }
  }, [window.location.search]);

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

    // Add selected organizations if any
    if (selectedLevel4Org) {
      params.append('level4Org', selectedLevel4Org);
    }
    if (selectedLevel5Org) {
      params.append('level5Org', selectedLevel5Org);
    }

    navigate(`?${params.toString()}`);
  };

  const handleSync = async () => {
    if (!inputValue.trim() || !isValidAppId(inputValue)) return;

    setIsSyncing(true);
    try {
      const formData = new FormData();
      formData.append('appid', inputValue.trim());

      const response = await fetch("/api/dlas/interfaces/sync", {
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

  const handleLevel4Change = (value: string) => {
    setSelectedLevel4Org(value);
    setSelectedLevel5Org(undefined);

    const params = new URLSearchParams(window.location.search);
    params.set('page', '1');

    if (value === ALL_ORG_VALUE) {
      params.delete('level4Org');
      params.delete('level5Org');
    } else {
      params.set('level4Org', value);
      params.delete('level5Org');
    }

    // Preserve other parameters
    if (inputValue.trim()) {
      params.set('query', inputValue.trim());
    }
    if (excludeInactiveInterface) {
      params.set('excludeInactive', 'true');
    }

    navigate(`?${params.toString()}`);
  };

  const handleLevel5Change = (value: string) => {
    setSelectedLevel5Org(value);

    const params = new URLSearchParams(window.location.search);
    params.set('page', '1');

    // Always preserve Level 4 selection
    if (selectedLevel4Org && selectedLevel4Org !== ALL_ORG_VALUE) {
      params.set('level4Org', selectedLevel4Org);
    }

    if (value === ALL_ORG_VALUE) {
      params.delete('level5Org');
    } else {
      params.set('level5Org', value);
    }

    // Preserve other parameters
    if (inputValue.trim()) {
      params.set('query', inputValue.trim());
    }
    if (excludeInactiveInterface) {
      params.set('excludeInactive', 'true');
    }

    navigate(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Search Controls Section */}
      <div className="space-y-4 relative z-50">
        {/* Application ID Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">
              Application ID
            </label>
            <div className="relative">
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
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              disabled={!inputValue.trim() || isSyncing}
              className="min-w-[100px] px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              aria-label="Search interfaces"
            >
              Search
            </button>
            <button
              onClick={handleSync}
              disabled={!inputValue.trim() || !isValidAppId(inputValue) || isSyncing}
              className="min-w-[120px] px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
        </div>

        {/* Organization Filters */}
        <div className="flex gap-4">
          {/* Level 4 Organization Dropdown */}
          <div className="w-80">
            <label htmlFor="level4-org" className="block text-sm font-medium text-gray-700 mb-1">
              Level 4 Organization
            </label>
            {isLoadingOrgs ? (
              <LoadingState size="sm" message="Loading organizations..." />
            ) : (
              <Select
                value={selectedLevel4Org}
                onValueChange={handleLevel4Change}
                disabled={isLoadingOrgs}
                name="level4-org"
              >
                <SelectTrigger className="w-full" id="level4-org">
                  <SelectValue placeholder="Select Org Level 4" />
                </SelectTrigger>
                <SelectContent
                  className="z-[60] bg-white"
                  position="popper"
                  sideOffset={4}
                  align="start"
                >
                  {level4Orgs.map((org) => (
                    <SelectItem key={org.id} value={org.id} className="relative">
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Level 5 Organization Dropdown - Only show when Level 4 is selected */}
          {selectedLevel4Org && selectedLevel4Org !== ALL_ORG_VALUE && (
            <div className="w-80">
              <label htmlFor="level5-org" className="block text-sm font-medium text-gray-700 mb-1">
                Level 5 Organization
              </label>
              <Select
                value={selectedLevel5Org}
                onValueChange={handleLevel5Change}
                disabled={isLoadingOrgs}
                name="level5-org"
              >
                <SelectTrigger className="w-full" id="level5-org">
                  <SelectValue placeholder="Select Org Level 5" />
                </SelectTrigger>
                <SelectContent
                  className="z-[60] bg-white"
                  position="popper"
                  sideOffset={4}
                  align="start"
                >
                  {level5Orgs.map((org) => (
                    <SelectItem key={org.id} value={org.id} className="relative">
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Results Table - Lower z-index */}
      <div className="relative z-0">
        {/* Error Messages */}
        {(error || orgError) && (
          <div className="rounded-lg bg-red-50 p-4 mb-4" role="alert">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-700">Error</h3>
                <div className="mt-2 text-sm text-red-600">{error || orgError}</div>
              </div>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {!error && initialData.length === 0 && (
          <div className="text-center py-12" role="status">
            <div className="text-neutral-600">No interfaces found</div>
            <p className="text-sm text-neutral-400 mt-2">
              Try searching with a different Application ID or sync with DLAS
            </p>
          </div>
        )}

        {/* Results Table */}
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
    </div>
  );
}