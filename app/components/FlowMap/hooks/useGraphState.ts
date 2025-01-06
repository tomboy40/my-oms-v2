import { useState, useCallback } from 'react';
import type { FlowMapNode, FlowMapEdge, GraphState, GraphStateActions } from '~/types/flowMap';

export function useGraphState(
  initialNodes: FlowMapNode[],
  initialEdges: FlowMapEdge[]
): GraphStateActions {
  const [state, setState] = useState<GraphState>(() => ({
    allNodes: new Map(initialNodes.map(node => [node.id, node])),
    allEdges: new Map(initialEdges.map(edge => [edge.id, edge])),
    visibilityMap: new Map(initialNodes.map(node => [node.id, !node.data.parentId])),
    expandedNodes: new Set<string>(),
    nodeHierarchy: new Map()
  }));

  const addNodes = useCallback((nodes: FlowMapNode[]) => {
    setState(prev => {
      const newState = { ...prev };
      nodes.forEach(node => {
        newState.allNodes.set(node.id, node);
        newState.visibilityMap.set(node.id, false);
        
        // Update hierarchy
        if (node.data.parentId) {
          const children = newState.nodeHierarchy.get(node.data.parentId) || new Set();
          children.add(node);
          newState.nodeHierarchy.set(node.data.parentId, children);
        }
      });
      return newState;
    });
  }, []);

  const addEdges = useCallback((edges: FlowMapEdge[]) => {
    setState(prev => {
      const newState = { ...prev };
      edges.forEach(edge => {
        newState.allEdges.set(edge.id, edge);
      });
      return newState;
    });
  }, []);

  const updateVisibility = useCallback((nodeId: string, isExpanded: boolean) => {
    setState(prev => {
      const newState = { ...prev };
      const children = newState.nodeHierarchy.get(nodeId) || new Set();
      
      // Update visibility of immediate children
      children.forEach(child => {
        newState.visibilityMap.set(child.id, isExpanded);
      });

      // Recursively update visibility of collapsed grandchildren
      if (!isExpanded) {
        const processChildren = (parentId: string) => {
          const grandchildren = newState.nodeHierarchy.get(parentId) || new Set();
          grandchildren.forEach(child => {
            newState.visibilityMap.set(child.id, false);
            if (newState.expandedNodes.has(child.id)) {
              processChildren(child.id);
            }
          });
        };
        children.forEach(child => {
          if (newState.expandedNodes.has(child.id)) {
            processChildren(child.id);
          }
        });
      }

      return newState;
    });
  }, []);

  const expandNode = useCallback((nodeId: string) => {
    setState(prev => {
      const newState = { ...prev };
      newState.expandedNodes.add(nodeId);
      return newState;
    });
    updateVisibility(nodeId, true);
  }, [updateVisibility]);

  const collapseNode = useCallback((nodeId: string) => {
    setState(prev => {
      const newState = { ...prev };
      newState.expandedNodes.delete(nodeId);
      return newState;
    });
    updateVisibility(nodeId, false);
  }, [updateVisibility]);

  const isNodeExpanded = useCallback((nodeId: string) => {
    return state.expandedNodes.has(nodeId);
  }, [state.expandedNodes]);

  const isNodeVisible = useCallback((nodeId: string) => {
    return state.visibilityMap.get(nodeId) || false;
  }, [state.visibilityMap]);

  const getVisibleNodes = useCallback(() => {
    return Array.from(state.allNodes.values()).filter(node => 
      state.visibilityMap.get(node.id) || !node.data.parentId
    );
  }, [state.allNodes, state.visibilityMap]);

  const getVisibleEdges = useCallback(() => {
    return Array.from(state.allEdges.values()).filter(edge => {
      const sourceVisible = state.visibilityMap.get(edge.source) || false;
      const targetVisible = state.visibilityMap.get(edge.target) || false;
      return sourceVisible && targetVisible;
    });
  }, [state.allEdges, state.visibilityMap]);

  return {
    addNodes,
    addEdges,
    expandNode,
    collapseNode,
    isNodeExpanded,
    isNodeVisible,
    getVisibleNodes,
    getVisibleEdges
  };
}
