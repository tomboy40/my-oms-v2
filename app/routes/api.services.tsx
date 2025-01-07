import { type LoaderFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { handleError } from '~/utils/validation.server';
import { successResponse, paginationParams } from '~/utils/api.server';
import { db } from '~/lib/db';
import { itServices } from '../../drizzle/schema';
import { eq, or, and, sql, desc, asc } from 'drizzle-orm';

// Validation schemas
const SearchParamsSchema = z.object({
  query: z.string().optional(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const searchParams = SearchParamsSchema.parse({
      query: url.searchParams.get('query'),
    });

    const { limit, offset, sortBy, sortDirection } = paginationParams(request);

    // Build search conditions
    const conditions = [];
    
    if (searchParams.query) {
      if (/^\d+$/.test(searchParams.query)) {
        conditions.push(eq(itServices.appInstanceId, searchParams.query));
      } else {
        const searchQuery = `%${searchParams.query.toLowerCase()}%`;
        conditions.push(
          or(
            sql`LOWER(${itServices.serviceName}) LIKE ${searchQuery}`,
            sql`LOWER(${itServices.appInstanceName}) LIKE ${searchQuery}`
          )
        );
      }
    }

    // Execute query with pagination
    const [results, total] = await Promise.all([
      db.select()
        .from(itServices)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(sortDirection === 'desc' ? desc(itServices[sortBy || 'serviceName']) : asc(itServices[sortBy || 'serviceName']))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(itServices)
        .where(conditions.length ? and(...conditions) : undefined)
        .then(result => Number(result[0].count))
    ]);

    return successResponse({
      services: results,
      total,
    }, {
      total,
      limit,
      offset
    });

  } catch (error) {
    return handleError(error);
  }
}
