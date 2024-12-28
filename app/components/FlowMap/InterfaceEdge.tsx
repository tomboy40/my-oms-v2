import { memo } from 'react';
import { EdgeLabelRenderer, BaseEdge, EdgeProps } from 'reactflow';
import type { FlowMapEdge } from '~/types/flowMap';
import { InterfaceStatus } from '~/types/interfaces';

const STATUS_STYLES = {
  [InterfaceStatus.ACTIVE]: 'text-green-500 border-green-500',
  [InterfaceStatus.INACTIVE]: 'text-gray-400 border-gray-400',
  [InterfaceStatus.TBC]: 'text-red-500 border-red-500',
} as const;

function InterfaceEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style = {},
  selected,
}: EdgeProps<FlowMapEdge['data']>) {
  if (!data) return null;

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  
  // Calculate angle for marker rotation
  const angle = Math.atan2(targetY - sourceY, targetX - sourceX) * (180 / Math.PI);
  const hasMultipleInterfaces = data.interfaces && data.interfaces.length > 1;
  const isBidirectional = data.isBidirectional;
  
  return (
    <>
      {/* Main Edge Line */}
      <path
        id={id}
        d={`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}
        className={`react-flow__edge-path ${selected ? 'selected' : ''}`}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? '#3b82f6' : '#94a3b8',
        }}
      />
      
      {/* Direction Markers */}
      {isBidirectional ? (
        // Bidirectional Markers
        <>
          {/* Forward arrow */}
          <g transform={`translate(${midX + 15},${midY}) rotate(${angle})`}>
            <path
              d="M -6 -4 L 6 0 L -6 4 Z"
              fill={selected ? '#3b82f6' : '#94a3b8'}
              stroke="none"
            />
          </g>
          {/* Reverse arrow */}
          <g transform={`translate(${midX - 15},${midY}) rotate(${angle + 180})`}>
            <path
              d="M -6 -4 L 6 0 L -6 4 Z"
              fill={selected ? '#3b82f6' : '#94a3b8'}
              stroke="none"
            />
          </g>
        </>
      ) : (
        // Single direction arrow
        <g transform={`translate(${midX},${midY}) rotate(${angle})`}>
          <path
            d="M -6 -4 L 6 0 L -6 4 Z"
            fill={selected ? '#3b82f6' : '#94a3b8'}
            stroke="none"
          />
        </g>
      )}

      {/* Interface Count Indicator */}
      {hasMultipleInterfaces && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${midX}px,${midY - 15}px)`,
              pointerEvents: 'none',
            }}
            className="px-2 py-1 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-medium text-gray-600"
          >
            {data.interfaces.length} Feeds
            {isBidirectional && ` (${data.forwardCount}↑/${data.reverseCount}↓)`}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const InterfaceEdge = memo(InterfaceEdgeComponent);
