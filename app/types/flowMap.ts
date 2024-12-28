import type { ITService, Interface } from "@prisma/client";
import { ServiceStatus } from "./services";
import { InterfaceStatus, Priority } from "./interfaces";

// Node Types
export interface FlowMapNode {
  id: string;                 // Unique identifier (appInstanceId)
  type: 'service';           // Node type for React Flow
  position: {                // Position in the flow map
    x: number;
    y: number;
  };
  data: {
    label: string;           // Display name
    service: ITService;      // Original service data
    status: ServiceStatus;   // Service status
    isCollapsed?: boolean;   // Collapse state
    onToggleCollapse?: () => void; // Function to toggle collapse state
    isParent?: boolean;      // Whether this is the parent node
  };
}

// Edge Types
export interface FlowMapEdge {
  id: string;               // Unique identifier
  source: string;           // Source node id (sendAppId)
  target: string;           // Target node id (receivedAppId)
  type: 'interface';        // Edge type for React Flow
  animated: boolean;        // Animation state
  sourceHandle?: string;
  targetHandle?: string;
  data: {
    interface?: Interface;   // Single interface (legacy format)
    interfaces?: Interface[]; // Multiple interfaces (new format)
    currentInterfaceIndex?: number; // Current interface index being viewed
    status: InterfaceStatus;
    priority: Priority;
    sourceNode?: FlowMapNode;  // Add source node data
    targetNode?: FlowMapNode;  // Add target node data
  };
}

// Flow Map Data Structure
export interface FlowMapData {
  nodes: FlowMapNode[];
  edges: FlowMapEdge[];
}

// Node Click Event Data
export interface NodeClickData {
  nodeId: string;
  service: ITService;
}

// Edge Click Event Data
export interface EdgeClickData {
  edgeId: string;
  interface: Interface;
}

// Visibility Management Types
export interface NodeExpansionState {
  isExpanded: boolean;
  childNodes: Set<string>;
  relatedEdges: Set<string>;
  level: number;
}

export interface VisibilityManager {
  expansionStates: Map<string, NodeExpansionState>;
  visibleNodes: Set<string>;
  visibleEdges: Set<string>;
}
