import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { db } from '~/lib/db';
import { interfaces } from '../../drizzle/schema';
import { handleError } from '~/utils/validation.server';
import { successResponse, paginationParams } from '~/utils/api.server';
import { eq, or, and, like, sql, desc, asc } from 'drizzle-orm';

// Validation schemas
const SearchParamsSchema = z.object({
  query: z.string().optional().nullable(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  excludeInactive: z.string().optional().transform(val => val === 'true'),
}).transform(data => ({
  query: data.query || undefined,
  sortBy: data.sortBy,
  sortDirection: data.sortDirection || 'asc',
  limit: data.limit || 10,
  offset: data.offset || 0,
  excludeInactive: data.excludeInactive,
}));

const UpdateSchema = z.object({
  id: z.string().min(1, "Interface ID is required"),
  sla: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).optional(),
  remarks: z.string().nullable(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const searchParams = SearchParamsSchema.parse({
      query: url.searchParams.get('query'),
      sortBy: url.searchParams.get('sortBy'),
      sortDirection: url.searchParams.get('sortDirection') as 'asc' | 'desc',
      excludeInactive: url.searchParams.get('excludeInactive'),
    });

    const { limit, offset } = paginationParams(request);

    // Build search conditions
    const conditions = [];
    
    if (searchParams.query) {
      if (/^\d+$/.test(searchParams.query)) {
        conditions.push(
          or(
            eq(interfaces.sendAppId, searchParams.query),
            eq(interfaces.receivedAppId, searchParams.query)
          )
        );
      } else {
        const searchQuery = `%${searchParams.query.toLowerCase()}%`;
        conditions.push(
          or(
            sql`LOWER(${interfaces.interfaceName}) LIKE ${searchQuery}`,
            sql`LOWER(${interfaces.sendAppName}) LIKE ${searchQuery}`,
            sql`LOWER(${interfaces.receivedAppName}) LIKE ${searchQuery}`
          )
        );
      }
    }

    // Add exclude inactive condition if enabled
    if (searchParams.excludeInactive) {
      conditions.push(eq(interfaces.interfaceStatus, 'ACTIVE'));
    }

    // Build the final where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Execute query with pagination
    const [results, total] = await Promise.all([
      db.select()
        .from(interfaces)
        .where(whereClause)
        .orderBy(searchParams.sortDirection === 'desc' ? 
          desc(interfaces[searchParams.sortBy || 'interfaceName']) : 
          asc(interfaces[searchParams.sortBy || 'interfaceName']))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(interfaces)
        .where(whereClause)
        .then(result => Number(result[0].count))
    ]);

    return successResponse({
      interfaces: results,
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

export async function action({ request }: ActionFunctionArgs) {
  try {
    if (request.method !== 'PUT') {
      return json({ error: 'Method not allowed' }, { status: 405 });
    }

    let data;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      data = {
        id: formData.get("id"),
        sla: formData.get("sla"),
        priority: formData.get("priority"),
        remarks: formData.get("remarks"),
      };
    }

    // Validate the data
    const validatedData = UpdateSchema.parse(data);

    // Check if interface exists
    const existingInterface = await db.select()
      .from(interfaces)
      .where(eq(interfaces.id, validatedData.id))
      .limit(1);

    if (!existingInterface.length) {
      return json({ error: 'Interface not found' }, { status: 404 });
    }

    // Update the interface
    await db.update(interfaces)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(interfaces.id, validatedData.id));

    return successResponse({
      id: validatedData.id,
      sla: validatedData.sla,
      priority: validatedData.priority,
      remarks: validatedData.remarks,
      updatedAt: new Date(),
    });

  } catch (error) {
    return handleError(error);
  }
}