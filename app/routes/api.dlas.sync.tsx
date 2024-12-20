import { type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { validateRequest, handleError } from '~/utils/validation.server';
import { successResponse } from '~/utils/api.server';
import { DLASService } from '~/services/dlas.server';
import { type DLASInterface, DLASInterfaceTransformSchema } from "~/types/dlas";
import { findInterfacesByAppId, batchUpdateInactiveInterfaces, batchUpsertInterfaces } from '~/models/interface.server';

const SyncParamsSchema = z.object({
  appId: z.string().min(1, "Application ID is required")
});

interface SyncResponse {
  message: string;
  stats: {
    processed: number;
    created: number;
    updated: number;
    removed: number;
  };
  error?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    if (request.method !== 'POST') {
      return successResponse<SyncResponse>({ 
        message: 'Method not allowed',
        stats: { processed: 0, created: 0, updated: 0, removed: 0 },
        error: 'Method not allowed'
      });
    }

    const data = await validateRequest(request, SyncParamsSchema);
    console.log('[DLAS Router] Starting synchronization for appId:', data.appId);

    // Get existing interfaces efficiently
    const existingInterfaces = await findInterfacesByAppId(data.appId);

    // Fetch and process DLAS data
    const dlasResponse = await DLASService.fetchInterfaces(data.appId);
    
    // Extract raw interfaces from DLAS response
    const rawInterfaces = dlasResponse?.interface 
      ? [...dlasResponse.interface.interface_dlas_logged, ...dlasResponse.interface.interface_only_in_eim]
      : [];

    // Transform interfaces efficiently
    console.time('Transform Data');
    const transformedInterfaces = await Promise.all(
      rawInterfaces.map(async (iface: DLASInterface) => {
        if (!iface.EIMInterfaceID) {
          console.warn('[DLAS Router] Interface missing EIMInterfaceID:', iface);
        }

        try {
          const transformed = DLASInterfaceTransformSchema.parse(iface);
          return {
            ...transformed,
            id: await DLASService.generateInterfaceId(iface)
          };
        } catch (error) {
          console.error('[DLAS Router] Failed to transform interface:', iface, error);
          return null;
        }
      })
    );
    console.timeEnd('Transform Data');

    // Filter out failed transformations
    const validInterfaces = transformedInterfaces.filter((iface): iface is NonNullable<typeof iface> => iface !== null);

    // Create maps for efficient lookups
    const newInterfaceIds = new Set(validInterfaces.map(i => i.id));

    // Identify interfaces to deactivate
    const inactiveIds = existingInterfaces
      .map(i => i.id)
      .filter(id => !newInterfaceIds.has(id));

    // Perform batch operations
    console.time('DB Operations');
    const [deactivatedCount, upsertedInterfaces] = await Promise.all([
      inactiveIds.length > 0 ? batchUpdateInactiveInterfaces(inactiveIds) : Promise.resolve(0),
      validInterfaces.length > 0 ? batchUpsertInterfaces(validInterfaces) : Promise.resolve([])
    ]);
    console.timeEnd('DB Operations');

    // Calculate accurate stats
    const stats = {
      processed: validInterfaces.length + inactiveIds.length,
      created: validInterfaces.length - (existingInterfaces.length - inactiveIds.length),
      updated: existingInterfaces.length - inactiveIds.length,
      removed: inactiveIds.length
    };

    // Determine appropriate message based on operation results
    let message = 'Interfaces synchronized successfully';
    let error: string | undefined;

    if (validInterfaces.length === 0 && inactiveIds.length > 0) {
      message = 'No active interfaces found in DLAS, existing interfaces marked as inactive';
      error = 'No interfaces found in DLAS';
    } else if (validInterfaces.length === 0) {
      message = 'No interfaces found in DLAS';
      error = 'No interfaces found in DLAS';
    } else if (transformedInterfaces.length !== validInterfaces.length) {
      message = 'Some interfaces failed to transform';
      error = 'Partial sync completed with errors';
    }

    return successResponse<SyncResponse>({
      message,
      stats,
      error
    });

  } catch (error) {
    console.error('[DLAS Router] Sync error:', error);
    return handleError(error);
  }
}