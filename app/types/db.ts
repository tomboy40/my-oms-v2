import { interfaces, itServices } from '../../drizzle/schema';

// Interface types
export type InterfaceStatus = 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
export type InterfacePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Interface = typeof interfaces.$inferSelect;
export type InterfaceCreate = Omit<Interface, 'id' | 'createdAt' | 'updatedAt'>;
export type InterfaceUpdate = Partial<InterfaceCreate>;

// ITService types
export type ITServiceStatus = 'ACTIVE' | 'INACTIVE';
export type ITServiceCriticality = 'Tier 0' | 'Tier 1' | 'Tier 2' | 'Tier 3';
export type ITServiceEnvironment = 'DEV' | 'TEST' | 'PROD';

export type ITService = typeof itServices.$inferSelect;
export type ITServiceCreate = Omit<ITService, 'id' | 'createdAt' | 'updatedAt'>;
export type ITServiceUpdate = Partial<ITServiceCreate>;