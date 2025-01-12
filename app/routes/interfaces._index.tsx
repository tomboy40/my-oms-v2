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
import { sql, and, or, eq } from "drizzle-orm";
import { parseSettings } from "~/utils/settings.server";

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
  'interfaceStatus',
  'updatedAt',
] as const;

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const settings = parseSettings(request);

    // Get search params and build where clause
    const rawParams = {
      query: url.searchParams.get('query') || undefined,
      page: Number(url.searchParams.get('page')) || 1,
      pageSize: Number(url.searchParams.get('pageSize')) || 10,
      sortBy: url.searchParams.get('sortBy') || undefined,
      sortDirection: url.searchParams.get('sortDirection') as 'asc' | 'desc' | undefined,
    };

    const searchParams = validateSearchParams(
      rawParams,
      [...ALLOWED_SORT_FIELDS],
      [] // No filters needed
    );

    console.log('Search params:', searchParams);

    const conditions: sql.SQL[] = [];
    
    // Add search conditions if any
    if (searchParams.query) {
      if (/^\d+$/.test(searchParams.query)) {
        // If query is numeric, search in app IDs
        conditions.push(
          or(
            eq(interfaces.sendAppId, searchParams.query.toString()),
            eq(interfaces.receivedAppId, searchParams.query.toString())
          )
        );
      } else {
        // Otherwise search in text fields
        const searchWhereClause = buildSearchWhereClause(
          searchParams,
          [...SEARCHABLE_FIELDS],
          [...EXACT_MATCH_FIELDS],
          interfaces
        );
        if (searchWhereClause) {
          conditions.push(searchWhereClause);
        }
      }
    }
    
    // Add inactive filter if enabled
    if (settings.excludeInactiveInterface) {
      conditions.push(sql`(${interfaces.interfaceStatus} = 'ACTIVE')`);
    }

    // Build the final where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    console.log(`WHERE clause: ${whereClause?.sql || '(none)'}`);

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(interfaces)
      .where(whereClause);
    
    const total = totalResult[0].count;

    // Get paginated results
    const results = await db
      .select()
      .from(interfaces)
      .where(whereClause)
      .orderBy(...buildSearchOrderBy(
        searchParams,
        [...SEARCHABLE_FIELDS],
        [],
        interfaces
      ))
      .limit(searchParams.pageSize)
      .offset((searchParams.page - 1) * searchParams.pageSize);

    return json<LoaderData>({ interfaces: results, total });

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
      }}
    />
  );
}