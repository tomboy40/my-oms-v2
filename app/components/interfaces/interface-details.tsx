import { useState, useEffect, useCallback } from "react";
import { useFetcher, useNavigate, useBeforeUnload, useLocation } from "@remix-run/react";
import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-alert-dialog";
import { ChevronDown, ChevronRight, Grid, Info, Pencil, Save, X } from "lucide-react";
import type { Interface } from "~/types/db";
import type { Dataset } from "~/types/datasets";
import { InterfaceDatasets } from "./interface-datasets";

interface InterfaceDetailsProps {
  interface: Interface;
  datasets?: Dataset[];
  onNavigate?: (to: string) => void;
}

export function InterfaceDetails({ interface: iface, datasets = [], onNavigate }: InterfaceDetailsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [localDatasets, setLocalDatasets] = useState<Dataset[]>(datasets);
  const [activeTab, setActiveTab] = useState("details");
  const [editingFields, setEditingFields] = useState<{
    sla: boolean;
    priority: boolean;
    remarks: boolean;
  }>({
    sla: false,
    priority: false,
    remarks: false,
  });
  const [formData, setFormData] = useState({
    sla: iface.sla ?? "",
    priority: iface.priority ?? "LOW",
    remarks: iface.remarks ?? "",
    status: iface.status ?? "ACTIVE",
  });
  const [originalData, setOriginalData] = useState(formData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const fetcher = useFetcher();
  const isUpdating = fetcher.state !== "idle";
  const isLoading = fetcher.state === "loading";
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Update local datasets when fetcher data changes
  useEffect(() => {
    if (fetcher.data?.datasets) {
      setLocalDatasets(fetcher.data.datasets);
      setHasAttemptedLoad(true);
    }
  }, [fetcher.data]);

  // Load datasets when tab changes to datasets
  useEffect(() => {
    if (activeTab === "datasets" && !hasAttemptedLoad && iface.relatedDrilldownKey) {
      fetcher.load(`/api/datasets?interfaceSerial=${encodeURIComponent(iface.relatedDrilldownKey)}`);
    }
  }, [activeTab, hasAttemptedLoad, iface.relatedDrilldownKey]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = 
      formData.sla !== originalData.sla ||
      formData.priority !== originalData.priority ||
      formData.remarks !== originalData.remarks;
    setHasUnsavedChanges(hasChanges);
  }, [formData, originalData]);

  // Check if field has changes
  const hasFieldChanges = (field: keyof typeof formData) => {
    return formData[field] !== originalData[field];
  };

  // Handle save button state
  const isSaveDisabled = (field: keyof typeof formData) => {
    return !hasFieldChanges(field) || isUpdating;
  };

  // Handle tab changes and navigation
  const handleTabChange = (value: string) => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingNavigation(value);
    } else {
      setActiveTab(value);
    }
  };

  // Handle navigation away from page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle navigation within the app
  const handleNavigate = useCallback((to: string) => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingNavigation(to);
    } else {
      if (onNavigate) {
        onNavigate(to);
      } else {
        navigate(to);
      }
    }
  }, [hasUnsavedChanges, navigate, onNavigate]);

  // Handle parent-triggered navigation
  useEffect(() => {
    if (location.pathname !== '/interfaces' && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingNavigation(location.pathname);
    }
  }, [location.pathname, hasUnsavedChanges]);

  // Handle field editing
  const handleFieldEdit = (field: keyof typeof editingFields, value: boolean) => {
    setEditingFields(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
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
    setOriginalData(formData);
    setEditingFields({ sla: false, priority: false, remarks: false });
    setHasUnsavedChanges(false);
  };

  const handleCancel = (field: keyof typeof editingFields) => {
    handleFieldEdit(field, false);
    setFormData(prev => ({ ...prev, [field]: originalData[field as keyof typeof originalData] }));
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      if (pendingNavigation.startsWith('/')) {
        navigate(pendingNavigation);
      } else {
        setActiveTab(pendingNavigation);
      }
      setPendingNavigation(null);
    }
    setShowUnsavedDialog(false);
    setFormData(originalData);
    setHasUnsavedChanges(false);
    setEditingFields({ sla: false, priority: false, remarks: false });
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
            Datasets {!hasAttemptedLoad && iface.relatedDrilldownKey ? (
              <span className="inline-flex items-center">
                <span className="animate-pulse">...</span>
              </span>
            ) : iface.relatedDrilldownKey ? (
              `(${localDatasets.length})`
            ) : (
              "(0)"
            )}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="details" className="outline-none">
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-base font-medium text-gray-900">Interface Information</h4>
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
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    Priority
                    {!editingFields.priority && (
                      <button
                        type="button"
                        onClick={() => handleFieldEdit("priority", true)}
                        className="inline-flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </dt>
                  {editingFields.priority ? (
                    <>
                      <Select.Root
                        value={formData.priority}
                        onValueChange={(value) => handleFieldChange("priority", value as "LOW" | "MEDIUM" | "HIGH")}
                      >
                        <Select.Trigger
                          className="inline-flex items-center justify-between w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500 mt-1"
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
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleCancel("priority")}
                          className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          disabled={isSaveDisabled("priority")}
                        >
                          {isUpdating ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <dd className="mt-1 text-sm text-gray-900">{formData.priority ?? "N/A"}</dd>
                  )}
                </div>
                <div className="col-span-3">
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    Remarks
                    {!editingFields.remarks && (
                      <button
                        type="button"
                        onClick={() => handleFieldEdit("remarks", true)}
                        className="inline-flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </dt>
                  {editingFields.remarks ? (
                    <>
                      <textarea
                        value={formData.remarks}
                        onChange={(e) => handleFieldChange("remarks", e.target.value)}
                        className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500 mt-1"
                        rows={3}
                        placeholder="Enter remarks"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleCancel("remarks")}
                          className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          disabled={isSaveDisabled("remarks")}
                        >
                          {isUpdating ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <dd className="mt-1 text-sm text-gray-900">{formData.remarks ?? "N/A"}</dd>
                  )}
                </div>
              </dl>
            </div>
          </div>
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

      {/* Unsaved Changes Dialog */}
      <Dialog.Root open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Unsaved Changes
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-500">
              You have unsaved changes. Are you sure you want to leave?
            </Dialog.Description>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowUnsavedDialog(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmNavigation}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}