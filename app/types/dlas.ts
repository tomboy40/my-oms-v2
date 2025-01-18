import { z } from "zod";
import { createHash } from 'crypto';

// Zod schema for environment variables
export const envSchema = z.object({
  DLAS_API_URL: z.string().url('DLAS API URL must be a valid URL'),
  DLAS_EVT_URL: z.string().url('DLAS Events API URL must be a valid URL'),
});

// Schema for dataset in DLAS response
export const DLASDatasetSchema = z.object({
  Status: z.string(),
  Direction: z.string(),
  DatasetStatus: z.string(),
  DatasetName: z.string(),
  Description: z.string().nullable(),
  InterfaceSerial: z.number(),
  PrimaryDataTerm: z.object({
    name: z.string()
  }),
  ProductType: z.array(z.string()),
  RelatedDrilldownKey: z.array(z.union([z.string(), z.number()])).nullable()
});

// Zod schema for DLAS API response
export const DLASInterfaceSchema = z.object({
  Status: z.string(),
  Direction: z.enum(["IN", "OUT"]),
  EIMInterfaceID: z.string().nullable(),
  SendAppID: z.string(),
  SendAppName: z.string(),
  ReceivedAppID: z.string(),
  ReceivedAppName: z.string(),
  TransferType: z.string(),
  Frequency: z.string(),
  Technology: z.string(),
  Pattern: z.string(),
  InterfaceName: z.string().optional(),
  EIMInterfaceName: z.string().optional(),
  DemiseDate: z.string().nullable().optional(),
  EndDate: z.string().nullable().optional(),
  RelatedDrilldownKey: z.number().optional()
});

export const DLASResponseSchema = z.object({
  appid: z.string(),
  dataDate: z.string(),
  interface: z.object({
    interface_dlas_logged: z.array(DLASInterfaceSchema),
    interface_only_in_eim: z.array(DLASInterfaceSchema)
  }),
  dataset: z.object({
    dataset_logged_list: z.array(DLASDatasetSchema)
  })
});

// Transform schema for converting DLAS interface to our interface format
export const DLASInterfaceTransformSchema = DLASInterfaceSchema.transform((iface) => {
  const demiseDate = iface.DemiseDate || iface.EndDate;
  const isInactive = demiseDate ? new Date(demiseDate) <= new Date() : false;
  const interfaceName = iface.InterfaceName ?? iface.EIMInterfaceName ?? '';

  // Determine interface status:
  // 1. If demiseDate exists and has passed, set to INACTIVE
  // 2. If demiseDate exists but hasn't passed yet, keep ACTIVE
  // 3. If no demiseDate, keep ACTIVE
  const interfaceStatus = isInactive ? 'INACTIVE' : 'ACTIVE';

  return {
    status: iface.Status,
    direction: iface.Direction,
    eimInterfaceId: iface.EIMInterfaceID,
    interfaceName,
    sendAppId: iface.SendAppID,
    sendAppName: iface.SendAppName,
    receivedAppId: iface.ReceivedAppID,
    receivedAppName: iface.ReceivedAppName,
    transferType: iface.TransferType,
    frequency: iface.Frequency,
    technology: iface.Technology ?? '',
    pattern: iface.Pattern ?? '',
    demiseDate: demiseDate ?? null,
    relatedDrilldownKey: iface.RelatedDrilldownKey ? Number(iface.RelatedDrilldownKey) : null,
    interfaceStatus,
  };
});

// Schema for DLAS event response
export const DLASEventSchema = z.object({
  msgId: z.string().uuid(),
  businessDate: z.string(),
  createdDateTime: z.string(),
  endNodeId: z.string(),
  endNodeName: z.string(),
  rawJson: z.unknown().transform(json => JSON.stringify(json)), // Accept any JSON object and convert to string
  startNodeId: z.string(),
  startNodeName: z.string(),
  valid: z.string().optional()
});

// Transform schema for converting DLAS event to our format
export const DLASEventTransformSchema = DLASEventSchema.transform((event) => ({
  msgId: event.msgId,
  businessDate: event.businessDate,
  createdDateTime: event.createdDateTime.replace('UTC', '').trim(),
  endNodeId: event.endNodeId,
  endNodeName: event.endNodeName,
  rawJson: event.rawJson,
  startNodeId: event.startNodeId,
  startNodeName: event.startNodeName,
  valid: event.valid || 'P'
}));

// Export types
export type DLASInterface = z.infer<typeof DLASInterfaceSchema>;
export type DLASResponse = z.infer<typeof DLASResponseSchema>;
export type TransformedDLASInterface = z.infer<typeof DLASInterfaceTransformSchema>;

// Export new event type
export type DLASEvent = z.infer<typeof DLASEventSchema>;
export type TransformedDLASEvent = z.infer<typeof DLASEventTransformSchema>;