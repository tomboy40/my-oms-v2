import { z } from "zod";

// Define priority values as const
export const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH"] as const;
export const STATUS_VALUES = ["ACTIVE", "INACTIVE"] as const;

// Define enums first
export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

export enum InterfaceStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  TBC = 'TBC'
}

// Interface schema for API responses
export const interfaceSchema = z.object({
  id: z.string(),
  
  // DLAS Fields
  status: z.string(),
  direction: z.string().optional(),
  eimInterfaceId: z.string().optional(),
  interfaceName: z.string().optional(),
  sendAppId: z.string().optional(),
  sendAppName: z.string().optional(),
  receivedAppId: z.string().optional(),
  receivedAppName: z.string().optional(),
  transferType: z.string().optional(),
  frequency: z.string().optional(),
  technology: z.string().optional(),
  pattern: z.string().optional(),
  
  // Local Fields
  interfaceStatus: z.nativeEnum(InterfaceStatus).default(InterfaceStatus.ACTIVE),
  priority: z.nativeEnum(Priority).default(Priority.LOW),
  remarks: z.string().optional(),
  
  // Audit Fields
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

// Export types
export type Interface = z.infer<typeof interfaceSchema>;