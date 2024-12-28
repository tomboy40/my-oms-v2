import React, { useState, useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

import type { FlowMapData, FlowMapNode, FlowMapEdge } from '~/types/flowMap';
import { ServiceNode } from './ServiceNode';
import { InterfaceEdge } from './InterfaceEdge';
import { ServiceDetailPanel, InterfaceDetailPanel } from './DetailPanels';
import './styles.css';

import { useFlowVisibility } from './hooks/useFlowVisibility';
import { useFlowState } from './hooks/useFlowState';
import { useFlowInteractions } from './hooks/useFlowInteractions';
import { calculateRadialLayout } from './utils/layoutUtils';

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
  const [currentInterfaceIndex, setCurrentInterfaceIndex] = useState(0);

  // Initialize visibility
  const visibilityState = useFlowVisibility(data.nodes, data.edges);

  // Initialize state
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
  } = useFlowState({
    initialNodes: data.nodes,
    initialEdges: data.edges,
    visibilityState,
    selectedNode,
    selectedEdge,
    parentNodeId: data.nodes[0]?.id || null,
    calculateRadialLayout
  });

  // Initialize interactions
  const {
    handleNodeDrag,
    handleNodeClick,
    handleEdgeClick
  } = useFlowInteractions({
    setNodes,
    nodes,
    setSelectedNode,
    setSelectedEdge
  });

  // Memoize ReactFlow props
  const flowProps = useMemo(() => ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeDragStop: handleNodeDrag,
    onNodeClick: handleNodeClick,
    onEdgeClick: handleEdgeClick,
    nodeTypes,
    edgeTypes,
    fitView: true,
    minZoom: 0.5,
    maxZoom: 2,
    defaultViewport: { x: 0, y: 0, zoom: 1.5 },
    attributionPosition: 'bottom-right'
  }), [
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    handleNodeDrag,
    handleNodeClick,
    handleEdgeClick
  ]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        fitView
        className="w-full h-full"
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
      
      {selectedNode && (
        <ServiceDetailPanel
          service={selectedNode.data.service}
          onClose={() => setSelectedNode(null)}
        />
      )}
      
      {selectedEdge && selectedEdge.data?.interfaces && selectedEdge.data.interfaces.length > 0 && (
        <InterfaceDetailPanel
          interfaces={selectedEdge.data.interfaces}
          currentIndex={currentInterfaceIndex}
          onNavigate={setCurrentInterfaceIndex}
          onClose={() => {
            setSelectedEdge(null);
            setCurrentInterfaceIndex(0);
          }}
        />
      )}
    </div>
  );
}
