import { json } from "@remix-run/node";
import type { LoaderArgs, ActionFunctionArgs } from "@remix-run/node";
import { getDatasetsByInterfaceSerial, updateDataset } from "~/models/dataset.server";
import { z } from "zod";

const UpdateSchema = z.object({
  id: z.string().uuid(),
  sla: z.string().nullable(),
});

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const interfaceSerial = url.searchParams.get("interfaceSerial");

  if (!interfaceSerial) {
    return json({ datasets: [] });
  }

  const datasets = await getDatasetsByInterfaceSerial(interfaceSerial);
  return json({ datasets });
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    if (request.method !== 'PUT') {
      return json({ error: 'Method not allowed' }, { status: 405 });
    }

    let data;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      data = {
        id: formData.get("id"),
        sla: formData.get("sla"),
      };
    }

    // Validate the data
    const validatedData = UpdateSchema.parse(data);

    // Update the dataset
    await updateDataset(validatedData.id, {
      sla: validatedData.sla,
    });

    return json({ success: true });
  } catch (error) {
    console.error('Error updating dataset:', error);
    return json({ error: 'Failed to update dataset' }, { status: 500 });
  }
}
