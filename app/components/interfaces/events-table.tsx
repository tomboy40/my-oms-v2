import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import type { Event } from "~/types/events";
import { useSettings } from "~/contexts/settings-context";
import { CITY_TIMEZONES } from "~/types/timezone";
import { formatInTimeZone } from 'date-fns-tz';
import type { CityTimezone } from "~/types/timezone";

interface EventsTableProps {
  events: Event[];
  onBack: () => void;
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
  datasetId?: string;
}

export function EventsTable({ 
  events, 
  onBack, 
  isLoading,
  total,
  page,
  pageSize,
  onPageChange,
  onSync,
  isSyncing = false,
  datasetId
}: EventsTableProps) {
  const { preferredTimezone } = useSettings();
  const tzName = CITY_TIMEZONES[preferredTimezone];
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white/50 text-card-foreground shadow-sm">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full mb-3" />
          <p className="text-sm text-gray-500">Loading events...</p>
        </div>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Datasets
          </Button>
        </div>

        <div className="rounded-lg border bg-white/50 text-card-foreground shadow-sm">
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 mb-4">No events found for this dataset.</p>
            {onSync && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSync}
                disabled={isSyncing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing Events...' : 'Sync Events'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Datasets
        </Button>

        {onSync && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Events'}
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-white/50 text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-100/50">
              <TableHead>Message ID</TableHead>
              <TableHead>Business Date</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.msgId} className="hover:bg-gray-100/50">
                <TableCell>{event.msgId}</TableCell>
                <TableCell>{event.businessDate}</TableCell>
                <TableCell>
                  {formatInTimeZone(
                    new Date(event.createdDateTime), 
                    tzName,
                    'PPpp'
                  )}
                </TableCell>
                <TableCell>{event.startNodeName}</TableCell>
                <TableCell>{event.endNodeName}</TableCell>
                <TableCell>{event.valid}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex w-[100px] items-center justify-start gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
} 