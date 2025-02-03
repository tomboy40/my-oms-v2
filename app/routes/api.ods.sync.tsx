import { json, type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { validateRequest, handleError } from '~/utils/validation.server';
import { successResponse } from '~/utils/api.server';
import { ODSService } from '~/services/ods.server';
import { getITService, updateITService, createITService } from '~/models/service.server';

// Validation schemas
const SyncParamsSchema = z.object({
  appInstanceId: z.string().min(1, "Application Instance ID is required")
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
    console.log('[ODS Router] Starting synchronization for appInstanceId:', data.appInstanceId);

    // Get existing service
    console.time('DB Fetch');
    const existingService = await getITService(data.appInstanceId);
    console.timeEnd('DB Fetch');

    // Fetch ODS data
    console.time('ODS Fetch');
    const odsResponse = await ODSService.fetchService(data.appInstanceId);
    console.timeEnd('ODS Fetch');

    // Batch database operations
    console.time('DB Operations');
    let message = 'Service synchronized successfully';
    let error: string | undefined;

    if (!odsResponse || odsResponse.results.length === 0) {
      if (existingService) {
        await updateITService(data.appInstanceId, { ...existingService, appInstStatus: "Inactive" });
        message = 'Service marked as inactive as it no longer exists in ODS';
        error = 'No service found in ODS';
      } else {
        message = 'No service found in ODS';
        error = 'No service found in ODS';
      }
    } else {
      // Get the first service from results
      const odsService = odsResponse.results[0];
      
      if (existingService) {
        await updateITService(data.appInstanceId, odsService);
        message = 'Service updated successfully';
      } else {
        await createITService(odsService);
        message = 'Service created successfully';
      }
    }

    console.timeEnd('DB Operations');

    // Calculate accurate stats
    const stats = {
      processed: odsResponse?.results.length ?? 0,
      created: !existingService && odsResponse?.results.length ? 1 : 0,
      updated: existingService && odsResponse?.results.length ? 1 : 0,
      removed: !odsResponse?.results.length && existingService ? 1 : 0
    };

    return successResponse<SyncResponse>({
      message,
      stats,
      error
    });
  } catch (error) {
    console.error('[ODS Router] Sync error:', error);
    return handleError(error);
  }
}