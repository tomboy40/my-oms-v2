import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

import type { FlowMapData, FlowMapNode, FlowMapEdge } from '~/types/flowMap';
import { ServiceNode } from './ServiceNode';
import { InterfaceEdge } from './InterfaceEdge';
import { ServiceDetailPanel, InterfaceDetailPanel } from './DetailPanels';
import './styles.css';

import { useGraphState } from './hooks/useGraphState';
import { useFlowLayout } from './hooks/useFlowLayout';
import { calculateRadialLayout } from './utils/layoutUtils';
import { useSearchParams } from 'react-router-dom';

interface FlowMapProps {
  data: FlowMapData;
}

const nodeTypes = {
  service: ServiceNode,
};

const edgeTypes = {
  interface: InterfaceEdge,
};

export function FlowMap({ data }: FlowMapProps) {
  const [selectedNode, setSelectedNode] = useState<FlowMapNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<FlowMapEdge | null>(null);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('search');

  // Setup graph state management
  const graphState = useGraphState(data.nodes, data.edges);

  // Setup layout management
  const flowLayout = useFlowLayout({
    nodes: graphState.getVisibleNodes(),
    edges: graphState.getVisibleEdges(),
    calculateLayout: calculateRadialLayout,
    centerNodeId: searchTerm || null,
    graphState
  });

  // Handle node expansion
  const handleNodeExpand = useCallback(async (nodeId: string) => {
    if (graphState.isNodeExpanded(nodeId)) {
      graphState.collapseNode(nodeId);
      return;
    }

    try {
      const response = await fetch(`/api/flowmap?search=${nodeId}&action=expand`);
      if (!response.ok) {
        throw new Error('Failed to fetch child nodes');
      }
      const expandData = await response.json();
      
      // Add new nodes and edges to the graph state
      graphState.addNodes(expandData.nodes);
      graphState.addEdges(expandData.edges || []);
      graphState.expandNode(nodeId);
    } catch (error) {
      console.error('Error expanding node:', error);
    }
  }, [graphState]);

  // Get current nodes with layout positions
  const nodes = useMemo(() => {
    const visibleNodes = graphState.getVisibleNodes();
    const layoutedNodes = flowLayout.getLayoutedNodes();
    return layoutedNodes.map(flowLayout.getNodeWithPosition);
  }, [graphState, flowLayout]);

  // Get current edges
  const edges = useMemo(() => {
    return graphState.getVisibleEdges();
  }, [graphState]);

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: FlowMapNode) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  // Handle edge click
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: FlowMapEdge) => {
    setSelectedNode(null);
    setSelectedEdge(edge);
  }, []);

  return (
    <div className="flow-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={flowLayout.onNodesChange}
        onEdgesChange={() => {}} // Edges are read-only in our case
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      {selectedNode && (
        <ServiceDetailPanel
          node={selectedNode}
          onExpand={handleNodeExpand}
          isExpanded={graphState.isNodeExpanded(selectedNode.id)}
        />
      )}
      {selectedEdge && <InterfaceDetailPanel edge={selectedEdge} />}
    </div>
  );
}
