import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import type { Dataset } from "~/types/datasets";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, Pencil, Save, X } from "lucide-react";

interface InterfaceDatasetsProps {
  datasets: Dataset[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 10;

export function InterfaceDatasets({ datasets, isLoading }: InterfaceDatasetsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSLA, setEditingSLA] = useState<string | null>(null);
  const [editedSLA, setEditedSLA] = useState<string>("");
  const fetcher = useFetcher();
  
  const totalPages = Math.ceil(datasets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDatasets = datasets.slice(startIndex, endIndex);

  const handleSLAEdit = (datasetId: string, currentSLA: string) => {
    setEditingSLA(datasetId);
    setEditedSLA(currentSLA);
  };

  const handleSLASave = (datasetId: string) => {
    fetcher.submit(
      {
        id: datasetId,
        sla: editedSLA,
      },
      {
        method: "PUT",
        action: "/api/datasets",
        encType: "application/json"
      }
    );
    setEditingSLA(null);
  };

  const calculateRAGStatus = (lastArrivalTime: string | null, sla: string | null) => {
    if (!lastArrivalTime || !sla) return "R";
    
    const now = new Date();
    const lastArrival = new Date(lastArrivalTime);
    const [slaHours, slaMinutes] = sla.split(":").map(Number);
    const slaDate = new Date(now);
    slaDate.setHours(slaHours, slaMinutes, 0, 0);

    const timeDiff = slaDate.getTime() - lastArrival.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff >= 0 && hoursDiff <= 24) return "G";
    if (hoursDiff >= -1 && hoursDiff < 0) return "A";
    return "R";
  };

  const getRAGColor = (status: string) => {
    switch (status) {
      case "G": return "bg-green-500";
      case "A": return "bg-amber-500";
      case "R": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full mb-3" />
          <p className="text-sm text-gray-500">Loading datasets...</p>
        </div>
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No datasets associated with this interface.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dataset Name</TableHead>
              <TableHead>Primary Data Term</TableHead>
              <TableHead>Product Types</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Last Arrival</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentDatasets.map((dataset) => (
              <TableRow key={dataset.id}>
                <TableCell>{dataset.datasetName}</TableCell>
                <TableCell>{dataset.primaryDataTerm}</TableCell>
                <TableCell>
                  {Array.isArray(JSON.parse(dataset.productTypes || '[]'))
                    ? JSON.parse(dataset.productTypes || '[]').join(' | ')
                    : dataset.productTypes}
                </TableCell>
                <TableCell>
                  {editingSLA === dataset.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={editedSLA}
                        onChange={(e) => setEditedSLA(e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => handleSLASave(dataset.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingSLA(null)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>{dataset.sla || "N/A"}</span>
                      <button
                        onClick={() => handleSLAEdit(dataset.id, dataset.sla || "")}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </TableCell>
                <TableCell>{dataset.lastArrivalTime ? new Date(dataset.lastArrivalTime).toLocaleString() : "N/A"}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${getRAGColor(calculateRAGStatus(dataset.lastArrivalTime, dataset.sla))}`} />
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/events?datasetId=${dataset.id}`}
                  >
                    View Events
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex w-[100px] items-center justify-start gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
