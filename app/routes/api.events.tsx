import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { handleError } from '~/utils/validation.server';
import { successResponse, paginationParams } from '~/utils/api.server';
import { getEventsPaginated, updateEvent } from "~/models/event.server";

// Validation schemas
const SearchParamsSchema = z.object({
  datasetId: z.string().optional(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const searchParams = SearchParamsSchema.parse({
      datasetId: url.searchParams.get('datasetId'),
    });

    const { limit, offset } = paginationParams(request);

    const { events, total } = await getEventsPaginated(
      searchParams.datasetId,
      limit,
      offset
    );

    return successResponse({
      events,
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
