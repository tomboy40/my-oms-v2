import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, useNavigation } from "@remix-run/react";
import { SearchInterface } from "~/components/interfaces/search-interface";
import { InterfaceSkeleton } from "~/components/interfaces/interface-skeleton";
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
import type { Interface } from "@prisma/client";
import { handleError } from '~/utils/validation.server';
import { z } from 'zod';

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
  'eimInterfaceId',
] as const;

const ALLOWED_SORT_FIELDS = [
  'interfaceName',
  'sendAppName',
  'receivedAppName',
  'status',
  'priority',
  'updatedAt',
  'eimInterfaceId',
  'sendAppId',
  'receivedAppId',
  'transferType',
  'frequency',
  'technology',
  'pattern',
  'direction',
  'interfaceStatus',
  'sla',
  'remarks'
] as const;

const ALLOWED_FILTERS = [
  'status',
  'interfaceStatus',
  'priority',
  'direction',
] as const;

const SearchParamsSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']),
});

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Verify prisma connection
    if (!prisma) {
      throw new Error('Database connection not initialized');
    }

    const url = new URL(request.url);
    const searchParams = SearchParamsSchema.parse({
      query: url.searchParams.get("query") || undefined,
      limit: Number(url.searchParams.get("limit")) || 10,
      offset: Number(url.searchParams.get("offset")) || 0,
      sortBy: url.searchParams.get("sortBy") || undefined,
      sortDirection: (url.searchParams.get("sortDirection") || 'asc') as 'asc' | 'desc',
    });

    // Build search query using simple contains for both databases
    const whereClause: Prisma.InterfaceWhereInput = {
      AND: [
        searchParams.query ? {
          OR: /^\d+$/.test(searchParams.query)
            ? [
                { sendAppId: searchParams.query },
                { receivedAppId: searchParams.query }
              ]
            : [
                { interfaceName: { contains: searchParams.query.toLowerCase() } },
                { sendAppName: { contains: searchParams.query.toLowerCase() } },
                { receivedAppName: { contains: searchParams.query.toLowerCase() } }
              ]
        } : {}
      ]
    };

    // Get pagination parameters
    const { limit, offset } = buildPaginationParams(searchParams);

    // Execute search query with pagination
    const [interfaces, total] = await Promise.all([
      prisma.interface.findMany({
        where: whereClause,
        orderBy: searchParams.sortBy && searchParams.sortDirection 
          ? { [searchParams.sortBy]: searchParams.sortDirection }
          : { interfaceName: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.interface.count({ where: whereClause })
    ]);

    return json<LoaderData>({ interfaces, total });
  } catch (error) {
    console.error("Error loading interfaces:", error);
    return handleError(error);
  }
}

export default function InterfacesPage() {
  const { interfaces, total, error } = useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Interface Management</h1>
      
      {isLoading ? (
        <InterfaceSkeleton />
      ) : (
        <SearchInterface
          initialData={interfaces}
          total={total}
          error={error}
          searchParams={{
            query: searchParams.get("query") || "",
            limit: Number(searchParams.get("limit")) || 10,
            offset: Number(searchParams.get("offset")) || 0,
            sortBy: searchParams.get("sortBy") || "interfaceName",
            sortDirection: (searchParams.get("sortDirection") || "asc") as "asc" | "desc"
          }}
        />
      )}
    </div>
  );
} 