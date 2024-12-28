import { prisma } from "~/utils/db.server";
import type { ITService, Interface } from "@prisma/client";
import { ServiceStatus } from "~/types/services";

export async function searchServicesAndInterfaces(searchTerm: string) {
  // First find all interfaces connected to this app ID
  const interfaces = await prisma.interface.findMany({
    where: {
      OR: [
        { sendAppId: searchTerm },
        { receivedAppId: searchTerm }
      ]
    }
  });

  // If interfaces found, handle the connected services case
  if (interfaces.length > 0) {
    // Get all unique app IDs from interfaces
    const connectedApps = new Map<string, string>();
    connectedApps.set(searchTerm, searchTerm); // Initialize with search term

    interfaces.forEach(iface => {
      if (iface.sendAppId) {
        connectedApps.set(iface.sendAppId, iface.sendAppName || iface.sendAppId);
      }
      if (iface.receivedAppId) {
        connectedApps.set(iface.receivedAppId, iface.receivedAppName || iface.receivedAppId);
      }
    });

    // Find existing services for all app IDs
    const existingServices = await prisma.iTService.findMany({
      where: {
        appInstanceId: {
          in: Array.from(connectedApps.keys())
        }
      }
    });

    // Create a map of existing services
    const serviceMap = new Map<string, ITService>();
    existingServices.forEach(service => {
      serviceMap.set(service.appInstanceId, service);
    });

    // Convert connected apps to array of services
    const services = Array.from(connectedApps.entries()).map(([appId, appName]) => {
      const existingService = serviceMap.get(appId);
      
      if (existingService) {
        return {
          ...existingService,
          isParent: appId === searchTerm
        };
      }
      
      // Create a dummy service with app name
      return {
        appInstanceId: appId,
        serviceName: appName,
        status: ServiceStatus.TBC,
        isParent: appId === searchTerm
      } as ITService;
    });

    return {
      services,
      interfaces
    };
  }

  // If no interfaces found, check if the service exists in ITService
  const searchedService = await prisma.iTService.findUnique({
    where: {
      appInstanceId: searchTerm
    }
  });

  if (searchedService) {
    return {
      services: [{
        ...searchedService,
        isParent: true
      }],
      interfaces: []
    };
  }

  // If service not found in both interfaces and ITService, return empty arrays
  return {
    services: [],
    interfaces: []
  };
}
