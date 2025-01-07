import { db } from "~/lib/db";
import { interfaces } from "../../drizzle/schema";
import { eq, or } from "drizzle-orm";
import { InterfaceStatus, Priority } from "~/types/interfaces";
import { sql } from "drizzle-orm";

export async function findInterfacesByAppId(appId: string) {
  return db.select({
    id: interfaces.id,
    sla: interfaces.sla,
    priority: interfaces.priority,
    remarks: interfaces.remarks
  })
  .from(interfaces)
  .where(
    or(
      eq(interfaces.sendAppId, appId),
      eq(interfaces.receivedAppId, appId)
    )
  );
}

export async function batchUpdateInactiveInterfaces(interfaceIds: string[]) {
  return db.update(interfaces)
    .set({
      interfaceStatus: InterfaceStatus.INACTIVE,
      updatedAt: new Date()
    })
    .where(
      sql`${interfaces.id} IN ${interfaceIds}`
    );
}

export async function batchUpsertInterfaces(
  interfacesToUpsert: Array<Omit<typeof interfaces.$inferInsert, "createdAt" | "updatedAt">>
) {
  const now = new Date();
  
  // SQLite doesn't support upsert with multiple values, so we need to do them one by one
  const results = [];
  
  for (const iface of interfacesToUpsert) {
    const result = await db.insert(interfaces)
      .values({
        ...iface,
        sla: 'TBD',
        priority: Priority.LOW,
        interfaceStatus: InterfaceStatus.ACTIVE,
        remarks: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: interfaces.id,
        set: {
          ...iface,
          updatedAt: now,
        },
        // Preserve existing application-specific fields
        where: eq(interfaces.id, iface.id)
      });
      
    results.push(result);
  }
  
  return results;
}

// Export the interfaces type from the schema
export type { interfaces };