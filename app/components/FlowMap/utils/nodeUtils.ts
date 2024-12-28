import type { FlowMapNode } from '~/types/flowMap';
import { ServiceStatus } from '~/types/services';
import type { VisibilityState } from '../hooks/useFlowVisibility';

interface ProcessNodeOptions {
  node: FlowMapNode;
  visibilityState: VisibilityState;
  isParent: boolean;
  isHighlighted: boolean;
}

/**
 * Process a flow map node with service data and visual states
 */
export function processNode({
  node,
  visibilityState,
  isParent,
  isHighlighted
}: ProcessNodeOptions): FlowMapNode {
  const service = node.data?.service || {
    appInstanceId: node.id,
    serviceName: node.data?.label || 'Unknown Service',
    status: ServiceStatus.TBC
  };

  const label = service.serviceName || node.data?.label || 'Unknown Service';

  return {
    ...node,
    draggable: true,
    data: {
      ...node.data,
      label,
      service: {
        ...service,
        appInstanceId: service.appInstanceId || node.id,
        serviceName: service.serviceName || label,
        status: service.status || ServiceStatus.TBC
      },
      isCollapsed: visibilityState.isNodeCollapsed(node.id),
      onToggleCollapse: () => visibilityState.toggleNodeVisibility(node.id),
      isParent,
      isHighlighted
    }
  };
}
