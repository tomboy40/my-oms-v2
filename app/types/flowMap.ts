import type { ITService, Interface } from "@prisma/client";
import { ServiceStatus } from "./services";
import { InterfaceStatus, Priority } from "./interfaces";

// Node Types
export interface FlowMapNode {
  id: string;
  type: 'service';
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    service: ITService;
    status: ServiceStatus;
    isExpanded: boolean;
    parentId?: string;
  };
}

// Edge Types
export interface FlowMapEdge {
  id: string;
  source: string;
  target: string;
  type: 'interface';
  animated: boolean;
  sourceHandle?: string;
  targetHandle?: string;
  data: {
    interfaces?: Interface[]; // Multiple interfaces (new format)
    status: InterfaceStatus;
    priority: Priority;
    sourceNode?: FlowMapNode;
    targetNode?: FlowMapNode;
  };
}

// Base data structure for flow map
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

// Loader Data extends FlowMapData with additional fields
export interface LoaderData extends FlowMapData {
  searchTerm: string | null;
  serviceFound: boolean;
  error?: string;
}

// Graph State Types
export interface GraphState {
  allNodes: Map<string, FlowMapNode>;
  allEdges: Map<string, FlowMapEdge>;
  visibilityMap: Map<string, boolean>;
  expandedNodes: Set<string>;
  nodeHierarchy: Map<string, Set<string>>; // parent -> children
}

export interface GraphStateActions { 
  addNodes: (nodes: FlowMapNode[]) => void;
  addEdges: (edges: FlowMapEdge[]) => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  isNodeExpanded: (nodeId: string) => boolean;
  isNodeVisible: (nodeId: string) => boolean;
  getVisibleNodes: () => FlowMapNode[];
  getVisibleEdges: () => FlowMapEdge[];
}
