import { prisma } from "~/utils/db.server";
import type { ITService, Interface } from "@prisma/client";
import { ServiceStatus } from "~/types/services";

export async function searchServicesAndInterfaces(searchTerm: string) {
  // Find the initial service
  const mainService = await prisma.iTService.findUnique({
    where: {
      appInstanceId: searchTerm
    }
  });

  // If main service doesn't exist, return empty results
  if (!mainService) {
    return {
      services: [],
      interfaces: []
    };
  }

  // Find interfaces connected to this app ID
  const interfaces = await prisma.interface.findMany({
    where: {
      OR: [
        { sendAppId: searchTerm },
        { receivedAppId: searchTerm }
      ]
    }
  });

  // Get all unique app IDs from interfaces
  const connectedAppIds = new Set<string>();
  interfaces.forEach(iface => {
    connectedAppIds.add(iface.sendAppId);
    connectedAppIds.add(iface.receivedAppId);
  });

  // Find existing services for connected apps
  const connectedServices = connectedAppIds.size > 0 
    ? await prisma.iTService.findMany({
        where: {
          appInstanceId: {
            in: Array.from(connectedAppIds)
          }
        }
      })
    : [];

  // Create a map of existing services
  const serviceMap = new Map<string, ITService>();
  serviceMap.set(mainService.appInstanceId, mainService);
  connectedServices.forEach(service => {
    serviceMap.set(service.appInstanceId, service);
  });

  // Create placeholder services only for connected services
  const allServices: ITService[] = Array.from(connectedAppIds).map(appId => {
    const existingService = serviceMap.get(appId);
    if (existingService) {
      return existingService;
    }
    // Create a placeholder service for connected apps only
    return {
      appInstanceId: appId,
      status: ServiceStatus.INACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    } as ITService;
  });

  // Make sure the main service is included
  if (!allServices.find(s => s.appInstanceId === mainService.appInstanceId)) {
    allServices.push(mainService);
  }

  return {
    services: allServices,
    interfaces
  };
}
