import { useState } from "react";
import { ChevronDown, ChevronUp, Download, RefreshCw } from "lucide-react";
import * as Select from "@radix-ui/react-select";
import type { ITService } from "~/types/db";
import React from "react";

const PAGE_SIZES = [10, 25, 50, 100] as const;

type Column = {
  key: keyof ITService | "actions";
  label: string;
  format?: (value: string) => string;
};

const COLUMNS: Column[] = [
  { key: "appInstanceId", label: "Application ID" },
  { key: "appInstanceName", label: "Application Name" },
  { key: "serviceName", label: "Service Name" },
  { key: "appCriticality", label: "Tier" },
  { key: "itServiceOwner", label: "Service Owner" },
  { key: "itServiceOwnerEmail", label: "Owner Email" },
  { key: "appInstStatus", label: "Status" },
  { key: "actions", label: "Actions" },
];

const EXPORT_COLUMNS: Column[] = [
  { key: "serviceName", label: "Service Name" },
  { key: "pladaServiceId", label: "PLADA Service ID" },
  { key: "appInstanceName", label: "Application Name" },
  { key: "appInstStatus", label: "Status" },
  { key: "appCriticality", label: "Tier" },
  { key: "appDescription", label: "Description" },
  { key: "itServiceOwner", label: "Service Owner" },
  { key: "itServiceOwnerId", label: "Owner ID" },
  { key: "itServiceOwnerEmail", label: "Owner Email" },
  { key: "itServiceOwnerDelegate", label: "Delegate Owner" },
  { key: "itServiceOwnerDelegateId", label: "Delegate Owner ID" },
  { key: "itServiceOwnerDelegateEmail", label: "Delegate Email" },
  { key: "serviceItOrg6", label: "Organization L6" },
  { key: "serviceItOrg7", label: "Organization L7" },
  { key: "serviceItOrg8", label: "Organization L8" },
  { key: "serviceItOrg9", label: "Organization L9" },
  { key: "supportGroup", label: "Support Group" },
  { key: "updatedAt", label: "Last Updated" },
];

interface DetailSection {
  title: string;
  fields: Column[];
}

const DETAIL_SECTIONS: DetailSection[] = [
  {
    title: "Application Information",
    fields: [
      { key: "appInstanceId", label: "Application ID" },
      { key: "appInstanceName", label: "Application Name" },
      { key: "serviceName", label: "Service Name" },
      { key: "appInstStatus", label: "Status" },
      { 
        key: "appCriticality", 
        label: "Tier",
        format: (value: string) => {
          if (!value) return "N/A";
          if (value.includes("1/1/2001")) return "N/A";
          return value;
        }
      },
      { key: "environment", label: "Environment" },
      { key: "appDescription", label: "Description" },
    ],
  },
  {
    title: "Owner Information",
    fields: [
      { 
        key: "itServiceOwner", 
        label: "Service Owner",
        format: (value: string) => value || "N/A"
      },
      { key: "itServiceOwnerId", label: "Owner ID" },
      { 
        key: "itServiceOwnerEmail", 
        label: "Owner Email",
        format: (value: string) => value || "N/A"
      },
      { key: "itServiceOwnerDelegate", label: "Delegate Owner" },
      { key: "itServiceOwnerDelegateId", label: "Delegate Owner ID" },
      { key: "itServiceOwnerDelegateEmail", label: "Delegate Email" },
    ],
  },
  {
    title: "Support Information",
    fields: [
      { key: "supportGroup", label: "Support Group" },
      { key: "serviceItOrg9", label: "IT Org 9" },
    ],
  },
];

interface TableState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

interface ServiceTableProps {
  data: ITService[];
  total: number;
  pageSize: number;
  page: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
  searchQuery?: string;
  onStateChange: (newState: TableState) => void;
  onSync?: (appInstanceId: string) => void;
  isSyncing?: boolean;
}

export function ServiceTable({
  data,
  total,
  pageSize,
  page,
  sortBy,
  sortDirection,
  searchQuery,
  onStateChange,
  onSync,
  isSyncing
}: ServiceTableProps) {
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  const handleSort = (key: string) => {
    if (key === "actions") return; // Don't sort by actions column
    onStateChange({
      page,
      pageSize,
      sortBy: key,
      sortDirection: sortBy === key && sortDirection === "asc" ? "desc" : "asc"
    });
  };

  const handleExportCsv = () => {
    const headers = EXPORT_COLUMNS.map(col => col.label).join(",");
    const rows = data.map(row => 
      EXPORT_COLUMNS.map(col => {
        const value = row[col.key as keyof ITService];
        return value ? `"${String(value).replace(/"/g, '""')}"` : "";
      }).join(",")
    );
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `it-services-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleRowClick = (appInstanceId: string) => {
    setExpandedServiceId(expandedServiceId === appInstanceId ? null : appInstanceId);
  };

  const formatValue = (value: unknown, format?: (value: string) => string): string => {
    if (value === null || value === undefined) return "N/A";
    
    if (value instanceof Date || 
        (typeof value === "string" && 
         /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && 
         !isNaN(Date.parse(value)))) {
      const formattedDate = new Date(value).toLocaleString();
      return format ? format(formattedDate) : formattedDate;
    }
    
    const stringValue = String(value);
    return format ? format(stringValue) : stringValue;
  };

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-12">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">No services found</h3>
          {searchQuery?.trim() && /^\d+$/.test(searchQuery.trim()) ? (
            <div className="space-y-4">
              <p className="mt-2 text-sm text-gray-500">
                Would you like to synchronize data from ODS for Application ID: {searchQuery}?
              </p>
              <button
                onClick={() => onSync?.(searchQuery.trim())}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync from ODS
                  </>
                )}
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Try searching with a different Application name or ID, or enter a valid Application ID to sync with ODS
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Select.Root
            value={String(pageSize)}
            onValueChange={(value) => {
              onStateChange({
                page: 1,
                pageSize: Number(value),
                sortBy,
                sortDirection
              });
            }}
          >
            <Select.Trigger
              className="inline-flex items-center justify-between rounded-md border border-gray-300 px-2 py-1 w-16 text-sm"
              aria-label="Page size"
            >
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="h-4 w-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="overflow-hidden bg-white rounded-md shadow-lg border border-gray-200">
                <Select.Viewport>
                  {PAGE_SIZES.map(size => (
                    <Select.Item
                      key={size}
                      value={String(size)}
                      className="relative flex items-center px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none"
                    >
                      <Select.ItemText>{size}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
          <span className="text-sm text-gray-500">per page</span>
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} results
          </span>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-3 py-3"></th>
              {COLUMNS.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    {label}
                    {sortBy === key && key !== "actions" && (
                      sortDirection === "asc" ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((service) => (
              <React.Fragment key={service.appInstanceId}>
                <tr
                  onClick={() => handleRowClick(service.appInstanceId)}
                  className={`hover:bg-gray-50 cursor-pointer ${expandedServiceId === service.appInstanceId ? 'bg-gray-50' : ''}`}
                >
                  <td className="px-3 py-4">
                    {expandedServiceId === service.appInstanceId ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </td>
                  {COLUMNS.map(({ key, format }) => {
                    if (key === "actions") {
                      return (
                        <td key={key} className="px-3 py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSync?.(service.appInstanceId)}
                            disabled={isSyncing}
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                          >
                            {isSyncing ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Syncing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3" />
                                Sync
                              </>
                            )}
                          </button>
                        </td>
                      );
                    }
                    return (
                      <td key={key} className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatValue(service[key as keyof ITService], format)}
                      </td>
                    );
                  })}
                </tr>
                {expandedServiceId === service.appInstanceId && (
                  <tr key={`${service.appInstanceId}-details`}>
                    <td colSpan={COLUMNS.length + 1} className="px-3 py-4 bg-gray-50">
                      <div className="bg-white p-4 rounded-md space-y-6">
                        {DETAIL_SECTIONS.map(section => (
                          <div key={section.title}>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">{section.title}</h4>
                            <dl className="grid grid-cols-2 gap-4">
                              {section.fields.map(({ key, label, format }) => (
                                <div key={key}>
                                  <dt className="text-sm font-medium text-gray-500">{label}</dt>
                                  <dd className="mt-1 text-sm text-gray-900">
                                    {formatValue(service[key as keyof ITService], format)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end items-center">
        <div className="flex gap-2">
          <button
            onClick={() => onStateChange({ page: page - 1, pageSize, sortBy, sortDirection })}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => onStateChange({ page: page + 1, pageSize, sortBy, sortDirection })}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}