import { db } from "~/lib/db";
import { interfaces } from "../../drizzle/schema";
import { eq, or } from "drizzle-orm";
import { InterfaceStatus, Priority } from "~/types/interfaces";
import { sql } from "drizzle-orm";

export async function findInterfacesByAppId(appId: string) {
  return db.select({
    id: interfaces.id,
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
        id: iface.id,
        status: iface.status,
        direction: iface.direction,
        eimInterfaceId: iface.eimInterfaceId,
        interfaceName: iface.interfaceName ?? iface.eimInterfaceName ?? '',
        sendAppId: iface.sendAppId,
        sendAppName: iface.sendAppName,
        receivedAppId: iface.receivedAppId,
        receivedAppName: iface.receivedAppName,
        transferType: iface.transferType,
        frequency: iface.frequency,
        technology: iface.technology ?? '',
        pattern: iface.pattern ?? '',
        demiseDate: iface.demiseDate ?? iface.endDate ?? null,
        interfaceStatus: iface.interfaceStatus ?? InterfaceStatus.ACTIVE,
        priority: iface.priority ?? Priority.LOW,
        remarks: iface.remarks ?? null,
        relatedDrilldownKey: iface.relatedDrilldownKey ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: interfaces.id,
        set: {
          status: iface.status,
          direction: iface.direction,
          eimInterfaceId: iface.eimInterfaceId,
          interfaceName: iface.interfaceName ?? iface.eimInterfaceName ?? '',
          sendAppId: iface.sendAppId,
          sendAppName: iface.sendAppName,
          receivedAppId: iface.receivedAppId,
          receivedAppName: iface.receivedAppName,
          transferType: iface.transferType,
          frequency: iface.frequency,
          technology: iface.technology ?? '',
          pattern: iface.pattern ?? '',
          demiseDate: iface.demiseDate ?? iface.endDate ?? null,
          interfaceStatus: iface.interfaceStatus ?? InterfaceStatus.ACTIVE,
          relatedDrilldownKey: iface.relatedDrilldownKey ?? null,
          updatedAt: now,
        },
        where: eq(interfaces.id, iface.id)
      });
      
    results.push(result);
  }
  
  return results;
}

// Export the interfaces type from the schema
export type { interfaces };