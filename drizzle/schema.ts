import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Post table schema
export const posts = sqliteTable('Post', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Interface table schema
export const interfaces = sqliteTable('Interface', {
  id: text('id').primaryKey(), // SHA-256 hash of key fields
  
  // DLAS Fields
  status: text('status').notNull(),
  direction: text('direction'),
  eimInterfaceId: text('eimInterfaceId'),
  interfaceName: text('interfaceName'),
  sendAppId: text('sendAppId'),
  sendAppName: text('sendAppName'),
  receivedAppId: text('receivedAppId'),
  receivedAppName: text('receivedAppName'),
  transferType: text('transferType'),
  frequency: text('frequency'),
  technology: text('technology'),
  pattern: text('pattern'),
  
  // Local Fields
  interfaceStatus: text('interfaceStatus').notNull().default('ACTIVE'),
  sla: text('sla'),
  priority: text('priority').notNull().default('LOW'),
  remarks: text('remarks'),
  
  // Audit Fields
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdBy: text('createdBy'),
  updatedBy: text('updatedBy'),
});

// ITService table schema
export const itServices = sqliteTable('ITService', {
  appInstanceId: text('appInstanceId').primaryKey(),
  serviceName: text('serviceName').notNull(),
  pladaServiceId: text('pladaServiceId'),
  itServiceOwner: text('itServiceOwner'),
  itServiceOwnerId: text('itServiceOwnerId'),
  itServiceOwnerEmail: text('itServiceOwnerEmail'),
  itServiceOwnerDelegate: text('itServiceOwnerDelegate'),
  itServiceOwnerDelegateId: text('itServiceOwnerDelegateId'),
  itServiceOwnerDelegateEmail: text('itServiceOwnerDelegateEmail'),
  appInstanceName: text('appInstanceName').notNull(),
  appDescription: text('appDescription'),
  appCriticality: text('appCriticality'),
  environment: text('environment'),
  appInstStatus: text('appInstStatus'),
  serviceItOrg6: text('serviceItOrg6'),
  serviceItOrg7: text('serviceItOrg7'),
  serviceItOrg8: text('serviceItOrg8'),
  serviceItOrg9: text('serviceItOrg9'),
  supportGroup: text('supportGroup'),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
