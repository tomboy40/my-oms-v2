import { memo } from 'react';
import { EdgeLabelRenderer, BaseEdge, EdgeProps, getBezierPath } from 'reactflow';
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
  const statusColor = statusColors[data.status] || statusColors[InterfaceStatus.INACTIVE];

  // Calculate the midpoint for the label
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;

  return (
    <>
      <BaseEdge
        path={`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}
        markerEnd="url(#arrow)"
        style={{
          strokeWidth: 2,
          stroke: data.status === InterfaceStatus.ACTIVE ? '#22c55e' : '#9ca3af',
        }}
      />
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={data.status === InterfaceStatus.ACTIVE ? '#22c55e' : '#9ca3af'}
          />
        </marker>
      </defs>
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={`px-2 py-1 rounded bg-white shadow-sm border text-xs ${statusColor}`}
        >
          <div className="font-medium">{data.interfaceStatus}</div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const InterfaceEdge = memo(InterfaceEdgeComponent);
