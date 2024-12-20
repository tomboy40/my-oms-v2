import type { ITService } from "@prisma/client";
import { prisma } from "~/utils/db.server";
import { ServiceStatus } from "~/types/services";

export async function getITService(appInstanceId: string) {
  return prisma.iTService.findUnique({
    where: { appInstanceId },
    select: { 
      appInstanceId: true,
      status: true
    }
  });
}

export async function createITService(data: Omit<ITService, "createdAt" | "updatedAt">) {
  const now = new Date();
  return prisma.iTService.create({
    data: {
      ...data,
      status: ServiceStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    },
  });
}

export async function updateITService(appInstanceId: string, data: Partial<Omit<ITService, "appInstanceId" | "createdAt" | "updatedAt">>) {
  return prisma.iTService.update({
    where: { appInstanceId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export type { ITService }; 