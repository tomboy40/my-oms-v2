import { db } from "~/lib/db";
import { datasets } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { DLASDataset } from "~/types/dlas";
import { createHash } from 'crypto';
import { nowUTC, toUTCString } from '~/utils/time';

function generateDeterministicUUID(interfaceSerial: number, datasetName: string): string {
  // Create a deterministic string by combining interfaceSerial and datasetName
  const input = `${interfaceSerial}:${datasetName}`;
  
  // Generate SHA-256 hash
  const hash = createHash('sha256').update(input).digest('hex');
  
  // Convert first 32 characters of hash into UUID format
  const uuid = [
    hash.slice(0, 8),
    hash.slice(8, 12),
    // Set version 5 UUID (first digit of this group is always 5)
    '5' + hash.slice(13, 16),
    // Set variant (first 2 bits are 10)
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.slice(18, 20),
    hash.slice(20, 32)
  ].join('-');
  
  return uuid;
}

export async function batchUpsertDatasets(
  datasetsToUpsert: DLASDataset[]
) {
  const now = toUTCString(new Date());
  const results = [];

  for (const dataset of datasetsToUpsert) {
    // Format lastArrivalTime if it exists, removing any UTC suffix
    const lastArrivalTime = dataset.LastArrivalTime 
      ? toUTCString(new Date(dataset.LastArrivalTime))
      : null;

    const result = await db.insert(datasets)
      .values({
        id: generateDeterministicUUID(dataset.InterfaceSerial, dataset.DatasetName),
        interfaceSerial: dataset.InterfaceSerial,
        status: dataset.Status,
        datasetStatus: dataset.DatasetStatus,
        datasetName: dataset.DatasetName,
        description: dataset.Description,
        primaryDataTerm: dataset.PrimaryDataTerm?.name ?? null,
        productTypes: Array.isArray(dataset.ProductType) ? JSON.stringify(dataset.ProductType) : JSON.stringify([]),
        relatedDrilldownKey: dataset.RelatedDrilldownKey ? JSON.stringify(dataset.RelatedDrilldownKey) : null,
        lastArrivalTime,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [datasets.interfaceSerial, datasets.datasetName],
        set: {
          status: dataset.Status,
          datasetStatus: dataset.DatasetStatus,
          description: dataset.Description,
          primaryDataTerm: dataset.PrimaryDataTerm?.name ?? null,
          productTypes: Array.isArray(dataset.ProductType) ? JSON.stringify(dataset.ProductType) : JSON.stringify([]),
          relatedDrilldownKey: dataset.RelatedDrilldownKey ? JSON.stringify(dataset.RelatedDrilldownKey) : null,
          lastArrivalTime,
          updatedAt: now,
        }
      });
    
    results.push(result);
  }

  return results;
}

export async function findDatasetsByInterfaceSerial(interfaceSerial: number) {
  return db.select()
    .from(datasets)
    .where(eq(datasets.interfaceSerial, interfaceSerial));
}

export async function deleteDatasetsByInterfaceSerial(interfaceSerial: number) {
  return db.delete(datasets)
    .where(eq(datasets.interfaceSerial, interfaceSerial));
}

export async function getDatasetsByInterfaceSerial(interfaceSerial: number) {
  return db.select()
    .from(datasets)
    .where(eq(datasets.interfaceSerial, interfaceSerial))
    .orderBy(datasets.datasetName);
}

export async function updateDataset(id: string, updates: Partial<typeof datasets.$inferSelect>) {
  return db.update(datasets)
    .set({
      ...updates,
      updatedAt: toUTCString(new Date()),
    })
    .where(eq(datasets.id, id));
}

export async function getDatasetById(id: string) {
  return db.select()
    .from(datasets)
    .where(eq(datasets.id, id))
    .limit(1)
    .then(results => results[0] || null);
}

export async function updateDatasetSLA(id: string, sla: string) {
  return db
    .update(datasets)
    .set({ 
      sla,
      updatedAt: toUTCString(new Date())
    })
    .where(eq(datasets.id, id));
}
