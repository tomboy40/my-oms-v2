import { type LoaderFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { handleError } from '~/utils/validation.server';
import { successResponse, paginationParams } from '~/utils/api.server';
import type { ITService } from '~/types/db';
import type { Prisma } from '@prisma/client';
import { prisma } from '~/utils/db.server';

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

    const whereClause: Prisma.ITServiceWhereInput = {
      AND: [
        searchParams.query ? {
          OR: /^\d+$/.test(searchParams.query)
            ? [{ appInstanceId: searchParams.query }]
            : [
                { serviceName: { contains: searchParams.query.toLowerCase() } },
                { appInstanceName: { contains: searchParams.query.toLowerCase() } }
              ]
        } : {}
      ]
    };

    const [services, total] = await Promise.all([
      prisma.iTService.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: sortBy && sortDirection 
          ? { [sortBy]: sortDirection }
          : { serviceName: 'asc' }
      }),
      prisma.iTService.count({ where: whereClause })
    ]);

    return successResponse<{ services: ITService[]; total: number }>(
      { services, total },
      { total, limit, offset }
    );
  } catch (error) {
    return handleError(error);
  }
}
