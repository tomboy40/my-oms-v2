import { useCallback, useState } from 'react';
import type { FlowMapNode, FlowMapEdge, GraphState, GraphStateActions } from '~/types/flowMap';

interface UseFlowLayoutProps {
  nodes: FlowMapNode[];
  edges: FlowMapEdge[];
  calculateLayout: (nodes: FlowMapNode[], centerNodeId: string | null, graphState: GraphState) => FlowMapNode[];
  centerNodeId: string | null;
  graphState: GraphState;
  graphStateActions: GraphStateActions;
}

export function useFlowLayout({
  nodes,
  edges,
  calculateLayout,
  centerNodeId,
  graphState
}: UseFlowLayoutProps) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Apply layout to nodes
  const getLayoutedNodes = useCallback(() => {
    const layoutedNodes = calculateLayout(nodes, centerNodeId, graphState);
    const newPositions: Record<string, { x: number; y: number }> = {};
    
    layoutedNodes.forEach(node => {
      newPositions[node.id] = node.position;
    });
    
    setPositions(newPositions);
    return layoutedNodes;
  }, [nodes, centerNodeId, calculateLayout, graphState]);

  // Handle node position changes
  const onNodesChange = useCallback((changes: any[]) => {
    const positionChanges = changes.filter(change => change.type === 'position');
    if (positionChanges.length === 0) return;

    setPositions(prev => {
      const next = { ...prev };
      positionChanges.forEach(change => {
        next[change.id] = change.position;
      });
      return next;
    });
  }, []);

  // Get current node positions
  const getNodeWithPosition = useCallback((node: FlowMapNode): FlowMapNode => {
    const position = positions[node.id];
    if (!position) return node;
    
    return {
      ...node,
      position
    };
  }, [positions]);

  return {
    onNodesChange,
    getLayoutedNodes,
    getNodeWithPosition
  };
}
