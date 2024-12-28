import { useState, useCallback } from 'react';
import type { FlowMapNode, FlowMapEdge } from '~/types/flowMap';

export interface VisibilityState {
  visibleNodes: Set<string>;
  visibleEdges: Set<string>;
  isNodeCollapsed: (nodeId: string) => boolean;
  toggleNodeVisibility: (nodeId: string) => void;
  getVisibleElements: () => { nodes: string[]; edges: string[] };
}

export function useFlowVisibility(
  initialNodes: FlowMapNode[],
  initialEdges: FlowMapEdge[]
): VisibilityState {
  // Track visible nodes and edges
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(
    new Set(initialNodes.map(n => n.id))
  );
  const [visibleEdges, setVisibleEdges] = useState<Set<string>>(
    new Set(initialEdges.map(e => e.id))
  );

  // Check if node is collapsed
  const isNodeCollapsed = useCallback(
    (nodeId: string) => !visibleNodes.has(nodeId),
    [visibleNodes]
  );

  // Toggle node visibility
  const toggleNodeVisibility = useCallback((nodeId: string) => {
    setVisibleNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });

    // Update visible edges based on visible nodes
    setVisibleEdges(prev => {
      const next = new Set<string>();
      initialEdges.forEach(edge => {
        if (visibleNodes.has(edge.source) && visibleNodes.has(edge.target)) {
          next.add(edge.id);
        }
      });
      return next;
    });
  }, [initialEdges, visibleNodes]);

  // Get visible elements
  const getVisibleElements = useCallback(() => ({
    nodes: Array.from(visibleNodes),
    edges: Array.from(visibleEdges)
  }), [visibleNodes, visibleEdges]);

  return {
    visibleNodes,
    visibleEdges,
    isNodeCollapsed,
    toggleNodeVisibility,
    getVisibleElements
  };
}
