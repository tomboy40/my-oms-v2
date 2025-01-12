import { z } from "zod";

// Dataset status enum
export enum DatasetStatus {
  NORMAL = "NORMAL",
  INACTIVE = "INACTIVE",
  ERROR = "ERROR",
}

// Dataset schema for validation
export const DatasetSchema = z.object({
  id: z.string().uuid(),
  interfaceSerial: z.number().int(),
  status: z.string(),
  datasetStatus: z.nativeEnum(DatasetStatus),
  datasetName: z.string(),
  description: z.string().nullable(),
  primaryDataTerm: z.object({
    name: z.string()
  }).nullable(),
  productTypes: z.array(z.string()).default([]),
  relatedDrilldownKey: z.array(z.string().uuid()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
});

// DLAS Dataset response schema
export const DLASDatasetSchema = z.object({
  Status: z.string(),
  DatasetStatus: z.string(),
  DatasetName: z.string(),
  Description: z.string().nullable(),
  InterfaceSerial: z.number(),
  PrimaryDataTerm: z.object({
    name: z.string()
  }).optional(),
  ProductType: z.array(z.string()).optional(),
  RelatedDrilldownKey: z.array(z.string().uuid()).nullable()
});

// Transform schema for converting DLAS dataset to our format
export const DLASDatasetTransformSchema = DLASDatasetSchema.transform((dataset) => ({
  id: crypto.randomUUID(), // Generate UUID for new datasets
  interfaceSerial: dataset.InterfaceSerial,
  status: dataset.Status,
  datasetStatus: dataset.DatasetStatus as DatasetStatus,
  datasetName: dataset.DatasetName,
  description: dataset.Description,
  primaryDataTerm: dataset.PrimaryDataTerm?.name,
  productTypes: dataset.ProductType ?? [],
  relatedDrilldownKey: dataset.RelatedDrilldownKey,
  createdAt: new Date(),
  updatedAt: new Date()
}));

// Export types
export type Dataset = z.infer<typeof DatasetSchema>;
export type DLASDataset = z.infer<typeof DLASDatasetSchema>;
export type TransformedDLASDataset = z.infer<typeof DLASDatasetTransformSchema>;
