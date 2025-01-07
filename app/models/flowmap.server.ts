import { db } from "~/lib/db";
import { interfaces, itServices } from "../../drizzle/schema";
import { eq, or } from "drizzle-orm";
import type { ServiceStatus } from "~/types/services";

export async function searchServicesAndInterfaces(searchTerm: string) {
  try {
    // First find all interfaces connected to this app ID with a single query
    const foundInterfaces = await db
      .select()
      .from(interfaces)
      .where(
        or(
          eq(interfaces.sendAppId, searchTerm),
          eq(interfaces.receivedAppId, searchTerm)
        )
      );

    // If interfaces found, handle the connected services case
    if (foundInterfaces.length > 0) {
      // Get all unique app IDs from interfaces
      const connectedAppIds = Array.from(new Set([
        searchTerm,
        ...foundInterfaces.map(iface => iface.sendAppId),
        ...foundInterfaces.map(iface => iface.receivedAppId)
      ]).values()).filter(Boolean);

      // Find existing services for all app IDs in a single query
      const existingServices = await db
        .select()
        .from(itServices)
        .where(
          or(...connectedAppIds.map(id => eq(itServices.appInstanceId, id)))
        );

      // Create a map of existing services for efficient lookup
      const serviceMap = new Map(existingServices.map(service => [service.appInstanceId, service]));

      // Create a map of interface names for services that don't exist
      const interfaceNameMap = new Map<string, string>();
      foundInterfaces.forEach(iface => {
        if (iface.sendAppId && !serviceMap.has(iface.sendAppId)) {
          interfaceNameMap.set(iface.sendAppId, iface.sendAppName || iface.sendAppId);
        }
        if (iface.receivedAppId && !serviceMap.has(iface.receivedAppId)) {
          interfaceNameMap.set(iface.receivedAppId, iface.receivedAppName || iface.receivedAppId);
        }
      });

      // Convert connected apps to array of services
      const services = connectedAppIds.map(appId => {
        const existingService = serviceMap.get(appId);
        if (existingService) {
          return existingService;
        }

        // Create a placeholder service using interface name if available
        const appName = interfaceNameMap.get(appId) || appId;
        return {
          appInstanceId: appId,
          serviceName: appName,
          appInstanceName: appName,
          status: "ACTIVE" as ServiceStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      return {
        services,
        interfaces: foundInterfaces,
      };
    }

    // If no interfaces found, try to find a single service
    const service = await db
      .select()
      .from(itServices)
      .where(eq(itServices.appInstanceId, searchTerm))
      .limit(1);

    return {
      services: service,
      interfaces: [],
    };

  } catch (error) {
    console.error('Error in searchServicesAndInterfaces:', error);
    return {
      services: [],
      interfaces: [],
    };
  }
}
