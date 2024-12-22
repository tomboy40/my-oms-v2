import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams, useFetcher } from "@remix-run/react";
import { FlowMap } from "~/components/FlowMap";
import { SearchFlow } from "~/components/FlowMap/SearchFlow";
import { searchServicesAndInterfaces } from "~/models/flowmap.server";
import type { FlowMapData, FlowMapNode, FlowMapEdge } from "~/types/flowMap";
import { useMemo, useCallback, useEffect, useState } from "react";

// Cache key for flow map data
const FLOW_MAP_CACHE_KEY = 'flowMapCache';

interface LoaderData {
  nodes: FlowMapNode[];
  edges: FlowMapEdge[];
  searchTerm: string | null;
  serviceFound: boolean;
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("search");
  const positions = url.searchParams.get("positions");

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

  const savedPositions = positions ? JSON.parse(decodeURIComponent(positions)) : {};

  // Find the main service (the one being searched for)
  const mainService = services.find(s => s.appInstanceId === searchTerm);
  const connectedServices = services.filter(s => s.appInstanceId !== searchTerm);

  // Transform services into nodes
  const nodes: FlowMapNode[] = [];
  const centerX = 500;
  const centerY = 400;

  // Add main service node at the center
  if (mainService) {
    const savedPosition = savedPositions[mainService.appInstanceId];
    nodes.push({
      id: mainService.appInstanceId,
      type: 'service',
      position: savedPosition || { x: centerX, y: centerY },
      data: {
        label: mainService.appInstanceId,
        service: mainService,
        status: mainService.status,
      },
    });
  }

  // Calculate radius based on number of connected services
  const radius = Math.max(200, connectedServices.length * 50);

  // Arrange connected services in a radial layout
  connectedServices.forEach((service, index) => {
    const savedPosition = savedPositions[service.appInstanceId];
    if (savedPosition) {
      nodes.push({
        id: service.appInstanceId,
        type: 'service',
        position: savedPosition,
        data: {
          label: service.appInstanceId,
          service,
          status: service.status,
        },
      });
    } else {
      // Calculate position in a circle around the main service
      const angle = (2 * Math.PI * index) / connectedServices.length;
      nodes.push({
        id: service.appInstanceId,
        type: 'service',
        position: {
          x: Math.cos(angle) * radius + centerX,
          y: Math.sin(angle) * radius + centerY,
        },
        data: {
          label: service.appInstanceId,
          service,
          status: service.status,
        },
      });
    }
  });

  // Transform interfaces into edges
  const edges: FlowMapEdge[] = interfaces.map((iface) => ({
    id: iface.id,
    source: iface.sendAppId,
    target: iface.receivedAppId,
    type: 'interface',
    animated: false,
    data: {
      interface: iface,
      status: iface.interfaceStatus,
      priority: iface.priority,
    },
  }));

  return json<LoaderData>({ 
    nodes, 
    edges,
    searchTerm,
    serviceFound: true
  });
}

export default function FlowMapRoute() {
  const initialData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cachedData, setCachedData] = useState<LoaderData | null>(null);

  // Load cached data on client side only
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(FLOW_MAP_CACHE_KEY);
      if (cached) {
        setCachedData(JSON.parse(cached));
      }
    } catch (e) {
      // Ignore sessionStorage errors during SSR
      console.debug('SessionStorage not available');
    }
  }, []);

  // Combine initial data with cached data
  const { nodes, edges, searchTerm, serviceFound } = useMemo(() => {
    // If we have a search term, use the initial data
    if (searchParams.get("search")) {
      return initialData;
    }
    // If we have cached data and no search term, use cached data
    if (cachedData) {
      return cachedData;
    }
    return initialData;
  }, [initialData, cachedData, searchParams]);

  // Update sessionStorage when data changes
  useEffect(() => {
    if (nodes.length > 0) {
      try {
        const dataToCache = { nodes, edges, searchTerm, serviceFound };
        sessionStorage.setItem(FLOW_MAP_CACHE_KEY, JSON.stringify(dataToCache));
        setCachedData(dataToCache);
      } catch (e) {
        // Ignore sessionStorage errors during SSR
        console.debug('SessionStorage not available');
      }
    }
  }, [nodes, edges, searchTerm, serviceFound]);

  const flowMapData: FlowMapData = useMemo(() => ({ 
    nodes, 
    edges 
  }), [nodes, edges]);

  // Handle node position updates with debounce
  const handleNodeDragStop = useCallback((nodes: FlowMapNode[]) => {
    const positions = nodes.reduce((acc, node) => {
      acc[node.id] = node.position;
      return acc;
    }, {} as Record<string, { x: number; y: number }>);

    // Update cached data with new positions
    const updatedNodes = nodes.map(node => ({
      ...node,
      position: positions[node.id] || node.position
    }));

    const updatedData = {
      nodes: updatedNodes,
      edges,
      searchTerm,
      serviceFound
    };

    // Update both state and sessionStorage
    try {
      sessionStorage.setItem(FLOW_MAP_CACHE_KEY, JSON.stringify(updatedData));
      setCachedData(updatedData);
    } catch (e) {
      // Ignore sessionStorage errors during SSR
      console.debug('SessionStorage not available');
    }

    const newParams = new URLSearchParams(searchParams);
    newParams.set('positions', encodeURIComponent(JSON.stringify(positions)));
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams, edges, searchTerm, serviceFound]);

  // Handle search with cache invalidation
  const handleSearch = useCallback((query: string) => {
    if (query !== searchTerm) {
      try {
        // Clear cache when performing new search
        sessionStorage.removeItem(FLOW_MAP_CACHE_KEY);
        setCachedData(null);
      } catch (e) {
        // Ignore sessionStorage errors during SSR
        console.debug('SessionStorage not available');
      }
    }
  }, [searchTerm]);

  return (
    <div className="relative h-[calc(100vh-64px)]">
      <SearchFlow 
        initialQuery={searchParams.get("search") || ""} 
        onSearch={handleSearch}
      />
      {searchTerm && !serviceFound ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
          <p className="text-lg font-medium">No service found</p>
          <p className="text-sm">Try searching with a different Application ID</p>
        </div>
      ) : nodes.length > 0 ? (
        <FlowMap
          data={flowMapData}
          onNodeDragStop={handleNodeDragStop}
        />
      ) : null}
    </div>
  );
}
