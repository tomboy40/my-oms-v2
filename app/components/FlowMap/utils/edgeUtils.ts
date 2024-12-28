import type { Node } from 'reactflow';

interface Position {
  x: number;
  y: number;
}

function getNodeCenter(node: Node): Position {
  // Service nodes are 96x96 (w-24 h-24 in Tailwind)
  const nodeWidth = 96;
  const nodeHeight = 96;
  return {
    x: node.position.x + nodeWidth / 2,
    y: node.position.y + nodeHeight / 2,
  };
}

function calculateAngle(source: Position, target: Position): number {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  return Math.atan2(dy, dx);
}

function getQuadrant(angle: number): string {
  // Convert angle to degrees and normalize to 0-360
  const degrees = ((angle * 180 / Math.PI) + 360) % 360;
  
  // Use 45-degree sectors for more precise handle selection
  if (degrees >= 315 || degrees < 45) return 'right';
  if (degrees >= 45 && degrees < 135) return 'bottom';
  if (degrees >= 135 && degrees < 225) return 'left';
  return 'top';
}

export function updateEdges(sourceNode: Node, targetNode: Node) {
  const sourceCenter = getNodeCenter(sourceNode);
  const targetCenter = getNodeCenter(targetNode);
  
  const angle = calculateAngle(sourceCenter, targetCenter);
  const sourceQuadrant = getQuadrant(angle);
  // For target, we add 180 degrees (π radians) to get the opposite direction
  const targetQuadrant = getQuadrant(angle + Math.PI);

  return {
    sourceHandle: sourceQuadrant,
    targetHandle: targetQuadrant,
  };
}
