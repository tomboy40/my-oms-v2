import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { FlowMapNode } from '~/types/flowMap';
import { ServiceStatus } from '~/types/services';

const STATUS_STYLES = {
  [ServiceStatus.ACTIVE]: 'border-green-500 bg-green-50',
  [ServiceStatus.INACTIVE]: 'border-red-500 bg-red-50',
  [ServiceStatus.TBC]: 'border-yellow-500 bg-yellow-50'
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

function ServiceNodeComponent({ data, selected }: NodeProps<FlowMapNode['data']>) {
  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data.onToggleCollapse?.();
  }, [data.onToggleCollapse]);

  const isActive = data.service?.status === 'ACTIVE';

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
      <div className={`node-content rounded-full bg-white border-2 ${selected ? 'border-blue-500' : 'border-gray-200'} p-4 min-w-[100px] min-h-[100px] flex items-center justify-center relative`}>
        <div className="text-center">
          <div className="font-bold">{data.label}</div>
          <div className="text-sm">{data.service?.appInstanceId}</div>
        </div>

        {/* Expand/Collapse Button */}
        {data.onToggleCollapse && (
          <button
            onClick={handleExpandClick}
            className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            title={data.isCollapsed ? "Expand" : "Collapse"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-gray-600"
              style={{ transform: data.isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export const ServiceNode = memo(ServiceNodeComponent);
