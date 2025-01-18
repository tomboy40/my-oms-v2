import { z } from "zod";

// Define enums for valid values
export enum EventValidStatus {
  YES = "Y",
  NO = "N",
  PENDING = "P"
}

// Main Event schema
export const EventSchema = z.object({
  msgId: z.string().uuid(),
  businessDate: z.string(), // Format: YYYY-MM-DD
  createdDateTime: z.string(), // Format: YYYY-MM-DDThh:mm:ss.sss (stored without UTC suffix)
  endNodeId: z.string(),
  endNodeName: z.string(),
  rawJson: z.string(),
  startNodeId: z.string(),
  startNodeName: z.string(),
  valid: z.nativeEnum(EventValidStatus).optional(),
  datasetId: z.string().uuid()
});

// Transform schema for converting raw event data to our format
export const EventTransformSchema = EventSchema.transform((event) => ({
  ...event,
  // Remove UTC suffix if present
  createdDateTime: event.createdDateTime.replace('UTC', '').trim(),
  valid: event.valid || EventValidStatus.PENDING,
}));

// Export type
export type Event = z.infer<typeof EventSchema>; 