import { env } from "~/env.server";
import type { HEETOrgResponse } from "~/types/heet";
import { HEETOrgResponseSchema } from "~/types/heet";

/**
 * Service class for handling HEET API interactions
 */
export class HEETService {
  /**
   * Fetches organization data from the HEET API
   * @returns Promise resolving to validated organization data or null if validation fails
   * @throws Error if the API request fails
   */
  static async fetchOrganizations(): Promise<HEETOrgResponse | null> {
    try {
      console.time('HEET API Call');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(env.HEET_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HEET API error: ${response.statusText}`);
      }

      const rawData = await response.json();
      console.timeEnd('HEET API Call');
      
      // Log the raw response for debugging
      console.log('[HEET Service] Raw API response:', JSON.stringify(rawData, null, 2));

      // Parse and validate the response
      const validation = HEETOrgResponseSchema.safeParse(rawData);
      if (validation.success) {
        console.log('[HEET Service] Successfully parsed organization data');
        return validation.data;
      }

      // If validation fails, log the error and return null
      console.error('[HEET Service] Validation error:', validation.error);
      return null;

    } catch (error) {
      console.error('[HEET Service] Error fetching organizations:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch from HEET API');
    }
  }

  /**
   * Helper method to get unique Level 4 organizations
   * @param data The full organization response
   * @returns Array of unique Level 4 organizations
   */
  static getUniqueLevel4Orgs(data: HEETOrgResponse): { id: string; name: string }[] {
    const uniqueOrgs = new Map<string, { id: string; name: string }>();
    
    data.forEach(org => {
      uniqueOrgs.set(org.level4Id, {
        id: org.level4Id,
        name: org.level4
      });
    });

    return Array.from(uniqueOrgs.values());
  }

  /**
   * Helper method to get Level 5 organizations for a specific Level 4
   * @param data The full organization response
   * @param level4Id The ID of the Level 4 organization to filter by
   * @returns Array of Level 5 organizations under the specified Level 4
   */
  static getLevel5OrgsForParent(data: HEETOrgResponse, level4Id: string): { id: string; name: string }[] {
    return data
      .filter(org => org.level4Id === level4Id && org.level === 5)
      .map(org => ({
        id: org.id,
        name: org.name
      }));
  }
} 