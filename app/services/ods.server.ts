import { env } from "~/env.server";
import { ODSResponse, ODSResponseSchema } from "~/types/ods";

export class ODSService {
  static async fetchService(appInstanceId: string): Promise<ODSResponse | null> {
    try {
      if (!appInstanceId) {
        throw new Error("Application Instance ID is required");
      }

      console.time('ODS API Call');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${env.ODS_API_URL}?appid=${encodeURIComponent(appInstanceId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ODS API error: ${response.statusText}`);
      }

      const rawData = await response.json();
      console.timeEnd('ODS API Call');
      
      // Log the raw response for debugging
      console.log('[ODS Service] Raw API response:', JSON.stringify(rawData, null, 2));

      // Parse the response as a single object
      const validation = ODSResponseSchema.safeParse(rawData);
      if (validation.success) {
        console.log('[ODS Service] Successfully parsed service response');
        return validation.data;
      }

      // If validation fails, log the error and return null
      console.error('[ODS Service] Validation error:', validation.error);
      return null;

    } catch (error) {
      console.error('[ODS Service] Error fetching service:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch from ODS');
    }
  }
}