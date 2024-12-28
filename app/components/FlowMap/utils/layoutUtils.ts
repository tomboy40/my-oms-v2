import type { FlowMapNode } from '~/types/flowMap';

/**
 * Calculate radial layout for flow map nodes
 * @param nodes List of nodes to layout
 * @param centerNodeId ID of the node to use as center (optional)
 * @returns Updated nodes with calculated positions
 */
export function calculateRadialLayout(nodes: FlowMapNode[], centerNodeId: string | null): FlowMapNode[] {
  if (!nodes.length) return [];

  const centerNode = nodes.find(n => n.id === centerNodeId) || nodes[0];
  const otherNodes = nodes.filter(n => n.id !== centerNode?.id);
  
  const radius = Math.max(300, otherNodes.length * 100); // Dynamic radius based on node count
  const angleStep = (2 * Math.PI) / otherNodes.length;
  
  // Default dimensions for SSR, will be updated on client
  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;
  
  // Position center node
  const updatedNodes = centerNode ? [
    {
      ...centerNode,
      position: { x: centerX, y: centerY }
    }
  ] : [];
  
  // Position other nodes in a circle
  otherNodes.forEach((node, index) => {
    const angle = angleStep * index;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    updatedNodes.push({
      ...node,
      position: { x, y }
    });
  });

  return updatedNodes;
}
