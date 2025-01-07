import { PrismaClient } from '@prisma/client';
import { db } from '../app/lib/db';
import { posts, interfaces, itServices } from '../drizzle/schema';

async function main() {
  const prisma = new PrismaClient();

  try {
    // Migrate Posts
    const prismaPost = await prisma.post.findMany();
    for (const post of prismaPost) {
      await db.insert(posts).values({
        id: post.id,
        name: post.name,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      });
    }
    console.log('✅ Posts migrated successfully');

    // Migrate Interfaces
    const prismaInterfaces = await prisma.interface.findMany();
    for (const interface_ of prismaInterfaces) {
      await db.insert(interfaces).values({
        id: interface_.id,
        status: interface_.status,
        direction: interface_.direction,
        eimInterfaceId: interface_.eimInterfaceId,
        interfaceName: interface_.interfaceName,
        sendAppId: interface_.sendAppId,
        sendAppName: interface_.sendAppName,
        receivedAppId: interface_.receivedAppId,
        receivedAppName: interface_.receivedAppName,
        transferType: interface_.transferType,
        frequency: interface_.frequency,
        technology: interface_.technology,
        pattern: interface_.pattern,
        interfaceStatus: interface_.interfaceStatus,
        sla: interface_.sla,
        priority: interface_.priority,
        remarks: interface_.remarks,
        createdAt: interface_.createdAt,
        updatedAt: interface_.updatedAt,
        createdBy: interface_.createdBy,
        updatedBy: interface_.updatedBy,
      });
    }
    console.log('✅ Interfaces migrated successfully');

    // Migrate ITServices
    const prismaITServices = await prisma.iTService.findMany();
    for (const service of prismaITServices) {
      await db.insert(itServices).values({
        appInstanceId: service.appInstanceId,
        serviceName: service.serviceName,
        pladaServiceId: service.pladaServiceId,
        itServiceOwner: service.itServiceOwner,
        itServiceOwnerId: service.itServiceOwnerId,
        itServiceOwnerEmail: service.itServiceOwnerEmail,
        itServiceOwnerDelegate: service.itServiceOwnerDelegate,
        itServiceOwnerDelegateId: service.itServiceOwnerDelegateId,
        itServiceOwnerDelegateEmail: service.itServiceOwnerDelegateEmail,
        appInstanceName: service.appInstanceName,
        appDescription: service.appDescription,
        appCriticality: service.appCriticality,
        environment: service.environment,
        appInstStatus: service.appInstStatus,
        serviceItOrg6: service.serviceItOrg6,
        serviceItOrg7: service.serviceItOrg7,
        serviceItOrg8: service.serviceItOrg8,
        serviceItOrg9: service.serviceItOrg9,
        supportGroup: service.supportGroup,
        status: service.status,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      });
    }
    console.log('✅ ITServices migrated successfully');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
