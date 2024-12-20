import type { Interface } from "@prisma/client";
import { prisma } from "~/utils/db.server";
import { InterfaceStatus, Priority } from "~/types/interfaces";

export async function findInterfacesByAppId(appId: string) {
  return prisma.interface.findMany({
    where: {
      OR: [
        { sendAppId: appId },
        { receivedAppId: appId }
      ]
    },
    select: { 
      id: true,
      sla: true,
      priority: true,
      remarks: true
    }
  });
}

export async function batchUpdateInactiveInterfaces(interfaceIds: string[]) {
  return prisma.interface.updateMany({
    where: { id: { in: interfaceIds } },
    data: {
      interfaceStatus: InterfaceStatus.INACTIVE,
      updatedAt: new Date()
    }
  });
}

export async function batchUpsertInterfaces(interfaces: Array<Omit<Interface, "createdAt" | "updatedAt">>) {
  const now = new Date();
  return prisma.$transaction(
    interfaces.map((iface) =>
      prisma.interface.upsert({
        where: { id: iface.id },
        create: {
          ...iface,
          sla: 'TBD',
          priority: Priority.LOW,
          interfaceStatus: InterfaceStatus.ACTIVE,
          remarks: null,
          createdAt: now,
          updatedAt: now,
        },
        update: {
          ...iface,
          // Preserve existing application-specific fields
          sla: undefined,
          priority: undefined,
          interfaceStatus: undefined,
          remarks: undefined,
          updatedAt: now,
        }
      })
    )
  );
}

export type { Interface }; 