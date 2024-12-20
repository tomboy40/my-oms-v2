import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Get database stats
    const interfaceCount = await prisma.interface.count();
    const itServiceCount = await prisma.iTService.count();
    const postCount = await prisma.post.count();

    console.log(`
📊 Database Statistics:
- Interfaces: ${interfaceCount}
- IT Services: ${itServiceCount}
- Posts: ${postCount}
    `);

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(async (success) => {
    if (success) {
      console.log('✨ Database initialization complete');
    } else {
      console.error('❌ Database initialization failed');
      process.exit(1);
    }
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 