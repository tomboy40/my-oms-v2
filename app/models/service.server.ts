import { db } from "~/lib/db";
import { itServices } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ServiceStatus } from "~/types/services";

export async function getITService(appInstanceId: string) {
  return db.select({
    appInstanceId: itServices.appInstanceId,
    appInstanceStatus: itServices.appInstStatus,
  })
  .from(itServices)
  .where(eq(itServices.appInstanceId, appInstanceId))
  .limit(1)
  .then(results => results[0] || null);
}

export async function createITService(
  data: Omit<typeof itServices.$inferInsert, "createdAt" | "updatedAt">
) {
  const now = new Date();
  return db.insert(itServices)
    .values({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
}

export async function updateITService(
  appInstanceId: string, 
  data: Partial<Omit<typeof itServices.$inferInsert, "appInstanceId" | "createdAt" | "updatedAt">>
) {
  return db.update(itServices)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(itServices.appInstanceId, appInstanceId));
}

// Export the itServices type from the schema
export type { itServices };