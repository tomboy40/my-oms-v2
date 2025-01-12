import { useState } from "react";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import * as Select from "@radix-ui/react-select";
import { InterfaceDetails } from "./interface-details";
import type { Interface } from "@prisma/client";
import React from "react";

const PAGE_SIZES = [10, 25, 50, 100] as const;

// Only show key columns in the table
const COLUMNS = [
  { key: "eimInterfaceId", label: "Interface ID" },
  { key: "interfaceName", label: "Interface Name" },
  { key: "sendAppId", label: "Send App ID" },
  { key: "sendAppName", label: "Send App Name" },
  { key: "receivedAppId", label: "Receive App ID" },
  { key: "receivedAppName", label: "Receive App Name" },
  { key: "transferType", label: "Transfer Type" },
  { key: "frequency", label: "Frequency" },
  { key: "demiseDate", label: "Demise Date" },
] as const;

// Keep all columns for CSV export
const EXPORT_COLUMNS = [
  ...COLUMNS,
  { key: "pattern", label: "Pattern" },
  { key: "technology", label: "Technology" },
  { key: "interfaceStatus", label: "Interface Status" },
  { key: "priority", label: "Priority" },
  { key: "sla", label: "SLA" },
  { key: "remarks", label: "Remarks" },
] as const;

interface TableState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

interface InterfaceTableProps {
  data: Interface[];
  total: number;
  pageSize: number;
  page: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onStateChange: (newState: TableState) => void;
}

export function InterfaceTable({
  data,
  total,
  pageSize,
  page,
  sortBy,
  sortDirection,
  onStateChange
}: InterfaceTableProps) {
  const [expandedInterfaceId, setExpandedInterfaceId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  const handleSort = (key: string) => {
    onStateChange({
      page,
      pageSize,
      sortBy: key,
      sortDirection: sortBy === key && sortDirection === "asc" ? "desc" : "asc"
    });
  };

  const handleExportCsv = () => {
    // Create CSV content
    const headers = EXPORT_COLUMNS.map(col => col.label).join(",");
    const rows = data.map(row => 
      EXPORT_COLUMNS.map(col => {
        const value = row[col.key as keyof Interface];
        return value ? `"${String(value).replace(/"/g, '""')}"` : "";
      }).join(",")
    );
    const csv = [headers, ...rows].join("\n");

    // Create and download file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `interfaces-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleRowClick = (interfaceId: string) => {
    setExpandedInterfaceId(expandedInterfaceId === interfaceId ? null : interfaceId);
  };
  
  if (data.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-12">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">No interfaces found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try searching with a different Application name or ID, or enter a valid Application ID to sync with DLAS
          </p>
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
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortBy === col.key && (
                      sortDirection === "asc" 
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => (
              <React.Fragment key={row.id}>
                <tr
                  onClick={() => handleRowClick(row.id)}
                  className={`hover:bg-gray-50 cursor-pointer ${expandedInterfaceId === row.id ? 'bg-gray-50' : ''}`}
                >
                  <td className="px-3 py-4">
                    {expandedInterfaceId === row.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </td>
                  {COLUMNS.map(col => (
                    <td key={`${row.id}-${col.key}`} className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {String(row[col.key as keyof Interface] ?? "N/A")}
                    </td>
                  ))}
                </tr>
                {expandedInterfaceId === row.id && (
                  <tr key={`${row.id}-details`}>
                    <td colSpan={COLUMNS.length + 1} className="px-3 py-4 bg-gray-50">
                      <InterfaceDetails interface={row} />
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
            onClick={() => {
              onStateChange({
                page: page - 1,
                pageSize,
                sortBy,
                sortDirection
              });
            }}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => {
              onStateChange({
                page: page + 1,
                pageSize,
                sortBy,
                sortDirection
              });
            }}
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