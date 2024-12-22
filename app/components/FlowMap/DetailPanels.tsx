import type { ITService, Interface } from "@prisma/client";
import { X } from "lucide-react";

interface DetailPanelProps {
  onClose: () => void;
}

interface ServiceDetailPanelProps extends DetailPanelProps {
  service: ITService;
}

interface InterfaceDetailPanelProps extends DetailPanelProps {
  interface: Interface;
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

export function InterfaceDetailPanel({ interface: iface, onClose }: InterfaceDetailPanelProps) {
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

      <DetailField label="Interface Name" value={iface.interfaceName} />
      <DetailField label="Send App Name" value={iface.sendAppName} />
      <DetailField label="Received App Name" value={iface.receivedAppName} />
      <DetailField label="Transfer Type" value={iface.transferType} />
      <DetailField label="Frequency" value={iface.frequency} />
      <DetailField label="Interface Status" value={iface.interfaceStatus} />
    </div>
  );
}
