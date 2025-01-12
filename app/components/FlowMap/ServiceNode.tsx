import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { FlowMapNode } from '~/types/flowMap';

const STATUS_STYLES = {
  ['Active']: 'border-green-500 bg-green-50',
  ['Inactive']: 'border-red-500 bg-red-50',
  ['TBC']: 'border-yellow-500 bg-yellow-50'
} as const;

const HANDLE_POSITIONS = [
  { type: "source", position: Position.Right, id: "source-right" },
  { type: "source", position: Position.Left, id: "source-left" },
  { type: "source", position: Position.Top, id: "source-top" },
  { type: "source", position: Position.Bottom, id: "source-bottom" },
  { type: "target", position: Position.Right, id: "target-right" },
  { type: "target", position: Position.Left, id: "target-left" },
  { type: "target", position: Position.Top, id: "target-top" },
  { type: "target", position: Position.Bottom, id: "target-bottom" }
] as const;

interface ServiceNodeProps extends NodeProps<FlowMapNode['data']> {
  isExpanded: boolean;
  onExpand: () => void;
}

function ServiceNodeComponent({ data, selected, isExpanded, onExpand }: ServiceNodeProps) {
  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onExpand();
  }, [onExpand]);

  const isActive = data.service?.appInstStatus === 'Active';

  return (
    <div className="relative">
      {/* Connection Handles */}
      {HANDLE_POSITIONS.map(({ type, position, id }) => (
        <Handle
          key={id}
          type={type}
          position={position}
          id={id}
          className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
          isConnectable={true}
        />
      ))}
      
      {/* Active Status Ring */}
      {isActive && (
        <div className="absolute inset-0 rounded-full border-4 border-green-200 -m-1" />
      )}
      
      {/* Node Content */}
      <div
        className={`
          relative flex flex-col items-center justify-center
          w-[120px] h-[120px] rounded-full border-2 shadow-sm
          ${selected ? 'border-blue-500 shadow-blue-100' : 'border-gray-300'}
          ${STATUS_STYLES[data.service?.status ?? "TBC"]}
        `}
      >
        <div className="text-sm">{data.label}</div>
        <div className="text-xs">{data.service?.appInstanceId}</div>
        
        {/* Expand/Collapse Button */}
        {(
          <button
            onClick={handleExpandClick}
            className="absolute -right-1 bottom-2 p-1 rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50"
          >
            <span className="block font-bold text-gray-600 leading-none" style={{ fontSize: '16px' }}>
              {isExpanded ? '−' : '+'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export const ServiceNode = memo(ServiceNodeComponent);
