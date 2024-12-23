import type { ITService, Interface } from "@prisma/client";
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
  onNavigate: (newIndex: number) => void;
}

const DetailField = ({ label, value }: { label: string; value: string | null }) => (
  <div className="mb-4">
    <div className="text-sm font-medium text-gray-500">{label}</div>
    <div className="mt-1 text-sm text-gray-900">{value || '-'}</div>
  </div>
);

export function ServiceDetailPanel({ service, onClose }: ServiceDetailPanelProps) {
  return (
    <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Service Details</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X size={20} />
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
  const currentInterface = interfaces[currentIndex];
  const hasMultipleInterfaces = interfaces.length > 1;

  return (
    <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Interface Details</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      {hasMultipleInterfaces && (
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
            className={`p-1 rounded hover:bg-gray-100 ${
              currentIndex === 0 ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-gray-500">
            Interface {currentIndex + 1} of {interfaces.length}
          </span>
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            disabled={currentIndex === interfaces.length - 1}
            className={`p-1 rounded hover:bg-gray-100 ${
              currentIndex === interfaces.length - 1 ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <DetailField label="Interface Name" value={currentInterface.interfaceName} />
      <DetailField label="Send App Name" value={currentInterface.sendAppName} />
      <DetailField label="Received App Name" value={currentInterface.receivedAppName} />
      <DetailField label="Transfer Type" value={currentInterface.transferType} />
      <DetailField label="Frequency" value={currentInterface.frequency} />
      <DetailField label="Interface Status" value={currentInterface.interfaceStatus} />
    </div>
  );
}
