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
      <div className={`node-content rounded-full bg-white border-2 ${selected ? 'border-blue-500' : 'border-gray-200'} p-4 min-w-[100px] min-h-[100px] flex items-center justify-center`}>
        <div className="text-center">
          <div className="font-bold">{data.label}</div>
          <div className="text-sm">{data.service?.appInstanceId}</div>
        </div>
      </div>
    </div>
  );
}

export const ServiceNode = memo(ServiceNodeComponent);
