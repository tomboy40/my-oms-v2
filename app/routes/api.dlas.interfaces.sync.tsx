import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { DLASService } from "~/services/dlas.server";
import { findInterfacesByAppId, batchUpdateInactiveInterfaces, batchUpsertInterfaces } from "~/models/interface.server";
import { batchUpsertDatasets } from "~/models/dataset.server";
import type { DLASResponse } from "~/types/dlas";
import { DLASInterfaceTransformSchema } from "~/types/dlas";
import { Priority, InterfaceStatus } from "~/types/interfaces";
import { db } from "~/lib/db";
import { interfaces } from "../../drizzle/schema";
import { eq, or } from "drizzle-orm";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const appId = formData.get("appid");

    if (!appId || typeof appId !== "string") {
      return json({ error: "Application ID is required" }, { status: 400 });
    }

    // Fetch data from DLAS
    const dlasResponse = await DLASService.fetchInterfaces(appId);
    if (!dlasResponse) {
      return json({ error: "Failed to fetch data from DLAS" }, { status: 500 });
    }

    // Get all interfaces from DLAS response
    const dlasInterfaces = [
      ...dlasResponse.interface.interface_dlas_logged,
      ...dlasResponse.interface.interface_only_in_eim,
    ];

    // Get existing interfaces from DB
    const existingInterfaces = await db
      .select()
      .from(interfaces)
      .where(
        or(
          eq(interfaces.sendAppId, appId),
          eq(interfaces.receivedAppId, appId)
        )
      );

    // Create maps for easier lookup
    const dlasInterfaceMap = new Map(
      dlasInterfaces.map(iface => [
        DLASService.generateInterfaceId(iface),
        iface
      ])
    );

    const existingInterfaceMap = new Map(
      existingInterfaces.map(iface => [iface.id, iface])
    );

    // Prepare interfaces for update/insert
    const interfacesToUpsert = await Promise.all(dlasInterfaces.map(async dlasInterface => {
      const id = await DLASService.generateInterfaceId(dlasInterface);
      const existing = existingInterfaceMap.get(id);
      const transformed = DLASInterfaceTransformSchema.parse(dlasInterface);

      // If interface exists, preserve local fields
      if (existing) {
        return {
          ...transformed,
          id,
          priority: existing.priority ?? Priority.LOW,
          remarks: existing.remarks ?? null,
          interfaceStatus: transformed.interfaceStatus ?? existing.interfaceStatus ?? InterfaceStatus.ACTIVE,
          createdAt: existing.createdAt ?? new Date(),
          updatedAt: new Date(),
          createdBy: existing.createdBy ?? null,
          updatedBy: null
        };
      }

      // For new interfaces, use defaults
      return {
        ...transformed,
        id,
        sla: 'TBD',
        priority: Priority.LOW,
        remarks: null,
        interfaceStatus: transformed.interfaceStatus ?? InterfaceStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null
      };
    }));

    // Find interfaces that exist in DB but not in DLAS response
    const interfacesToInactivate = existingInterfaces
      .filter(existing => !dlasInterfaceMap.has(existing.id))
      .map(iface => iface.id);

    // Perform updates
    const results = await Promise.all([
      // Update or insert interfaces from DLAS
      batchUpsertInterfaces(interfacesToUpsert),
      // Inactivate interfaces not in DLAS response
      interfacesToInactivate.length > 0
        ? batchUpdateInactiveInterfaces(interfacesToInactivate)
        : Promise.resolve({ count: 0 }),
    ]);

    // Process datasets if available
    let datasetResults = [];
    if (dlasResponse.dataset?.dataset_logged_list) {
      datasetResults = await batchUpsertDatasets(dlasResponse.dataset.dataset_logged_list);
    }

    return json({
      success: true,
      interfaces: {
        upserted: results[0].length,
        inactivated: interfacesToInactivate.length,
      },
      datasets: datasetResults.length,
    });

  } catch (error) {
    console.error("Error in DLAS sync:", error);
    return json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
}