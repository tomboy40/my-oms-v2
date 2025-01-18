import { db } from "~/lib/db";
import { events } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import type { TransformedDLASEvent } from "~/types/dlas";
import { toUTCString } from '~/utils/time';

export async function getEventsByDatasetId(datasetId: string) {
  return db.select()
    .from(events)
    .where(eq(events.datasetId, datasetId))
    .orderBy(events.createdDateTime);
}

export async function updateEvent(msgId: string, updates: Partial<typeof events.$inferSelect>) {
  return db.update(events)
    .set({
      ...updates,
    })
    .where(eq(events.msgId, msgId));
}

export async function getEventsPaginated(
  datasetId: string | undefined,
  limit: number,
  offset: number
) {
  const conditions = [];
  
  if (datasetId) {
    conditions.push(eq(events.datasetId, datasetId));
  }

  const whereClause = conditions.length > 0 ? conditions[0] : undefined;

  const [results, count] = await Promise.all([
    db.select()
      .from(events)
      .where(whereClause)
      .orderBy(events.createdDateTime)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` })
      .from(events)
      .where(whereClause)
      .then(result => Number(result[0].count))
  ]);

  return {
    events: results,
    total: count
  };
}

export async function batchUpsertEvents(dlasEvents: TransformedDLASEvent[]) {
  // Ensure all events have required fields
  const validEvents = dlasEvents.filter(event => 
    event && event.msgId && event.datasetId
  );

  if (validEvents.length === 0) {
    console.warn('No valid events to insert');
    return [];
  }

  return Promise.all(validEvents.map(event => 
    db.insert(events)
      .values({
        msgId: event.msgId,
        businessDate: event.businessDate,
        createdDateTime: event.createdDateTime,
        endNodeId: event.endNodeId,
        endNodeName: event.endNodeName,
        rawJson: event.rawJson,
        startNodeId: event.startNodeId,
        startNodeName: event.startNodeName,
        valid: event.valid,
        datasetId: event.datasetId
      })
      .onConflictDoUpdate({
        target: events.msgId,
        set: {
          businessDate: event.businessDate,
          createdDateTime: event.createdDateTime,
          endNodeId: event.endNodeId,
          endNodeName: event.endNodeName,
          rawJson: event.rawJson,
          startNodeId: event.startNodeId,
          startNodeName: event.startNodeName,
          valid: event.valid,
          datasetId: event.datasetId
        }
      })
  ));
} 