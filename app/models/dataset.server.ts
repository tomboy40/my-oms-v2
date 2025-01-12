import { db } from "~/lib/db";
import { datasets } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { DLASDataset } from "~/types/dlas";

export async function batchUpsertDatasets(
  datasetsToUpsert: DLASDataset[]
) {
  const now = new Date();
  const results = [];

  for (const dataset of datasetsToUpsert) {
    // Convert arrays to JSON strings for storage
    const result = await db.insert(datasets)
      .values({
        id: crypto.randomUUID(),
        interfaceSerial: dataset.InterfaceSerial,
        status: dataset.Status,
        datasetStatus: dataset.DatasetStatus,
        datasetName: dataset.DatasetName,
        description: dataset.Description,
        primaryDataTerm: dataset.PrimaryDataTerm?.name ?? null,
        productTypes: Array.isArray(dataset.ProductType) ? JSON.stringify(dataset.ProductType) : JSON.stringify([]),
        relatedDrilldownKey: dataset.RelatedDrilldownKey ? JSON.stringify(dataset.RelatedDrilldownKey) : null,
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

export async function getDatasetsByInterfaceSerial(interfaceSerial: string) {
  return db.select()
    .from(datasets)
    .where(eq(datasets.interfaceSerial, interfaceSerial))
    .orderBy(datasets.datasetName, 'asc');
}
