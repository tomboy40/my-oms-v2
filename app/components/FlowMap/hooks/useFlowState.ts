import { useNodesState, useEdgesState } from 'reactflow';
import { useEffect, useRef } from 'react';
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
  // Initialize state
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowMapNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowMapEdge>([]);
  
  // Add ref to track previous values
  const prevNodesLength = useRef(initialNodes.length);
  const prevEdgesLength = useRef(initialEdges.length);
  const updateCount = useRef(0);

  // Update nodes and edges when props change
  useEffect(() => {
    console.log('[FlowState] Effect triggered', {
      nodesLength: initialNodes.length,
      edgesLength: initialEdges.length,
      prevNodesLength: prevNodesLength.current,
      prevEdgesLength: prevEdgesLength.current,
      updateCount: updateCount.current
    });

    // Skip if nothing has changed
    if (prevNodesLength.current === initialNodes.length &&
        prevEdgesLength.current === initialEdges.length &&
        updateCount.current > 0) {
      console.log('[FlowState] Skipping update - no changes detected');
      return;
    }

    updateCount.current++;
    prevNodesLength.current = initialNodes.length;
    prevEdgesLength.current = initialEdges.length;

    // Handle empty state
    if (initialNodes.length === 0) {
      console.log('[FlowState] Setting empty state');
      setNodes([]);
      setEdges([]);
      return;
    }

    console.log('[FlowState] Processing nodes and edges', {
      initialNodesCount: initialNodes.length,
      initialEdgesCount: initialEdges.length
    });

    // Process and layout nodes
    const layoutedNodes = calculateRadialLayout(initialNodes, parentNodeId)
      .map(node => processNode({
        node,
        visibilityState,
        isParent: node.id === parentNodeId,
        isHighlighted: node.id === selectedNode?.id
      }));

    // Process edges
    const processedEdges = initialEdges.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        isHighlighted: edge.id === selectedEdge?.id
      }
    }));

    console.log('[FlowState] Updating state', {
      processedNodesCount: layoutedNodes.length,
      processedEdgesCount: processedEdges.length
    });

    // Update state
    setNodes(layoutedNodes);
    setEdges(processedEdges);
  }, [
    initialNodes,
    initialEdges,
    parentNodeId,
    selectedNode,
    selectedEdge,
    visibilityState,
    calculateRadialLayout
  ]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange
  };
}
