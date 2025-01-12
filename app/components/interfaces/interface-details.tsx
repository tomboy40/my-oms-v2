import { useState, useEffect } from "react";
import { useFetcher, useNavigate } from "@remix-run/react";
import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import * as Tabs from "@radix-ui/react-tabs";
import { ChevronDown, ChevronRight, Grid, Info, Pencil } from "lucide-react";
import type { Interface } from "~/types/db";
import type { Dataset } from "~/types/datasets";
import { InterfaceDatasets } from "./interface-datasets";

interface InterfaceDetailsProps {
  interface: Interface;
  datasets?: Dataset[];
}

export function InterfaceDetails({ interface: iface, datasets = [] }: InterfaceDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localDatasets, setLocalDatasets] = useState<Dataset[]>(datasets);
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState({
    sla: iface.sla ?? "",
    priority: iface.priority ?? "LOW",
    remarks: iface.remarks ?? "",
    status: iface.status ?? "ACTIVE",
  });

  const fetcher = useFetcher();
  const isUpdating = fetcher.state !== "idle";

  // Update local datasets when fetcher data changes
  useEffect(() => {
    if (fetcher.data?.datasets) {
      setLocalDatasets(fetcher.data.datasets);
    }
  }, [fetcher.data]);

  // Load datasets when tab changes to datasets
  useEffect(() => {
    if (activeTab === "datasets" && localDatasets.length === 0 && iface.relatedDrilldownKey) {
      fetcher.load(`/api/datasets?interfaceSerial=${encodeURIComponent(iface.relatedDrilldownKey)}`);
    }
  }, [activeTab, localDatasets.length, iface.relatedDrilldownKey]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

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
      <Tabs.Root 
        value={activeTab}
        defaultValue="details" 
        className="space-y-4"
        onValueChange={handleTabChange}
      >
        <Tabs.List className="flex border-b border-gray-200">
          <Tabs.Trigger
            value="details"
            className="inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium -mb-px data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            <Info className="h-4 w-4" />
            Interface Details
          </Tabs.Trigger>
          <Tabs.Trigger
            value="datasets"
            className="inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium -mb-px data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            <Grid className="h-4 w-4" />
            Datasets ({localDatasets.length})
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="details" className="outline-none">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label.Root className="block text-sm font-medium text-gray-700 mb-2" htmlFor="sla">
                      SLA
                    </Label.Root>
                    <input
                      id="sla"
                      type="text"
                      value={formData.sla}
                      onChange={(e) => setFormData(prev => ({ ...prev, sla: e.target.value }))}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter SLA"
                    />
                  </div>
                  
                  <div>
                    <Label.Root className="block text-sm font-medium text-gray-700 mb-2" htmlFor="priority">
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
                        className="inline-flex items-center justify-between w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
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
                </div>
                
                <div className="mt-6">
                  <Label.Root className="block text-sm font-medium text-gray-700 mb-2" htmlFor="remarks">
                    Remarks
                  </Label.Root>
                  <textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter remarks"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
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
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-base font-medium text-gray-900">Interface Information</h4>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="h-4 w-4" />
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
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="datasets" className="outline-none">
          <div className="space-y-6">
            <InterfaceDatasets 
              datasets={localDatasets} 
              isLoading={fetcher.state === "loading"} 
            />
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}