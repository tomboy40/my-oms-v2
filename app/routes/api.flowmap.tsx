import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { z } from 'zod';
import { searchServicesAndInterfaces } from "~/models/flowmap.server";
import type { FlowMapNode, FlowMapEdge, Interface, LoaderData, Service } from "~/types/flowMap";
import { handleError } from '~/utils/validation.server';
import { successResponse } from '~/utils/api.server';

// Validation schema
const SearchParamsSchema = z.object({
  appId: z.string().min(1, "App ID is required"),
  action: z.enum(["search", "expand"]).default("search"),
});

// Node positions (x: 0, y: 0) are placeholders that will be recalculated by the frontend layout engine
function createParentNode(searchedService: Service): FlowMapNode {
  return {
    id: searchedService.appInstanceId,
    type: 'service',
    data: {
      label: searchedService.serviceName || searchedService.appInstanceId,
      service: searchedService,
      isExpanded: true,
      status: searchedService.status
    },
    position: { x: 0, y: 0 }
  };
}

function createChildNodes(parentId: string, services: Service[]): FlowMapNode[] {
  return services
    .filter(service => service.appInstanceId !== parentId)
    .map(service => ({
      id: service.appInstanceId,
      type: 'service',
      data: {
        label: service.serviceName || service.appInstanceId,
        service,
        isExpanded: false,
        parentId,
        status: service.status
      },
      position: { x: 0, y: 0 }
    }));
}

function transformInterfacesToEdges(
  interfaces: Interface[]
): FlowMapEdge[] {
  return interfaces.map(intf => ({
    id: `edge-${intf.id}`,
    type: 'interface',
    source: intf.sendAppId,
    target: intf.receivedAppId,
    animated: false,
    data: {
      interface: intf,
      status: intf.status,
      priority: intf.priority
    }
  }));
}

/**
 * Loader function that handles two types of requests:
 * 1. Search for services and interfaces by nodeId
 * 2. Expand a node by parentId
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('search');

    // Validate search parameters first
    const params = SearchParamsSchema.parse({
      appId: searchTerm,
    });

    // Search for services and interfaces using appId
    const { services, interfaces } = await searchServicesAndInterfaces(params.appId);

    // If no services found, return early
    if (services.length === 0) {
      return successResponse<LoaderData>({
        nodes: [],
        edges: [],
        searchTerm: params.appId,
        serviceFound: false
      });
    }

    // Transform services into nodes with parent-child relationship
    const searchedService = services.find(service => service.appInstanceId === params.appId);
    const childNodes = createChildNodes(params.appId, services);
    const nodes = params.action === "search"
    ? [createParentNode(searchedService), ...childNodes]
    : childNodes;
    
    // Transform interfaces into edges
    const edges = transformInterfacesToEdges(interfaces);

    return successResponse<LoaderData>({
      nodes,
      edges,
      searchTerm: params.appId,
      serviceFound: true
    });

  } catch (error) {
    return handleError(error);
  }
}
