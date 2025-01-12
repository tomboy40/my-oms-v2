import { useState } from "react";
import type { Dataset } from "~/types/datasets";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface InterfaceDatasetsProps {
  datasets: Dataset[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 10;

export function InterfaceDatasets({ datasets, isLoading }: InterfaceDatasetsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(datasets.length / ITEMS_PER_PAGE);
  
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDatasets = datasets.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm text-gray-500">Loading datasets...</p>
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">No datasets associated with this interface.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dataset Name</TableHead>
              <TableHead>Primary Data Term</TableHead>
              <TableHead>Product Types</TableHead>
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
