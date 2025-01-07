import { type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { validateRequest, handleError } from '~/utils/validation.server';
import { successResponse } from '~/utils/api.server';
import { DLASService } from '~/services/dlas.server';
import { type DLASInterface, DLASInterfaceTransformSchema } from "~/types/dlas";
import { db } from '~/lib/db';
import { interfaces } from '../../drizzle/schema';
import { eq, or, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

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
    const existingInterfaces = await db.select()
      .from(interfaces)
      .where(
        or(
          eq(interfaces.sendAppId, data.appId),
          eq(interfaces.receivedAppId, data.appId)
        )
      );

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
        const validatedData = await DLASInterfaceTransformSchema.parseAsync(iface);
        const existingInterface = existingInterfaces.find(existing => existing.id === validatedData.id);
        return {
          ...validatedData,
          // Preserve existing application-specific fields if they exist
          ...(existingInterface ? {
            createdAt: existingInterface.createdAt,
            updatedAt: existingInterface.updatedAt,
            isActive: true
          } : {
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
          })
        };
      })
    );
    console.timeEnd('Transform Data');

    // Calculate interfaces to be marked as inactive
    const activeInterfaceIds = new Set(transformedInterfaces.map(iface => iface.id));
    const inactiveInterfaceIds = existingInterfaces
      .filter(iface => !activeInterfaceIds.has(iface.id))
      .map(iface => iface.id);

    // Batch update inactive interfaces
    if (inactiveInterfaceIds.length > 0) {
      await db.update(interfaces)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(inArray(interfaces.id, inactiveInterfaceIds));
    }

    // Batch upsert transformed interfaces
    if (transformedInterfaces.length > 0) {
      for (const iface of transformedInterfaces) {
        await db.insert(interfaces)
          .values({
            id: iface.id,
            interfaceName: iface.interfaceName,
            sendAppId: iface.sendAppId,
            sendAppName: iface.sendAppName,
            receivedAppId: iface.receivedAppId,
            receivedAppName: iface.receivedAppName,
            status: iface.status,
            direction: iface.direction,
            eimInterfaceId: iface.eimInterfaceId,
            transferType: iface.transferType,
            frequency: iface.frequency,
            technology: iface.technology,
            pattern: iface.pattern,
            relatedDrilldownKey: iface.relatedDrilldownKey,
            demiseDate: iface.demiseDate,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
          })
          .onConflictDoUpdate({
            target: interfaces.id,
            set: {
              updatedAt: new Date(),
              isActive: true
            }
          });
      }
    }

    // Return success response with stats
    return successResponse<SyncResponse>({
      message: 'Synchronization completed successfully',
      stats: {
        processed: rawInterfaces.length,
        created: transformedInterfaces.length - existingInterfaces.length,
        updated: Math.min(transformedInterfaces.length, existingInterfaces.length),
        removed: inactiveInterfaceIds.length
      }
    });

  } catch (error) {
    console.error('[DLAS Router] Error during synchronization:', error);
    return handleError(error);
  }
}