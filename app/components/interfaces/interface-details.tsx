import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import type { Interface } from "@prisma/client";

interface InterfaceDetailsProps {
  interface: Interface;
}

export function InterfaceDetails({ interface: iface }: InterfaceDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    sla: iface.sla ?? "",
    priority: iface.priority ?? "LOW",
    remarks: iface.remarks ?? "",
  });

  const fetcher = useFetcher();
  const isUpdating = fetcher.state !== "idle";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetcher.submit(
      {
        id: iface.id,
        ...formData
      },
      {
        method: "PUT",
        action: "/api/interfaces",
        encType: "application/json"
      }
    );
    setIsEditing(false);
  };

  return (
    <div className="space-y-4 p-4">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label.Root className="block text-sm font-medium text-gray-700" htmlFor="sla">
              SLA
            </Label.Root>
            <input
              id="sla"
              type="text"
              value={formData.sla}
              onChange={(e) => setFormData(prev => ({ ...prev, sla: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter SLA"
            />
          </div>
          
          <div>
            <Label.Root className="block text-sm font-medium text-gray-700" htmlFor="priority">
              Priority
            </Label.Root>
            <Select.Root
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                priority: value as "LOW" | "MEDIUM" | "HIGH"
              }))}
            >
              <Select.Trigger
                id="priority"
                className="mt-1 inline-flex items-center justify-between w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                aria-label="Priority"
              >
                <Select.Value />
                <Select.Icon>
                  <ChevronDown className="h-4 w-4" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="overflow-hidden bg-white rounded-md shadow-lg border border-gray-200">
                  <Select.Viewport>
                    {["LOW", "MEDIUM", "HIGH"].map((priority) => (
                      <Select.Item
                        key={priority}
                        value={priority}
                        className="relative flex items-center px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none"
                      >
                        <Select.ItemText>{priority}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
          
          <div>
            <Label.Root className="block text-sm font-medium text-gray-700" htmlFor="remarks">
              Remarks
            </Label.Root>
            <textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              placeholder="Enter remarks"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={isUpdating}
            >
              {isUpdating ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Interface Details</h3>
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          </div>
          
          <dl className="grid grid-cols-3 gap-4">
            {/* Read-only fields */}
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{iface.status ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Direction</dt>
              <dd className="mt-1 text-sm text-gray-900">{iface.direction ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Technology</dt>
              <dd className="mt-1 text-sm text-gray-900">{iface.technology ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Pattern</dt>
              <dd className="mt-1 text-sm text-gray-900">{iface.pattern ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Interface Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{iface.interfaceStatus ?? "N/A"}</dd>
            </div>

            {/* Editable fields (shown in view mode) */}
            <div>
              <dt className="text-sm font-medium text-gray-500">SLA</dt>
              <dd className="mt-1 text-sm text-gray-900">{iface.sla ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Priority</dt>
              <dd className="mt-1 text-sm text-gray-900">{iface.priority ?? "N/A"}</dd>
            </div>
            <div className="col-span-3">
              <dt className="text-sm font-medium text-gray-500">Remarks</dt>
              <dd className="mt-1 text-sm text-gray-900">{iface.remarks ?? "N/A"}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
} 