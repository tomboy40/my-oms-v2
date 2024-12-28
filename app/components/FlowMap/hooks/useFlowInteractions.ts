import { useCallback } from 'react';
import type { Node, Edge } from 'reactflow';
import type { FlowMapNode, FlowMapEdge } from '~/types/flowMap';

interface UseFlowInteractionsProps {
  setNodes: (nodes: Node[]) => void;
  nodes: Node[];
  setSelectedNode: (node: FlowMapNode | null) => void;
  setSelectedEdge: (edge: FlowMapEdge | null) => void;
}

export function useFlowInteractions({
  setNodes,
  nodes,
  setSelectedNode,
  setSelectedEdge,
}: UseFlowInteractionsProps) {
  
  // Handle node drag
  const handleNodeDrag = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setNodes(nodes.map((n) => 
        n.id === node.id ? { 
          ...n, 
          position: node.position,
          data: {
            ...n.data,
            userPositioned: true
          }
        } : n
      ));
    },
    [nodes, setNodes]
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node as FlowMapNode);
      setSelectedEdge(null);
    },
    [setSelectedNode, setSelectedEdge]
  );

  // Handle edge click
  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge as FlowMapEdge);
      setSelectedNode(null);
    },
    [setSelectedNode, setSelectedEdge]
  );

  return {
    handleNodeDrag,
    handleNodeClick,
    handleEdgeClick
  };
}
