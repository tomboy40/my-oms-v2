import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Interface table schema
export const interfaces = sqliteTable('Interface', {
  id: text('id').primaryKey(), // SHA-256 hash of key fields
  
  // DLAS Fields
  status: text('status').notNull(),
  direction: text('direction').notNull(),
  eimInterfaceId: text('eimInterfaceId'),
  interfaceName: text('interfaceName'),
  sendAppId: text('sendAppId').notNull(),
  sendAppName: text('sendAppName').notNull(),
  receivedAppId: text('receivedAppId').notNull(),
  receivedAppName: text('receivedAppName').notNull(),
  transferType: text('transferType').notNull(),
  frequency: text('frequency').notNull(),
  technology: text('technology').notNull(),
  pattern: text('pattern').notNull(),
  demiseDate: text('demiseDate'), // Date in YYYY-MM-DD format or NULL
  
  // Local Fields
  interfaceStatus: text('interfaceStatus').notNull().default('ACTIVE'),
  priority: text('priority').notNull().default('LOW'),
  remarks: text('remarks'),
  
  // Reference to Dataset's interfaceSerial (without foreign key constraint)
  relatedDrilldownKey: integer('relatedDrilldownKey'),
  
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
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Dataset table schema
export const datasets = sqliteTable('Dataset', {
  id: text('id').primaryKey(), // UUID
  interfaceSerial: integer('interfaceSerial').notNull(), // Maps to DLAS InterfaceSerial
  
  // Dataset Fields
  status: text('status').notNull(), // e.g., "COLLIBRA UPDATED"
  datasetStatus: text('datasetStatus').notNull(), // e.g., "NORMAL"
  datasetName: text('datasetName').notNull(), // e.g., "C_239906_120454303_000_FO_Notional_YYYYMMDD.csv"
  description: text('description'), // e.g., "UK Trade Data For Ccr Rwa Calculation"
  primaryDataTerm: text('primaryDataTerm'), // e.g., "Trade Data"
  productTypes: text('productTypes'), // JSON array of strings, e.g., ["credit"]
  relatedDrilldownKey: text('relatedDrilldownKey'), // JSON array of UUIDs
  sla: text('sla'), // Format: HH:mm in GMT
  slaTimezone: text('slaTimezone').default('Europe/London').notNull(), // Default to London time
  lastArrivalTime: text('lastArrivalTime'), // Format: YYYY-MM-DDThh:mm:ss.sss
  
  // Audit Fields
  createdAt: text('createdAt').notNull(), // Format: YYYY-MM-DDThh:mm:ss.sss
  updatedAt: text('updatedAt').notNull(), // Format: YYYY-MM-DDThh:mm:ss.sss
  createdBy: text('createdBy'),
  updatedBy: text('updatedBy'),
}, (table) => {
  return {
    interfaceDatasetIdx: uniqueIndex('interface_dataset_idx').on(table.interfaceSerial, table.datasetName),
  };
});

// Event table schema
export const events = sqliteTable('Event', {
  msgId: text('msgId').primaryKey(),
  businessDate: text('businessDate'), // Format: YYYY-MM-DD
  createdDateTime: text('createdDateTime'), // Format: YYYY-MM-DDThh:mm:ss.sss
  endNodeId: text('endNodeId'),
  endNodeName: text('endNodeName'),
  rawJson: text('rawJson'),
  startNodeId: text('startNodeId'),
  startNodeName: text('startNodeName'),
  valid: text('valid'),
  datasetId: text('datasetId'), // Reference to Dataset table's id
});
