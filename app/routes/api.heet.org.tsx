import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { handleError } from '~/utils/validation.server';
import { HEETService } from '~/services/heet.server';

/**
 * Loader function to handle GET requests for HEET organization data
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Fetch organization data from HEET service
    const organizations = await HEETService.fetchOrganizations();
    
    if (!organizations) {
      return json({ 
        success: false,
        error: 'Failed to fetch organization data' 
      }, { 
        status: 500 
      });
    }

    // Get unique Level 4 organizations
    const level4Orgs = HEETService.getUniqueLevel4Orgs(organizations);

    // Return success response with organizations and metadata
    return json({
      success: true,
      data: {
        organizations,
        level4Organizations: level4Orgs,
        total: organizations.length
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      }
    });

  } catch (error) {
    return handleError(error);
  }
} 