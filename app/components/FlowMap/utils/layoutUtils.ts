import type { FlowMapNode, GraphState } from '~/types/flowMap';

const RADIUS = 200; // Base radius for layout
const CHILD_RADIUS = 150; // Radius for child nodes

/**
 * Calculate radial layout for flow map nodes
 * @param nodes List of nodes to layout
 * @param centerNodeId ID of the node to use as center (optional)
 * @param graphState Graph state containing node hierarchy
 * @returns Updated nodes with calculated positions
 */
export function calculateRadialLayout(
  nodes: FlowMapNode[], 
  centerNodeId: string | null,
  graphState: GraphState
): FlowMapNode[] {
  if (nodes.length === 0) return [];

  const centerNode = centerNodeId 
    ? nodes.find(n => n.id === centerNodeId)
    : nodes[0];

  if (!centerNode) return nodes;

  const layoutedNodes: FlowMapNode[] = [];
  const processedNodes = new Set<string>();

  // Position center node
  layoutedNodes.push({
    ...centerNode,
    position: { x: 0, y: 0 }
  });
  processedNodes.add(centerNode.id);

  // Get child nodes from graphState
  const childNodes = Array.from(graphState.nodeHierarchy.get(centerNode.id) || []);

  // Process each expanded node and its children
  childNodes.forEach(parentNodeId => {
    const parentNode = nodes.find(node => node.id === parentNodeId);
    if (parentNode && parentNode.data.isExpanded) {
      const childNodes = Array.from(graphState.nodeHierarchy.get(parentNodeId) || []);

      if (childNodes.length > 0) {
        // Calculate positions for child nodes in a circle around their parent
        const parentPos = parentNode.position;
        const angleStep = (2 * Math.PI) / childNodes.length;

        childNodes.forEach((childNodeId, index) => {
          const childNode = nodes.find(node => node.id === childNodeId);
          if (childNode && !processedNodes.has(childNode.id)) {
            const angle = angleStep * index;
            const x = parentPos.x + CHILD_RADIUS * Math.cos(angle);
            const y = parentPos.y + CHILD_RADIUS * Math.sin(angle);

            layoutedNodes.push({
              ...childNode,
              position: { x, y }
            });
            processedNodes.add(childNode.id);
          }
        });
      }
    }
  });

  // Position remaining nodes in a circle around the center
  const remainingNodes = nodes.filter(node => !processedNodes.has(node.id));
  const angleStep = (2 * Math.PI) / (remainingNodes.length || 1);

  remainingNodes.forEach((node, index) => {
    const angle = angleStep * index;
    const x = RADIUS * Math.cos(angle);
    const y = RADIUS * Math.sin(angle);

    layoutedNodes.push({
      ...node,
      position: { x, y }
    });
  });

  return layoutedNodes;
}
