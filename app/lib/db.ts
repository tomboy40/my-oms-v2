import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../../drizzle/schema';

const dbUrl = process.env.DATABASE_URL || 'file:./drizzle/dev.db';

// Initialize SQLite database
const client = createClient({ 
  url: dbUrl.startsWith('file:') ? dbUrl : `file:${dbUrl}`
});

// Initialize Drizzle with the schema
export const db = drizzle(client, { schema });

// Export schema for type inference
export * from '../../drizzle/schema';
