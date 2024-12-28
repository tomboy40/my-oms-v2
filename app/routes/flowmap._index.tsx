import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { FlowMap } from "~/components/FlowMap";
import { SearchFlow } from "~/components/FlowMap/SearchFlow";
import { searchServicesAndInterfaces } from "~/models/flowmap.server";
import type { FlowMapNode, FlowMapEdge, FlowMapData } from "~/types/flowMap";

interface LoaderData {
  nodes: FlowMapNode[];
  edges: FlowMapEdge[];
  searchTerm: string | null;
  serviceFound: boolean;
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("search");

  if (!searchTerm) {
    return json<LoaderData>({ 
      nodes: [], 
      edges: [], 
      searchTerm: null,
      serviceFound: true
    });
  }

  const { services, interfaces } = await searchServicesAndInterfaces(searchTerm);

  // If no services found, return early
  if (services.length === 0) {
    return json<LoaderData>({
      nodes: [],
      edges: [],
      searchTerm,
      serviceFound: false
    });
  }

  // Transform services into nodes
  const nodes: FlowMapNode[] = services.map(service => ({
    id: service.appInstanceId,
    type: 'service',
    data: {
      label: service.serviceName || service.appInstanceId,
      service
    },
    position: { x: 0, y: 0 } // Initial position, will be laid out by useFlowState
  }));

  // Group interfaces by service pairs (regardless of direction)
  const interfaceGroups = interfaces.reduce((groups, intf) => {
    // Create a consistent key for the service pair
    const [serviceA, serviceB] = [intf.sendAppId, intf.receivedAppId].sort();
    const key = `${serviceA}-${serviceB}`;
    
    if (!groups[key]) {
      groups[key] = {
        forward: [], // sendAppId -> receivedAppId
        reverse: [], // receivedAppId -> sendAppId
        serviceA,
        serviceB
      };
    }
    
    // Add interface to the appropriate direction array
    if (intf.sendAppId === serviceA) {
      groups[key].forward.push(intf);
    } else {
      groups[key].reverse.push(intf);
    }
    
    return groups;
  }, {} as Record<string, {
    forward: Interface[],
    reverse: Interface[],
    serviceA: string,
    serviceB: string
  }>);

  // Transform interface groups into edges
  const edges: FlowMapEdge[] = Object.entries(interfaceGroups).map(([key, group]) => {
    const { forward, reverse, serviceA, serviceB } = group;
    const isBidirectional = forward.length > 0 && reverse.length > 0;
    const allInterfaces = [...forward, ...reverse];
    
    return {
      id: `edge-${key}`,
      type: 'interface',
      source: serviceA,
      target: serviceB,
      data: {
        label: allInterfaces.length > 1 
          ? `${allInterfaces.length} Interfaces`
          : allInterfaces[0].interfaceName,
        interfaces: allInterfaces,
        isBidirectional,
        forwardCount: forward.length,
        reverseCount: reverse.length
      }
    };
  });

  return json<LoaderData>({ 
    nodes, 
    edges, 
    searchTerm,
    serviceFound: true
  });
}

export default function FlowMapRoute() {
  const { nodes, edges, searchTerm, serviceFound } = useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get("search") || "";

  if (!serviceFound && searchTerm) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-600">
          No services were found matching the search term: "{searchTerm}"
        </p>
        <SearchFlow initialSearchTerm={initialSearchTerm} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <SearchFlow initialSearchTerm={initialSearchTerm} />
      {nodes.length > 0 && (
        <div className="flex-1 min-h-[600px] h-full">
          <FlowMap data={{ nodes, edges }} />
        </div>
      )}
    </div>
  );
}
