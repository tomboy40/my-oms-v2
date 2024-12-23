import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { FlowMapNode } from '~/types/flowMap';
import { ServiceStatus } from '~/types/services';

const statusColors = {
  [ServiceStatus.ACTIVE]: 'text-green-500 border-green-500 bg-green-50',
  [ServiceStatus.INACTIVE]: 'text-gray-400 border-gray-400 bg-gray-50',
  [ServiceStatus.MAINTENANCE]: 'text-yellow-500 border-yellow-500 bg-yellow-50',
  [ServiceStatus.ERROR]: 'text-red-500 border-red-500 bg-red-50',
};

function ServiceNodeComponent({ data }: NodeProps<FlowMapNode['data']>) {
  const statusColor = statusColors[data.status] || statusColors[ServiceStatus.INACTIVE];

  // Helper function to create multiple handles
  const createHandles = (position: Position, count: number) => {
    const handles = [];
    const step = 1 / (count + 1);
    
    for (let i = 1; i <= count; i++) {
      const percentage = i * step;
      const style = {
        [position === Position.Left || position === Position.Right ? 'top' : 'left']: `${percentage * 100}%`,
        opacity: 0,
        pointerEvents: 'all' as const
      };
      
      const handleId = `${position}-${i}`;
      
      handles.push(
        <Handle
          key={`${handleId}-source`}
          type="source"
          position={position}
          className="w-2 h-2 !bg-transparent"
          style={style}
          id={handleId}
        />,
        <Handle
          key={`${handleId}-target`}
          type="target"
          position={position}
          className="w-2 h-2 !bg-transparent"
          style={style}
          id={handleId}
        />
      );
    }
    return handles;
  };

  const handleCollapseClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    data.onToggleCollapse?.();
  };

  return (
    <div className="relative group">
      {/* Connection Points */}
      {createHandles(Position.Top, 4)}
      {createHandles(Position.Right, 4)}
      {createHandles(Position.Bottom, 4)}
      {createHandles(Position.Left, 4)}
      
      {/* Collapse/Expand Button */}
      <button
        onClick={handleCollapseClick}
        className={`absolute -top-6 left-1/2 transform -translate-x-1/2 w-5 h-5 rounded-full bg-white border border-gray-300 
          flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${data.isCollapsed ? 'text-blue-500' : 'text-gray-500'}`}
      >
        {data.isCollapsed ? (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        )}
      </button>
      
      {/* Service Circle */}
      <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${statusColor} ${
        data.isHighlighted ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}>
        <div className="flex flex-col items-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
      </div>

      {/* Service Label */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <div className={`text-xs font-medium ${data.isHighlighted ? 'text-blue-900' : 'text-gray-900'}`}>
          {data.label}
        </div>
      </div>
    </div>
  );
}

export const ServiceNode = memo(ServiceNodeComponent);
