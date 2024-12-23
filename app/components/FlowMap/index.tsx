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
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Helper function to toggle node collapse state
  const toggleNodeCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Helper function to check if a node should be visible
  const isNodeVisible = useCallback((nodeId: string) => {
    // Always show selected node
    if (selectedNode?.id === nodeId) return true;
    
    // Check if this node is a child of any collapsed node
    const isChildOfCollapsed = Array.from(collapsedNodes).some(collapsedId => {
      // If this is the collapsed node itself, it should be visible
      if (collapsedId === nodeId) return false;
      
      const collapsedEdges = edges.filter(edge => 
        edge.source === collapsedId || edge.target === collapsedId
      );
      return collapsedEdges.some(edge => 
        edge.source === nodeId || edge.target === nodeId
      );
    });

    return !isChildOfCollapsed;
  }, [selectedNode, collapsedNodes, edges]);

  // Helper function to check if an edge should be visible
  const isEdgeVisible = useCallback((edge: Edge) => {
    // If either source or target node is hidden, hide the edge
    return isNodeVisible(edge.source) && isNodeVisible(edge.target);
  }, [isNodeVisible]);

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
      // Update nodes with highlighted state and collapse handlers
      const updatedNodes = data.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isHighlighted: selectedNode?.id === node.id,
          isCollapsed: collapsedNodes.has(node.id),
          onToggleCollapse: () => toggleNodeCollapse(node.id)
        }
      }));
      setNodes(updatedNodes as Node[]);
      
      // Group interfaces by connected nodes (regardless of direction)
      const groupedEdges = new Map<string, { interfaces: any[], isBidirectional: boolean, directionalKeys: Set<string> }>();
      
      data.edges.forEach((edge) => {
        const interfaces = Array.isArray(edge.data.interfaces) 
          ? edge.data.interfaces 
          : edge.data.interface 
            ? [edge.data.interface]
            : [];
            
        interfaces.forEach(iface => {
          const senderAppId = iface.sendAppId?.toString() || edge.source;
          const receiverAppId = iface.receiveAppId?.toString() || edge.target;
          
          // Create a consistent key for bidirectional pairs
          const [node1, node2] = [senderAppId, receiverAppId].sort();
          const bidirectionalKey = `${node1}-${node2}`;
          
          // Create a directional key for edge rendering
          const directionalKey = `${senderAppId}-${receiverAppId}`;
          
          if (!groupedEdges.has(bidirectionalKey)) {
            groupedEdges.set(bidirectionalKey, { 
              interfaces: [], 
              isBidirectional: false,
              directionalKeys: new Set<string>()
            });
          }
          
          const group = groupedEdges.get(bidirectionalKey)!;
          group.interfaces.push(iface);
          group.directionalKeys.add(directionalKey);
          
          // Check if this creates a bidirectional connection
          const reverseKey = `${receiverAppId}-${senderAppId}`;
          if (data.edges.some(e => {
            const eInterfaces = Array.isArray(e.data.interfaces) 
              ? e.data.interfaces 
              : e.data.interface 
                ? [e.data.interface]
                : [];
            return eInterfaces.some(ei => 
              (ei.sendAppId?.toString() === receiverAppId && 
               ei.receiveAppId?.toString() === senderAppId) ||
              (e.source === receiverAppId && e.target === senderAppId)
            );
          })) {
            group.isBidirectional = true;
          }
        });
      });

      // Create consolidated edges
      const consolidatedEdges = Array.from(groupedEdges.entries()).flatMap(([key, group]) => {
        const [node1, node2] = key.split('-');
        
        // For each directional key in the group, create an edge
        return Array.from(group.directionalKeys).map(directionalKey => {
          const [senderId, receiverId] = directionalKey.split('-');
          
          // Find the original nodes to ensure they exist
          const sourceNode = data.nodes.find(n => n.id === senderId);
          const targetNode = data.nodes.find(n => n.id === receiverId);
          
          // Only create edge if both nodes exist
          if (sourceNode && targetNode) {
            // For bidirectional edges, use all interfaces in the group
            // For unidirectional edges, filter interfaces by direction
            const edgeInterfaces = group.isBidirectional
              ? group.interfaces
              : group.interfaces.filter(iface => 
                  (iface.sendAppId?.toString() === senderId && 
                   iface.receiveAppId?.toString() === receiverId) ||
                  (edge => edge.source === senderId && edge.target === receiverId)
                );
            
            return {
              id: directionalKey,
              source: senderId,
              target: receiverId,
              type: 'interface',
              animated: false,
              data: {
                interfaces: edgeInterfaces,
                isBidirectional: group.isBidirectional,
                currentInterfaceIndex: 0,
                status: edgeInterfaces.reduce((maxStatus, iface) => 
                  iface.interfaceStatus === 'ACTIVE' ? 'ACTIVE' : maxStatus,
                  'INACTIVE'
                ),
                priority: edgeInterfaces[0]?.priority || 'LOW',
                isHighlighted: selectedEdge?.id === directionalKey
              },
            };
          }
          return null;
        });
      })
      .filter((edge): edge is Edge => edge !== null && edge.data.interfaces.length > 0);

      console.log('Consolidated edges:', consolidatedEdges);
      
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
  }, [data.nodes, data.edges, selectedNode, selectedEdge, getEdgeParams, collapsedNodes, toggleNodeCollapse]);

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
        nodes={nodes.filter(node => isNodeVisible(node.id))}
        edges={edges.filter(edge => isEdgeVisible(edge))}
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
