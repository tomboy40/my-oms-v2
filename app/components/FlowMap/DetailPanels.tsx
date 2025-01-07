import type { ITService, Interface } from "~/types/db";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface DetailPanelProps {
  onClose: () => void;
}

interface ServiceDetailPanelProps extends DetailPanelProps {
  service: ITService;
}

interface InterfaceDetailPanelProps extends DetailPanelProps {
  interfaces: Interface[];
  currentIndex: number;
  onNavigate?: (index: number) => void;
}

const DetailField = ({ label, value }: { label: string; value: string | null }) => (
  <div className="mb-4">
    <div className="text-sm font-medium text-gray-500">{label}</div>
    <div className="mt-1 text-sm text-gray-900">{value || '-'}</div>
  </div>
);

export function ServiceDetailPanel({ service, onClose }: ServiceDetailPanelProps) {
  return (
    <div className="fixed right-4 top-20 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Service Details</h3>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-gray-100 active:bg-gray-200 transition-colors border border-gray-200"
          aria-label="Close panel"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <DetailField label="App Instance ID" value={service.appInstanceId} />
      <DetailField label="Service Name" value={service.serviceName} />
      <DetailField label="IT Service Owner" value={service.itServiceOwner} />
      <DetailField label="Status" value={service.status} />
      <DetailField label="App Description" value={service.appDescription} />
    </div>
  );
}

export function InterfaceDetailPanel({ interfaces, currentIndex, onNavigate, onClose }: InterfaceDetailPanelProps) {
  if (!interfaces || interfaces.length === 0) {
    return null;
  }

  const hasMultipleInterfaces = interfaces.length > 1;
  const safeIndex = currentIndex || 0;
  const currentInterface = interfaces[safeIndex];

  if (!currentInterface) {
    return null;
  }

  return (
    <div className="fixed right-4 top-20 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-900">Interface Details</h3>
          {hasMultipleInterfaces && (
            <span className="ml-2 text-sm text-gray-500">
              {safeIndex + 1} of {interfaces.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-gray-100 active:bg-gray-200 transition-colors border border-gray-200"
          aria-label="Close panel"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Interface Navigation */}
      {hasMultipleInterfaces && (
        <div className="flex justify-between items-center mb-4 bg-gray-50 rounded-lg p-2">
          <button
            onClick={() => onNavigate?.(safeIndex - 1)}
            disabled={safeIndex === 0}
            className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
              safeIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600'
            }`}
            title="Previous Interface"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-sm font-medium text-gray-700">
            Interface {safeIndex + 1} of {interfaces.length}
          </div>
          <button
            onClick={() => onNavigate?.(safeIndex + 1)}
            disabled={safeIndex === interfaces.length - 1}
            className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
              safeIndex === interfaces.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600'
            }`}
            title="Next Interface"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Interface Details */}
      <div className="space-y-4">
        <DetailField label="Interface Name" value={currentInterface.interfaceName} />
        <DetailField label="Send App Name" value={currentInterface.sendAppName} />
        <DetailField label="Received App Name" value={currentInterface.receivedAppName} />
        <DetailField label="Transfer Type" value={currentInterface.transferType} />
        <DetailField label="Frequency" value={currentInterface.frequency} />
        <DetailField label="Interface Status" value={currentInterface.interfaceStatus} />
      </div>
    </div>
  );
}
