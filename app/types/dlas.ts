import { z } from "zod";

// Zod schema for environment variables
export const envSchema = z.object({
  DLAS_API_URL: z.string().url('DLAS API URL must be a valid URL'),
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
  EIMInterfaceName: z.string().optional()
});

export const DLASResponseSchema = z.object({
  appid: z.string(),
  dataDate: z.string(),
  interface: z.object({
    interface_dlas_logged: z.array(DLASInterfaceSchema),
    interface_only_in_eim: z.array(DLASInterfaceSchema)
  })
});

// Transform schema for converting DLAS interface to our interface format
export const DLASInterfaceTransformSchema = DLASInterfaceSchema.transform((iface) => ({
  eimInterfaceId: iface.EIMInterfaceID,
  interfaceName: iface.InterfaceName ?? iface.EIMInterfaceName ?? '',
  direction: iface.Direction,
  sendAppId: iface.SendAppID,
  sendAppName: iface.SendAppName,
  receivedAppId: iface.ReceivedAppID,
  receivedAppName: iface.ReceivedAppName,
  transferType: iface.TransferType,
  frequency: iface.Frequency,
  technology: iface.Technology,
  pattern: iface.Pattern,
  status: iface.Status,
}));

export type DLASInterface = z.infer<typeof DLASInterfaceSchema>;
export type DLASResponse = z.infer<typeof DLASResponseSchema>;
export type TransformedDLASInterface = z.infer<typeof DLASInterfaceTransformSchema>;