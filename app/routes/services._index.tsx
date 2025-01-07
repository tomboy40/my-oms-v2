import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, useNavigation } from "@remix-run/react";
import { sql } from "drizzle-orm";
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
    
    // Get and validate pagination parameters
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 10));
    
    const searchParams = {
      query: url.searchParams.get('query') || undefined,
      page,
      pageSize,
      sortBy: url.searchParams.get('sortBy') || 'serviceName',
      sortDirection: (url.searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc',
      filters: {
        appInstStatus: url.searchParams.get('appInstStatus') || undefined,
        environment: url.searchParams.get('environment') || undefined,
        appCriticality: url.searchParams.get('appCriticality') || undefined,
      }
    };

    const validatedParams = validateSearchParams(
      searchParams,
      ALLOWED_SORT_FIELDS as unknown as string[],
      ALLOWED_FILTERS as unknown as string[]
    );

    // Calculate limit and offset from validated page and pageSize
    const limit = validatedParams.pageSize;
    const offset = (validatedParams.page - 1) * validatedParams.pageSize;

    // Debug log
    console.log('Pagination:', { page: validatedParams.page, pageSize: validatedParams.pageSize, limit, offset });

    const whereClause = buildSearchWhereClause(
      validatedParams,
      SEARCHABLE_FIELDS as unknown as string[],
      EXACT_MATCH_FIELDS as unknown as string[],
      itServices
    );

    const orderBy = buildSearchOrderBy(
      validatedParams,
      'serviceName',
      itServices
    );

    // Debug log
    console.log('Search params:', {
      query: validatedParams.query,
      page: validatedParams.page,
      pageSize: validatedParams.pageSize,
      sortBy: validatedParams.sortBy,
      sortDirection: validatedParams.sortDirection,
      filters: validatedParams.filters
    });

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(itServices)
      .where(whereClause || sql`1=1`);

    const total = Number(totalResult[0]?.count || 0);

    // Get paginated results
    const services = await db
      .select()
      .from(itServices)
      .where(whereClause || sql`1=1`)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return json<LoaderData>({
      services,
      total
    });

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