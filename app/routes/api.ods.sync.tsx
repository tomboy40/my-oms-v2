import { json, type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { validateRequest, handleError } from '~/utils/validation.server';
import { successResponse } from '~/utils/api.server';
import { ODSService } from '~/services/ods.server';
import { getITService, updateITService, createITService } from '~/models/service.server';
import { ServiceStatus } from '~/types/services';

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
    const odsService = await ODSService.fetchService(data.appInstanceId);
    console.timeEnd('ODS Fetch');

    // Batch database operations
    console.time('DB Operations');
    let message = 'Service synchronized successfully';
    let error: string | undefined;

    if (!odsService) {
      if (existingService) {
        await updateITService(data.appInstanceId, { ...existingService, status: ServiceStatus.INACTIVE });
        message = 'Service marked as inactive as it no longer exists in ODS';
        error = 'No service found in ODS';
      } else {
        message = 'No service found in ODS';
        error = 'No service found in ODS';
      }
    } else {
      if (existingService) {
        await updateITService(data.appInstanceId, { ...odsService, status: ServiceStatus.ACTIVE });
        message = 'Service updated successfully';
      } else {
        await createITService(odsService);
        message = 'Service created successfully';
      }
    }

    console.timeEnd('DB Operations');

    // Calculate accurate stats
    const stats = {
      processed: odsService ? 1 : 0,
      created: odsService && !existingService ? 1 : 0,
      updated: odsService && existingService ? 1 : 0,
      removed: !odsService && existingService ? 1 : 0
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