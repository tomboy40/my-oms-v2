import { db } from './db.server';

export async function initializeDatabase() {
  try {
    // Test database connection
    await db.$connect();
    console.log('✅ Database connection successful');

    // Perform any necessary seeding or initialization here
    const interfaceCount = await db.interface.count();
    const itServiceCount = await db.iTService.count();

    console.log(`📊 Current database stats:
    - Interfaces: ${interfaceCount}
    - IT Services: ${itServiceCount}
    `);

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  } finally {
    await db.$disconnect();
  }
} 