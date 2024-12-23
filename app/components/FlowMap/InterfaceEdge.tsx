import { memo } from 'react';
import { EdgeLabelRenderer, BaseEdge, EdgeProps } from 'reactflow';
import type { FlowMapEdge } from '~/types/flowMap';
import { InterfaceStatus, Priority } from '~/types/interfaces';

const statusColors = {
  [InterfaceStatus.ACTIVE]: 'text-green-500 border-green-500',
  [InterfaceStatus.INACTIVE]: 'text-gray-400 border-gray-400',
  [InterfaceStatus.MAINTENANCE]: 'text-red-500 border-red-500',
};

function InterfaceEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
}: EdgeProps<FlowMapEdge['data']>) {
  // Calculate the path for a straight line
  const edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

  // Calculate the midpoint for the arrow
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const midX = sourceX + dx * 0.5;
  const midY = sourceY + dy * 0.5;
  
  // Calculate arrow angles
  const angle = Math.atan2(dy, dx);
  const arrowLength = 10;
  const arrowWidth = 6;

  // Calculate forward arrow points
  const forwardArrowPoint1X = midX - arrowLength * Math.cos(angle - Math.PI / 6);
  const forwardArrowPoint1Y = midY - arrowLength * Math.sin(angle - Math.PI / 6);
  const forwardArrowPoint2X = midX - arrowLength * Math.cos(angle + Math.PI / 6);
  const forwardArrowPoint2Y = midY - arrowLength * Math.sin(angle + Math.PI / 6);

  // Calculate backward arrow points (if bidirectional)
  const backwardArrowPoint1X = midX + arrowLength * Math.cos(angle - Math.PI / 6);
  const backwardArrowPoint1Y = midY + arrowLength * Math.sin(angle - Math.PI / 6);
  const backwardArrowPoint2X = midX + arrowLength * Math.cos(angle + Math.PI / 6);
  const backwardArrowPoint2Y = midY + arrowLength * Math.sin(angle + Math.PI / 6);

  return (
    <>
      {/* Edge path */}
      <path
        id={id}
        className={`react-flow__edge-path ${data.isHighlighted ? 'stroke-blue-500' : ''}`}
        d={edgePath}
        strokeWidth={2}
        fill="none"
      />

      {/* Forward arrow */}
      <path
        d={`M ${midX} ${midY} L ${forwardArrowPoint1X} ${forwardArrowPoint1Y} M ${midX} ${midY} L ${forwardArrowPoint2X} ${forwardArrowPoint2Y}`}
        stroke={data.isHighlighted ? '#3b82f6' : '#94a3b8'}
        strokeWidth={2}
        fill="none"
        className="react-flow__edge-arrow"
      />

      {/* Backward arrow (if bidirectional) */}
      {data.isBidirectional && (
        <path
          d={`M ${midX} ${midY} L ${backwardArrowPoint1X} ${backwardArrowPoint1Y} M ${midX} ${midY} L ${backwardArrowPoint2X} ${backwardArrowPoint2Y}`}
          stroke={data.isHighlighted ? '#3b82f6' : '#94a3b8'}
          strokeWidth={2}
          fill="none"
          className="react-flow__edge-arrow"
        />
      )}
    </>
  );
}

export const InterfaceEdge = memo(InterfaceEdgeComponent);
