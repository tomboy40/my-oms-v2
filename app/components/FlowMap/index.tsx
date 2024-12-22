import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Position,
  MarkerType,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { FlowMapData, FlowMapNode, FlowMapEdge, NodeClickData, EdgeClickData } from '~/types/flowMap';
import { ServiceNode } from './ServiceNode';
import { InterfaceEdge } from './InterfaceEdge';
import { ServiceDetailPanel, InterfaceDetailPanel } from './DetailPanels';
import './styles.css';

interface FlowMapProps {
  data: FlowMapData;
  onNodeDragStop?: (nodes: FlowMapNode[]) => void;
}

const nodeTypes = {
  service: ServiceNode,
};

const edgeTypes = {
  interface: InterfaceEdge,
};

export function FlowMap({ data, onNodeDragStop }: FlowMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<FlowMapNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<FlowMapEdge | null>(null);

  // Default layout configuration
  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 1.5 }), []);

  // Smart edge routing
  const getEdgeParams = useCallback((source: Node, target: Node) => {
    const sourceX = source.position.x + source.width! / 2;
    const sourceY = source.position.y + source.height! / 2;
    const targetX = target.position.x + target.width! / 2;
    const targetY = target.position.y + target.height! / 2;

    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const angle = Math.atan2(dy, dx);

    let sourcePos: Position;
    let targetPos: Position;

    if (Math.abs(angle) < Math.PI / 4) {
      sourcePos = Position.Right;
      targetPos = Position.Left;
    } else if (Math.abs(angle) > (3 * Math.PI) / 4) {
      sourcePos = Position.Left;
      targetPos = Position.Right;
    } else if (angle > 0) {
      sourcePos = Position.Bottom;
      targetPos = Position.Top;
    } else {
      sourcePos = Position.Top;
      targetPos = Position.Bottom;
    }

    return {
      sourceHandle: sourcePos,
      targetHandle: targetPos,
    };
  }, []);

  // Initialize or update nodes and edges when data changes
  useEffect(() => {
    if (data.nodes && data.edges) {
      setNodes(data.nodes as Node[]);
      setEdges(data.edges as Edge[]);
    }
  }, [data.nodes, data.edges]);

  // Handle node position changes
  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // Update edge connections
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.source === node.id || edge.target === node.id) {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (sourceNode && targetNode) {
              const { sourceHandle, targetHandle } = getEdgeParams(sourceNode, targetNode);
              return {
                ...edge,
                sourceHandle,
                targetHandle,
              };
            }
          }
          return edge;
        })
      );

      // Notify parent of all node positions
      onNodeDragStop?.(nodes as FlowMapNode[]);
    },
    [nodes, setEdges, getEdgeParams, onNodeDragStop]
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const flowNode = node as unknown as FlowMapNode;
      setSelectedNode(flowNode);
      setSelectedEdge(null);
    },
    []
  );

  // Handle edge click
  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const flowEdge = edge as unknown as FlowMapEdge;
      setSelectedEdge(flowEdge);
      setSelectedNode(null);
    },
    []
  );

  return (
    <div className="h-[calc(100vh-64px)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeDragStop={handleNodeDragStop}
        defaultViewport={defaultViewport}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {selectedNode && (
        <ServiceDetailPanel
          service={selectedNode.data.service}
          onClose={() => setSelectedNode(null)}
        />
      )}
      
      {selectedEdge && (
        <InterfaceDetailPanel
          interface={selectedEdge.data.interface}
          onClose={() => setSelectedEdge(null)}
        />
      )}
    </div>
  );
}
