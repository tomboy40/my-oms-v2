import { useNodesState, useEdgesState } from 'reactflow';
import type { FlowMapNode, FlowMapEdge } from '~/types/flowMap';
import type { VisibilityState } from './useFlowVisibility';
import { processNode } from '../utils/nodeUtils';

interface UseFlowStateProps {
  initialNodes: FlowMapNode[];
  initialEdges: FlowMapEdge[];
  visibilityState: VisibilityState;
  selectedNode: FlowMapNode | null;
  selectedEdge: FlowMapEdge | null;
  parentNodeId: string | null;
  calculateRadialLayout: (nodes: FlowMapNode[], centerNodeId: string | null) => FlowMapNode[];
}

export function useFlowState({
  initialNodes,
  initialEdges,
  visibilityState,
  selectedNode,
  selectedEdge,
  parentNodeId,
  calculateRadialLayout
}: UseFlowStateProps) {
  // Initialize nodes with processed data and layout
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes.length === 0 ? [] : 
    calculateRadialLayout(initialNodes, parentNodeId)
      .map(node => processNode({
        node,
        visibilityState,
        isParent: node.id === parentNodeId,
        isHighlighted: node.id === selectedNode?.id
      }))
  );

  // Initialize edges with basic state
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        isHighlighted: edge.id === selectedEdge?.id
      }
    }))
  );

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange
  };
}
