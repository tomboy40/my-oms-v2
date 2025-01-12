import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, useNavigation } from "@remix-run/react";
import { sql, and } from "drizzle-orm";
import { SearchServices } from "~/components/services/search-services";
import { ServiceSkeleton } from "~/components/services/service-skeleton";
import { db } from "~/lib/db";
import { itServices } from "../../drizzle/schema";
import { 
  buildSearchWhereClause, 
  buildSearchOrderBy, 
  buildPaginationParams,
  validateSearchParams,
  type SearchParams,
} from "~/utils/search.server";
import { parseSettings } from "~/utils/settings.server";

interface LoaderData {
  services: typeof itServices.$inferSelect[];
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
  'id',
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
] as const;

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const settings = parseSettings(request);

    // Get search params and build where clause
    const searchParams = validateSearchParams(url.searchParams, {
      searchableFields: SEARCHABLE_FIELDS,
      exactMatchFields: EXACT_MATCH_FIELDS,
      allowedSortFields: ALLOWED_SORT_FIELDS,
      allowedFilters: ALLOWED_FILTERS,
    });

    const conditions: SQL[] = [];
    
    // Add search conditions if any
    const searchWhereClause = buildSearchWhereClause(searchParams);
    if (searchWhereClause) {
      conditions.push(searchWhereClause);
    }
    
    // Add inactive filter if enabled
    if (settings.excludeInactiveService) {
      conditions.push(sql`(${itServices.appInstStatus} = 'Active')`);
    }

    // Combine all conditions with AND
    const whereClause = conditions.length > 0 ? sql`${and(...conditions)}` : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(itServices)
      .where(whereClause || sql`1=1`);
    
    const total = totalResult[0].count;

    // Get paginated results
    const results = await db
      .select()
      .from(itServices)
      .where(whereClause || sql`1=1`)
      .orderBy(...buildSearchOrderBy(
        searchParams,
        SEARCHABLE_FIELDS,
        EXACT_MATCH_FIELDS,
        itServices
      ))
      .limit(searchParams.pageSize)
      .offset((searchParams.page - 1) * searchParams.pageSize);

    return json<LoaderData>({ services: results, total });
  } catch (error) {
    console.error('Error loading services:', error);
    return json<LoaderData>({
      services: [],
      total: 0,
      error: error instanceof Error ? error.message : 'An error occurred while loading services'
    }, {
      status: 500
    });
  }
}

export default function ServicesPage() {
  const { services, total, error } = useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();

  const isLoading = navigation.state === "loading";

  if (isLoading) {
    return <ServiceSkeleton />;
  }

  return (
    <SearchServices
      initialData={services}
      total={total}
      error={error}
      searchParams={{
        query: searchParams.get('query') || '',
        sortBy: searchParams.get('sortBy') || 'serviceName',
        sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc',
        page: Number(searchParams.get('page')) || 1,
        pageSize: Number(searchParams.get('pageSize')) || 10,
        filters: {
          appInstStatus: searchParams.get('appInstStatus') || undefined,
          environment: searchParams.get('environment') || undefined,
          appCriticality: searchParams.get('appCriticality') || undefined,
        }
      }}
    />
  );
}