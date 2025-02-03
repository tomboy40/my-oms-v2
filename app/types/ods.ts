import { z } from 'zod';

// Zod schema for environment variables
export const envSchema = z.object({
  ODS_API_URL: z.string().url('ODS API URL must be a valid URL'),
});

// Schema for a single ODS service
export const ODSServiceSchema = z.object({
  appInstanceId: z.string(),
  serviceName: z.string(),
  pladaServiceId: z.string().optional(),
  itServiceOwner: z.string().optional(),
  itServiceOwnerId: z.string().optional(),
  itServiceOwnerEmail: z.string().optional(),
  itServiceOwnerDelegate: z.string().optional(),
  itServiceOwnerDelegateId: z.string().optional(),
  itServiceOwnerDelegateEmail: z.string().optional(),
  appInstanceName: z.string(),
  appDescription: z.string().optional(),
  appCriticality: z.string().optional(),
  environment: z.string().optional(),
  appInstStatus: z.string().optional(),
  serviceItOrg6: z.string().optional(),
  serviceItOrg7: z.string().optional(),
  serviceItOrg8: z.string().optional(),
  serviceItOrg9: z.string().optional(),
  supportGroup: z.string().optional(),
});

// Zod schema for ODS API response
export const ODSResponseSchema = z.object({
  offset: z.number(),
  limit: z.number(),
  totalElements: z.number(),
  results: z.array(ODSServiceSchema),
});

// TypeScript types
export type ODSService = z.infer<typeof ODSServiceSchema>;
export type ODSResponse = z.infer<typeof ODSResponseSchema>;
