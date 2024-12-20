import { z } from "zod";

export enum ServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

// Create a Zod schema that matches the existing ITService type
export const ITServiceSchema = z.object({
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
  status: z.nativeEnum(ServiceStatus).default(ServiceStatus.ACTIVE),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ITService = z.infer<typeof ITServiceSchema>;
