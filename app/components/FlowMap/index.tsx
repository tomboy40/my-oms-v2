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
  const [currentInterfaceIndex, setCurrentInterfaceIndex] = useState(0);

  // Default layout configuration
  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 1.5 }), []);

  // Smart edge routing with improved angle calculations
  const getEdgeParams = useCallback((source: Node, target: Node) => {
    const sourceX = source.position.x + (source.width ?? 0) / 2;
    const sourceY = source.position.y + (source.height ?? 0) / 2;
    const targetX = target.position.x + (target.width ?? 0) / 2;
    const targetY = target.position.y + (target.height ?? 0) / 2;

    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const angle = Math.atan2(dy, dx);

    // Determine the primary direction
    let sourcePos: Position;
    let targetPos: Position;

    // Use simpler angle-based direction determination
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

    // Simplified handle number calculation
    const getHandleNumber = (pos: Position) => {
      // Always use the middle handle (2) for more stable connections
      return 2;
    };

    return {
      sourceHandle: `${sourcePos}-${getHandleNumber(sourcePos)}`,
      targetHandle: `${targetPos}-${getHandleNumber(targetPos)}`,
    };
  }, []);

  // Initialize or update nodes and edges when data changes
  useEffect(() => {
    if (data.nodes && data.edges) {
      // Update nodes with highlighted state
      const updatedNodes = data.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isHighlighted: selectedNode?.id === node.id
        }
      }));
      setNodes(updatedNodes as Node[]);
      
      // Group interfaces by connected nodes (regardless of direction)
      const groupedEdges = new Map<string, { interfaces: any[], isBidirectional: boolean }>();
      
      data.edges.forEach((edge) => {
        // Create a consistent key for the node pair
        const nodeIds = [edge.source, edge.target].sort();
        const key = nodeIds.join('-');
        
        if (!groupedEdges.has(key)) {
          groupedEdges.set(key, { interfaces: [], isBidirectional: false });
        }
        
        const group = groupedEdges.get(key)!;
        const interfaces = Array.isArray(edge.data.interfaces) 
          ? edge.data.interfaces 
          : edge.data.interface 
            ? [edge.data.interface]
            : [];
            
        // Add interfaces to the group
        group.interfaces.push(...interfaces);
        
        // Check if this creates a bidirectional connection
        const reverseKey = `${edge.target}-${edge.source}`;
        const hasReverseEdge = data.edges.some(e => 
          e.source === edge.target && e.target === edge.source
        );
        
        if (hasReverseEdge) {
          group.isBidirectional = true;
        }
      });

      // Create consolidated edges
      const consolidatedEdges = Array.from(groupedEdges.entries()).map(([key, group]) => {
        const [node1, node2] = key.split('-');
        
        // For bidirectional edges, always use node1 as source
        const source = node1;
        const target = node2;
        
        return {
          id: key,
          source,
          target,
          type: 'interface',
          data: {
            interfaces: group.interfaces,
            isBidirectional: group.isBidirectional,
            currentInterfaceIndex: 0,
            // Use the highest priority status from all interfaces
            status: group.interfaces.reduce((maxStatus, iface) => 
              iface.interfaceStatus === 'ACTIVE' ? 'ACTIVE' : maxStatus,
              'INACTIVE'
            ),
            isHighlighted: selectedEdge?.id === key
          },
        };
      }).filter(edge => edge.data.interfaces.length > 0);

      // Calculate initial edge connections
      const initialEdges = consolidatedEdges.map((edge) => {
        const sourceNode = data.nodes.find((n) => n.id === edge.source);
        const targetNode = data.nodes.find((n) => n.id === edge.target);
        
        if (sourceNode && targetNode) {
          const { sourceHandle, targetHandle } = getEdgeParams(
            sourceNode as Node,
            targetNode as Node
          );
          return {
            ...edge,
            sourceHandle,
            targetHandle,
          };
        }
        return edge;
      });
      
      setEdges(initialEdges as Edge[]);
    }
  }, [data.nodes, data.edges, selectedNode, selectedEdge, getEdgeParams]);

  // Update edges during node movement with debounce
  const onNodeDrag = useCallback(
    (_: React.MouseEvent, node: Node) => {
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
    },
    [nodes, getEdgeParams]
  );

  // Handle node position changes with final update
  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const updatedNodes = nodes.map((n) => 
        n.id === node.id ? { ...n, position: node.position } : n
      );
      
      // Update edges with final positions
      const updatedEdges = edges.map((edge) => {
        if (edge.source === node.id || edge.target === node.id) {
          const sourceNode = updatedNodes.find((n) => n.id === edge.source);
          const targetNode = updatedNodes.find((n) => n.id === edge.target);
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
      });

      setNodes(updatedNodes);
      setEdges(updatedEdges);

      // Call the parent callback if provided
      if (onNodeDragStop) {
        onNodeDragStop(updatedNodes as FlowMapNode[]);
      }
    },
    [nodes, edges, setNodes, setEdges, getEdgeParams, onNodeDragStop]
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
      // Always reset the interface index when selecting a new edge
      setCurrentInterfaceIndex(0);
    },
    []
  );

  // Reset interface index when selecting a new edge
  useEffect(() => {
    if (selectedEdge) {
      // Ensure the current index is valid for the new edge
      const maxIndex = selectedEdge.data.interfaces.length - 1;
      const safeIndex = Math.min(Math.max(0, currentInterfaceIndex), maxIndex);
      if (safeIndex !== currentInterfaceIndex) {
        setCurrentInterfaceIndex(safeIndex);
      }
    }
  }, [selectedEdge, currentInterfaceIndex]);

  // Handle interface navigation
  const handleInterfaceNavigate = useCallback((newIndex: number) => {
    if (selectedEdge) {
      const maxIndex = selectedEdge.data.interfaces.length - 1;
      const safeIndex = Math.min(Math.max(0, newIndex), maxIndex);
      setCurrentInterfaceIndex(safeIndex);
      
      const updatedEdge = {
        ...selectedEdge,
        data: {
          ...selectedEdge.data,
          currentInterfaceIndex: safeIndex
        }
      };
      setSelectedEdge(updatedEdge);
      
      // Update the edge in the edges state
      setEdges(eds => 
        eds.map(e => e.id === selectedEdge.id ? updatedEdge : e)
      );
    }
  }, [selectedEdge, setEdges]);

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
        onNodeDrag={onNodeDrag}
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
          interfaces={selectedEdge.data.interfaces}
          currentIndex={currentInterfaceIndex}
          onNavigate={handleInterfaceNavigate}
          onClose={() => {
            setSelectedEdge(null);
            setCurrentInterfaceIndex(0);
          }}
        />
      )}
    </div>
  );
}
