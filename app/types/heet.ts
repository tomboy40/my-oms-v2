import { z } from 'zod';

/**
 * Environment schema for HEET API configuration
 */
export const envSchema = z.object({
  HEET_API_URL: z.string().url('HEET API URL must be a valid URL'),
});

/**
 * Schema for a single HEET organization entry
 */
export const HEETOrgSchema = z.object({
  level1: z.string(),
  level1Id: z.string(),
  level2: z.string(),
  level2Id: z.string(),
  level3: z.string(),
  level3Id: z.string(),
  level4: z.string(),
  level4Id: z.string(),
  name: z.string(),
  id: z.string(),
  level: z.number().int().min(1).max(6),
});

/**
 * Schema for HEET API response
 * The response is an array of organization entries
 */
export const HEETOrgResponseSchema = z.array(HEETOrgSchema);

/**
 * Transform schema for converting HEET org data to dropdown format
 */
export const HEETOrgTransformSchema = HEETOrgSchema.transform((org) => ({
  label: org.name,
  value: org.id,
  level: org.level,
  parentId: org.level4Id, // For level 5 orgs, their parent is level4
  parentName: org.level4, // Store parent name for filtering
}));

// Export TypeScript types
export type HEETOrg = z.infer<typeof HEETOrgSchema>;
export type HEETOrgResponse = z.infer<typeof HEETOrgResponseSchema>;
export type TransformedHEETOrg = z.infer<typeof HEETOrgTransformSchema>;

/**
 * Type for organization levels used in the application
 */
export type OrgLevel = 4 | 5;

/**
 * Interface for dropdown option format
 */
export interface OrgDropdownOption {
  label: string;
  value: string;
  level: number;
  parentId?: string;
  parentName?: string;
} 