import { env } from "~/env.server";
import type { DLASResponse, DLASInterface, DLASEvent } from "~/types/dlas";
import { DLASResponseSchema, DLASEventSchema } from "~/types/dlas";

// Memoize the hash function for better performance
const hashCache = new Map<string, string>();

// Helper function to convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper function to encode string to ArrayBuffer
function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str);
}

export async function generateInterfaceId(dlasInterface: DLASInterface): Promise<string> {
  // Create a minimal key string with only necessary fields
  const keyFields = [
    dlasInterface.SendAppID,
    dlasInterface.ReceivedAppID,
    dlasInterface.EIMInterfaceID ?? '',
    dlasInterface.InterfaceName ?? dlasInterface.EIMInterfaceName ?? '',
    dlasInterface.TransferType,
    dlasInterface.Frequency,
    dlasInterface.Technology,
    dlasInterface.Pattern,
    dlasInterface.Direction
  ].join('|');

  // Check cache first
  const cached = hashCache.get(keyFields);
  if (cached) return cached;

  // Generate hash if not cached
  const msgBuffer = stringToBuffer(keyFields);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hash = bufferToHex(hashBuffer);

  // Cache the result
  hashCache.set(keyFields, hash);
  return hash;
}

export class DLASService {
  static async fetchInterfaces(appId: string): Promise<DLASResponse | null> {
    try {
      if (!appId) {
        throw new Error("Application ID is required");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${env.DLAS_API_URL}?appid=${appId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DLAS API error: ${response.statusText}`);
      }

      const rawData = await response.json();
      
      // Log the raw response for debugging
      console.log('[DLAS Service] Raw API response:', JSON.stringify(rawData, null, 2));

      // Parse the response as a single object
      const validation = DLASResponseSchema.safeParse(rawData);
      if (validation.success) {
        console.log('[DLAS Service] Successfully parsed service response');
        return validation.data;
      }

      // If validation fails, log the error and return null
      console.error('[DLAS Service] Validation error:', validation.error);
      return null;

    } catch (error) {
      console.error('[DLAS Service] Error fetching interfaces:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch from DLAS');
    }

  }

  static async fetchEvents(relatedDrilldownKeys: string[]): Promise<DLASEvent[] | null> {
    try {
      if (!relatedDrilldownKeys.length) {
        throw new Error("At least one RelatedDrilldownKey is required");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(env.DLAS_EVT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(relatedDrilldownKeys),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DLAS Events API error: ${response.statusText}`);
      }

      const rawData = await response.json();
      
      // Log the raw response for debugging
      console.log('[DLAS Service] Raw Events API response:', JSON.stringify(rawData, null, 2));

      // Parse each event in the array
      if (Array.isArray(rawData)) {
        const validatedEvents = await Promise.all(
          rawData.map(async (event) => {
            const validation = DLASEventSchema.safeParse(event);
            if (validation.success) {
              return validation.data;
            }
            console.error('[DLAS Service] Event validation error:', validation.error);
            return null;
          })
        );

        // Filter out any null values from failed validations
        const events = validatedEvents.filter((event): event is DLASEvent => event !== null);

        console.log(`[DLAS Service] Successfully parsed ${events.length} events`);
        return events;
      }

      console.error('[DLAS Service] Expected array of events but got:', typeof rawData);
      return null;

    } catch (error) {
      console.error('[DLAS Service] Error fetching events:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch events from DLAS');
    }
  }

  static async generateInterfaceId(iface: DLASInterface): Promise<string> {
    return await generateInterfaceId(iface);
  }
}