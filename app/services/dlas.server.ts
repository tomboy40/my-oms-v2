import { env } from "~/env.server";
import type { DLASResponse, DLASInterface } from "~/types/dlas";
import { DLASResponseSchema } from "~/types/dlas";

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

  static async generateInterfaceId(iface: DLASInterface): Promise<string> {
    return await generateInterfaceId(iface);
  }
}