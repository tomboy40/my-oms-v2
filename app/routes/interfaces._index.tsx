import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, useNavigation } from "@remix-run/react";
import { SearchInterface } from "~/components/interfaces/search-interface";
import { InterfaceSkeleton } from "~/components/interfaces/interface-skeleton";
import { db } from "~/lib/db";
import { interfaces } from "../../drizzle/schema";
import { 
  buildSearchWhereClause, 
  buildSearchOrderBy, 
  validateSearchParams,
  type SearchParams
} from "~/utils/search.server";
import type { Interface } from "~/types/db";
import { handleError } from '~/utils/validation.server';
import { z } from 'zod';
import { sql } from "drizzle-orm";

interface LoaderData {
  interfaces: Interface[];
  total: number;
  error?: string;
}

const SEARCHABLE_FIELDS = [
  'interfaceName',
  'sendAppName',
  'receivedAppName',
] as const;

const EXACT_MATCH_FIELDS = [
  'sendAppId',
  'receivedAppId',
] as const;

const ALLOWED_SORT_FIELDS = [
  'interfaceName',
  'sendAppName',
  'receivedAppName',
  'status',
  'priority',
  'updatedAt',
] as const;

const ALLOWED_FILTERS = [
  'status',
  'priority',
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
      sortBy: url.searchParams.get('sortBy') || 'interfaceName',
      sortDirection: (url.searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc',
      filters: {
        status: url.searchParams.get('status') || undefined,
        priority: url.searchParams.get('priority') || undefined,
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
      interfaces
    );

    const orderBy = buildSearchOrderBy(
      validatedParams,
      'interfaceName',
      interfaces
    );

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(interfaces)
      .where(whereClause || sql`1=1`);

    const total = Number(totalResult[0]?.count || 0);

    // Get paginated results
    const results = await db
      .select()
      .from(interfaces)
      .where(whereClause || sql`1=1`)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return json<LoaderData>({
      interfaces: results,
      total,
    });

  } catch (error) {
    console.error('Error loading interfaces:', error);
    return json<LoaderData>({
      interfaces: [],
      total: 0,
      error: error instanceof Error ? error.message : 'An error occurred while loading interfaces'
    }, {
      status: 500
    });
  }
}

export default function InterfacesPage() {
  const { interfaces, total, error } = useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();

  const isLoading = navigation.state === "loading";

  if (isLoading) {
    return <InterfaceSkeleton />;
  }

  return (
    <SearchInterface
      initialData={interfaces}
      total={total}
      error={error}
      searchParams={{
        query: searchParams.get('query') || '',
        sortBy: searchParams.get('sortBy') || 'interfaceName',
        sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc',
        page: Number(searchParams.get('page')) || 1,
        pageSize: Number(searchParams.get('pageSize')) || 10,
        filters: {
          status: searchParams.get('status') || undefined,
          priority: searchParams.get('priority') || undefined
        }
      }}
    />
  );
}