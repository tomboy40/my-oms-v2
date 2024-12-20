import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, useNavigation } from "@remix-run/react";
import { SearchServices } from "~/components/services/search-services";
import { ServiceSkeleton } from "~/components/services/service-skeleton";
import { prisma } from "~/utils/db.server";
import { 
  buildSearchWhereClause, 
  buildSearchOrderBy, 
  buildPaginationParams,
  validateSearchParams,
  type SearchParams,
  type WhereClause,
  type OrderByClause
} from "~/utils/search.server";
import type { ITService } from "@prisma/client";

interface LoaderData {
  services: ITService[];
  total: number;
  error?: string;
}

const SEARCHABLE_FIELDS = [
  'serviceName',
  'appInstanceName',
  'appDescription',
  'itServiceOwner',
  'itServiceOwnerDelegate',
] as const;

const EXACT_MATCH_FIELDS = [
  'appInstanceId',
  'pladaServiceId',
  'itServiceOwnerId',
  'itServiceOwnerDelegateId',
] as const;

const ALLOWED_SORT_FIELDS = [
  'serviceName',
  'appInstanceName',
  'appCriticality',
  'environment',
  'appInstStatus',
  'itServiceOwner',
  'updatedAt',
] as const;

const ALLOWED_FILTERS = [
  'appInstStatus',
  'environment',
  'appCriticality',
  'status',
] as const;

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Verify db connection
    if (!prisma) {
      throw new Error('Database connection not initialized');
    }

    const url = new URL(request.url);
    const searchParams: SearchParams = {
      query: url.searchParams.get("query") || undefined,
      limit: Number(url.searchParams.get("limit")) || 10,
      offset: Number(url.searchParams.get("offset")) || 0,
      sortBy: url.searchParams.get("sortBy") || undefined,
      sortDirection: (url.searchParams.get("sortDirection") || 'asc') as 'asc' | 'desc',
      filters: {
        appInstStatus: url.searchParams.get("appInstStatus") || undefined,
        environment: url.searchParams.get("environment") || undefined,
        appCriticality: url.searchParams.get("appCriticality") || undefined,
        status: url.searchParams.get("status") || undefined,
      }
    };

    // Validate and sanitize search parameters
    const validatedParams = validateSearchParams(
      searchParams,
      ALLOWED_SORT_FIELDS,
      ALLOWED_FILTERS
    );

    // Build search query
    const whereClause = buildSearchWhereClause(
      validatedParams,
      SEARCHABLE_FIELDS,
      EXACT_MATCH_FIELDS
    ) as WhereClause;

    // Build sort query
    const orderBy = buildSearchOrderBy(validatedParams, 'serviceName') as OrderByClause;

    // Get pagination parameters
    const { limit, offset } = buildPaginationParams(validatedParams);

    // Execute search query with pagination
    const [services, total] = await Promise.all([
      prisma.iTService.findMany({
        where: whereClause,
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.iTService.count({ where: whereClause })
    ]);

    return json<LoaderData>({ services, total });
  } catch (error) {
    console.error("Error loading services:", error);
    return json<LoaderData>(
      { 
        services: [], 
        total: 0,
        error: error instanceof Error ? error.message : "Failed to load services" 
      },
      { status: 500 }
    );
  }
}

export default function ServicesPage() {
  const { services, total, error } = useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">IT Service Management</h1>
      
      {isLoading ? (
        <ServiceSkeleton />
      ) : (
        <SearchServices
          initialData={services}
          total={total}
          error={error}
          searchParams={{
            query: searchParams.get("query") || "",
            limit: Number(searchParams.get("limit")) || 10,
            offset: Number(searchParams.get("offset")) || 0,
            sortBy: searchParams.get("sortBy") || "serviceName",
            sortDirection: (searchParams.get("sortDirection") || "asc") as "asc" | "desc"
          }}
        />
      )}
    </div>
  );
} 