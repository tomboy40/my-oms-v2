import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { DLASService } from "~/services/dlas.server";
import { z } from "zod";
import { handleError } from '~/utils/validation.server';
import { successResponse } from '~/utils/api.server';
import { batchUpsertEvents } from "~/models/event.server";
import { getDatasetById, updateDataset } from "~/models/dataset.server";
import { DLASEventTransformSchema } from "~/types/dlas";
import type { TransformedDLASEvent } from "~/types/dlas";

// Validation schema for request body
const SyncParamsSchema = z.object({
  datasetId: z.string().uuid()
});

// Helper function to find latest event
function findLatestEvent(events: TransformedDLASEvent[]): TransformedDLASEvent | null {
  if (events.length === 0) return null;
  
  return events.reduce((latest, current) => {
    const currentDate = new Date(current.createdDateTime);
    const latestDate = new Date(latest.createdDateTime);
    return currentDate > latestDate ? current : latest;
  });
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }

    // Parse and validate request body
    const data = await request.json();
    const validation = SyncParamsSchema.safeParse(data);
    
    if (!validation.success) {
      return json({ 
        error: "Invalid request data",
        details: validation.error.format() 
      }, { status: 400 });
    }

    // Get dataset and its relatedDrilldownKeys
    const dataset = await getDatasetById(validation.data.datasetId);
    
    if (!dataset) {
      return json({ error: "Dataset not found" }, { status: 404 });
    }

    // Parse relatedDrilldownKeys from dataset and ensure they're strings
    const relatedDrilldownKeys = dataset.relatedDrilldownKey 
      ? JSON.parse(dataset.relatedDrilldownKey).map(String)
      : [];

    if (!relatedDrilldownKeys.length) {
      return json({ 
        error: "No RelatedDrilldownKeys found for this dataset",
        count: 0,
        events: [] 
      });
    }

    // Fetch events from DLAS
    const dlasEvents = await DLASService.fetchEvents(relatedDrilldownKeys);

    if (!dlasEvents) {
      return json({ error: "Failed to fetch events from DLAS" }, { status: 500 });
    }

    // Transform DLAS events to our format and add datasetId
    const eventsToUpsert = dlasEvents.map(event => ({
      ...DLASEventTransformSchema.parse(event),
      datasetId: validation.data.datasetId
    }));

    // Batch upsert events to database
    const results = await batchUpsertEvents(eventsToUpsert);

    // Find latest event and update dataset if events exist
    const latestEvent = findLatestEvent(eventsToUpsert);
    if (latestEvent) {
      await updateDataset(validation.data.datasetId, {
        lastArrivalTime: latestEvent.createdDateTime
      });
    }

    return successResponse({
      success: true,
      events: results,
      count: results.length,
      lastArrivalTime: latestEvent?.createdDateTime ?? null
    });

  } catch (error) {
    console.error("Error in DLAS events sync:", error);
    return handleError(error);
  }
} 