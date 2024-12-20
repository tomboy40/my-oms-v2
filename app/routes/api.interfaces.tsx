import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { prisma } from '~/utils/db.server';
import { handleError } from '~/utils/validation.server';
import { successResponse, paginationParams } from '~/utils/api.server';
import type { Interface } from '~/types/db';
import type { Prisma } from '@prisma/client';

// Validation schemas
const SearchParamsSchema = z.object({
  query: z.string().optional().nullable(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
}).transform(data => ({
  query: data.query || undefined,
  sortBy: data.sortBy,
  sortDirection: data.sortDirection || 'asc',
  limit: data.limit || 10,
  offset: data.offset || 0,
}));

const UpdateSchema = z.object({
  id: z.string().min(1, "Interface ID is required"),
  sla: z.string().min(1).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).optional(),
  remarks: z.string().nullable(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const searchParams = SearchParamsSchema.parse({
      query: url.searchParams.get('query'),
    });

    const { limit, offset, sortBy, sortDirection } = paginationParams(request);

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

    const [interfaces, total] = await Promise.all([
      prisma.interface.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: sortBy && sortDirection 
          ? { [sortBy]: sortDirection }
          : { interfaceName: 'asc' }
      }),
      prisma.interface.count({ where: whereClause })
    ]);

    return successResponse<{ interfaces: Interface[]; total: number }>(
      { interfaces, total },
      { total, limit, offset }
    );
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

    const interface_ = await prisma.interface.findUnique({
      where: { id: validatedData.id }
    });

    if (!interface_) {
      return json({ error: 'Interface not found' }, { status: 404 });
    }

    const updatedInterface = await prisma.interface.update({
      where: { id: validatedData.id },
      data: {
        sla: validatedData.sla,
        priority: validatedData.priority,
        remarks: validatedData.remarks,
        updatedAt: new Date(),
      },
    });

    return successResponse(updatedInterface);
  } catch (error) {
    return handleError(error);
  }
} 