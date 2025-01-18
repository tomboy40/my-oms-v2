import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import type { Event } from "~/types/events";
import type { CityTimezone } from "~/types/timezone";
import { CITY_TIMEZONES } from "~/types/timezone";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { EventsTable } from "./events-table";
import { useSettings } from "~/contexts/settings-context";
import { formatInTimeZone } from 'date-fns-tz';
import { toGMTTime, fromGMTTime, formatDateTime } from '~/utils/time';
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { Checkbox } from "~/components/ui/checkbox";

interface Dataset {
  id: string;
  datasetName: string;
  primaryDataTerm: string;
  productTypes: string;
  sla: string | null;
  lastArrivalTime: string | null;
  updatedAt: string | null;
}

interface InterfaceDatasetsProps {
  datasets: Dataset[];
  isLoading: boolean;
}

interface EventsTableProps {
  events: Event[];
  onBack: () => void;
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSync?: () => void;
  isSyncing: boolean;
  datasetId: string;
}

type RAGStatus = 'G' | 'A' | 'R';

interface RAGColorMap {
  [key: string]: string;
  G: string;
  A: string;
  R: string;
}

const RAG_COLORS: RAGColorMap = {
  'G': 'bg-green-500',
  'A': 'bg-amber-500',
  'R': 'bg-red-500'
} as const;

const RAG_TEXT_COLORS: RAGColorMap = {
  'G': 'text-green-600',
  'A': 'text-amber-600',
  'R': 'text-red-600'
} as const;

function calculateRAGStatus(lastArrivalTime: string | null, sla: string | null): RAGStatus {
  if (!lastArrivalTime || !sla) return "R";
  
  try {
    const [slaHours, slaMinutes] = sla.split(":").map(Number);
    if (isNaN(slaHours) || isNaN(slaMinutes)) {
      console.error('Invalid SLA format:', sla);
      return "R";
    }

    const slaDate = new Date();
    slaDate.setUTCHours(slaHours, slaMinutes, 0, 0);

    const cleanLastArrival = lastArrivalTime.replace('UTC', '').trim();
    const lastArrival = new Date(cleanLastArrival);

    if (isNaN(lastArrival.getTime())) {
      console.warn('Invalid last arrival date:', lastArrivalTime);
      return "R";
    }

    const timeDiff = slaDate.getTime() - lastArrival.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff >= 0 && hoursDiff <= 24) return "G";
    if (hoursDiff >= -1 && hoursDiff < 0) return "A";
    return "R";
  } catch (error) {
    console.error('Error calculating RAG status:', error);
    return "R";
  }
}

function getRAGColor(status: RAGStatus): string {
  return RAG_COLORS[status] || 'bg-gray-500';
}

function getRAGTextColor(status: RAGStatus): string {
  return RAG_TEXT_COLORS[status] || 'text-gray-600';
}

const ITEMS_PER_PAGE = 10;
const EVENT_PAGE_SIZE = 10;

export function InterfaceDatasets({ datasets: initialDatasets, isLoading }: InterfaceDatasetsProps) {
  const { preferredTimezone } = useSettings();
  const tzName = CITY_TIMEZONES[preferredTimezone];
  
  const [datasets, setDatasets] = useState<Dataset[]>(() => {
    if (!Array.isArray(initialDatasets)) {
      console.warn('Datasets prop is not an array:', initialDatasets);
      return [];
    }
    
    return initialDatasets.filter((dataset): dataset is Dataset => 
      dataset && 
      typeof dataset === 'object' && 
      'id' in dataset &&
      typeof dataset.id === 'string'
    );
  });

  useEffect(() => {
    if (Array.isArray(initialDatasets)) {
      const validDatasets = initialDatasets.filter((dataset): dataset is Dataset => 
        dataset && 
        typeof dataset === 'object' && 
        'id' in dataset &&
        typeof dataset.id === 'string'
      );
      setDatasets(validDatasets);
    }
  }, [initialDatasets]);

  const [selectedDatasets, setSelectedDatasets] = useState<Set<string>>(new Set());
  const [showSLADialog, setShowSLADialog] = useState(false);
  const [editingSLA, setEditingSLA] = useState("");
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [refreshingDatasets, setRefreshingDatasets] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventPage, setEventPage] = useState(1);
  const [eventTotal, setEventTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const fetcher = useFetcher();

  const totalPages = Math.ceil(datasets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDatasets = datasets.slice(startIndex, endIndex);

  const handleSelectDataset = (datasetId: string) => {
    setSelectedDatasets(prev => {
      const next = new Set(prev);
      if (next.has(datasetId)) {
        next.delete(datasetId);
      } else {
        next.add(datasetId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedDatasets.size === datasets.length) {
      setSelectedDatasets(new Set());
    } else {
      setSelectedDatasets(new Set(datasets.map(d => d.id)));
    }
  };

  const handleBulkSLAUpdate = async (newSLA: string) => {
    if (!newSLA.trim()) {
      toast.error("Please enter a valid SLA time");
      return;
    }

    try {
      const response = await fetcher.submit({
        ids: JSON.stringify(Array.from(selectedDatasets)),
        sla: newSLA,
      }, {
        method: "PUT",
        action: "/api/datasets",
      });

      toast.success("SLA updated for selected datasets");
      setShowSLADialog(false);
      setEditingSLA("");
    } catch (error) {
      toast.error("Failed to update SLA for datasets");
    }
  };

  const handleBulkSync = async () => {
    const selectedIds = Array.from(selectedDatasets);
    setRefreshingDatasets(new Set(selectedIds));
    
    try {
      await Promise.all(
        selectedIds.map(datasetId => handleRefreshEvents(datasetId))
      );
      toast.success("Successfully synced selected datasets");
    } catch (error) {
      toast.error("Failed to sync some datasets");
    } finally {
      setRefreshingDatasets(new Set());
    }
  };

  const handleViewEvents = async (datasetId: string, page = 1) => {
    setIsLoadingEvents(true);
    try {
      const response = await fetch(
        `/api/events?datasetId=${datasetId}&page=${page}&pageSize=${EVENT_PAGE_SIZE}`
      );
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data.data.events);
      setEventTotal(data.data.total);
      setSelectedDataset(datasetId);
      setEventPage(page);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleEventPageChange = (page: number) => {
    if (selectedDataset) {
      handleViewEvents(selectedDataset, page);
    }
  };

  const handleRefreshEvents = async (datasetId: string) => {
    setRefreshingDatasets(prev => new Set([...prev, datasetId]));
    try {
      const response = await fetch(`/api/dlas/events/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ datasetId })
      });
      
      if (!response.ok) throw new Error('Failed to sync events');
      
      const result = await response.json();

      setDatasets(currentDatasets => 
        currentDatasets.map(dataset => 
          dataset.id === datasetId 
            ? {
                ...dataset,
                lastArrivalTime: result.data.lastArrivalTime,
                updatedAt: new Date().toISOString()
              }
            : dataset
        )
      );

      if (selectedDataset === datasetId) {
        await handleViewEvents(datasetId, eventPage);
      }

    } catch (error) {
      console.error('Error syncing events:', error);
    } finally {
      setRefreshingDatasets(prev => {
        const next = new Set(prev);
        next.delete(datasetId);
        return next;
      });
    }
  };

  if (selectedDataset) {
    return (
      <EventsTable
        events={events}
        onBack={() => {
          setSelectedDataset(null);
          setEventPage(1);
          setEventTotal(0);
        }}
        isLoading={isLoadingEvents}
        total={eventTotal}
        page={eventPage}
        pageSize={EVENT_PAGE_SIZE}
        onPageChange={handleEventPageChange}
        onSync={selectedDataset ? () => handleRefreshEvents(selectedDataset) : undefined}
        isSyncing={refreshingDatasets.has(selectedDataset)}
        datasetId={selectedDataset}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white/50 text-card-foreground shadow-sm">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full mb-3" />
          <p className="text-sm text-gray-500">Loading datasets...</p>
        </div>
      </div>
    );
  }

  if (!datasets?.length) {
    return (
      <div className="rounded-lg border bg-white/50 text-card-foreground shadow-sm">
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No datasets associated with this interface.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSLADialog(true)}
            disabled={selectedDatasets.size === 0}
          >
            Edit SLA
          </Button>
          <Button
            variant="outline"
            onClick={handleBulkSync}
            disabled={selectedDatasets.size === 0 || refreshingDatasets.size > 0}
            className="flex items-center gap-2"
          >
            {refreshingDatasets.size > 0 ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Syncing {refreshingDatasets.size} dataset{refreshingDatasets.size !== 1 ? 's' : ''}...
              </>
            ) : (
              'Sync Selected'
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white/50 text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-100/50">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedDatasets.size === datasets.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all datasets"
                />
              </TableHead>
              <TableHead>Dataset Name</TableHead>
              <TableHead>Primary Data Term</TableHead>
              <TableHead>Product Types</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Last Arrival</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentDatasets.map((dataset) => (
              <TableRow key={dataset.id} className="hover:bg-gray-100/50">
                <TableCell>
                  <Checkbox
                    checked={selectedDatasets.has(dataset.id)}
                    onCheckedChange={() => handleSelectDataset(dataset.id)}
                    aria-label={`Select ${dataset.datasetName}`}
                  />
                </TableCell>
                <TableCell>{dataset.datasetName}</TableCell>
                <TableCell>{dataset.primaryDataTerm}</TableCell>
                <TableCell>
                  {Array.isArray(JSON.parse(dataset.productTypes || '[]'))
                    ? JSON.parse(dataset.productTypes || '[]').join(' | ')
                    : dataset.productTypes}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={getRAGTextColor(calculateRAGStatus(
                      dataset.lastArrivalTime,
                      dataset.sla
                    ))}>
                      {fromGMTTime(dataset.sla, tzName) || 'No SLA'}
                    </span>
                    <span className="text-sm text-gray-500">({preferredTimezone})</span>
                  </div>
                </TableCell>
                <TableCell>
                  {dataset.lastArrivalTime && dataset.lastArrivalTime.trim() && 
                    formatDateTime(dataset.lastArrivalTime, preferredTimezone)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div 
                      className={`h-3 w-3 rounded-full ${
                        getRAGColor(calculateRAGStatus(
                          dataset.lastArrivalTime,
                          dataset.sla
                        ))
                      }`} 
                    />
                  </div>
                </TableCell>
                <TableCell>
                  {dataset.updatedAt && dataset.updatedAt.trim() && 
                    formatDateTime(dataset.updatedAt, preferredTimezone)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewEvents(dataset.id)}
                    title="View Events"
                  >
                    <Eye className="h-4 w-4" />
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
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
              title="Previous page"
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
              title="Next page"
              aria-label="Go to next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}

      {/* SLA Edit Dialog */}
      <Dialog.Root open={showSLADialog} onOpenChange={setShowSLADialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg w-[400px]">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Edit SLA Time
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-500">
              Set SLA time for {selectedDatasets.size} selected dataset{selectedDatasets.size !== 1 ? 's' : ''}.
            </Dialog.Description>
            
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="bulk-sla-time-input" className="text-sm font-medium">
                  Set SLA Time ({preferredTimezone})
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="bulk-sla-time-input"
                      type="time"
                      value={editingSLA}
                      onChange={(e) => setEditingSLA(e.target.value)}
                      className="rounded-md border px-2 py-1 border-gray-300"
                      aria-label="SLA time"
                      title="Enter SLA time in 24-hour format"
                    />
                    <div className="text-sm text-gray-500">
                      GMT: {editingSLA ? toGMTTime(editingSLA, tzName) : '--:--'}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 italic mt-1">
                    * Time will be stored in GMT for consistent calculations across all timezones
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSLADialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const gmtTime = toGMTTime(editingSLA, tzName);
                  if (!gmtTime) {
                    toast.error("Please enter a valid SLA time");
                    return;
                  }
                  handleBulkSLAUpdate(gmtTime);
                }}
                disabled={!editingSLA.trim()}
              >
                Save Changes
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
