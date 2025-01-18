import { json } from "@remix-run/node";
import type { LoaderArgs, ActionFunctionArgs } from "@remix-run/node";
import { getDatasetsByInterfaceSerial, updateDataset } from "~/models/dataset.server";
import { z } from "zod";

const UpdateSchema = z.object({
  ids: z.string().transform((str) => {
    try {
      const parsed = JSON.parse(str);
      return z.array(z.string().uuid()).parse(parsed);
    } catch {
      throw new Error('Invalid dataset IDs');
    }
  }),
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
        ids: formData.get("ids"),
        sla: formData.get("sla"),
      };
    }

    // Validate the data
    const validatedData = UpdateSchema.parse(data);

    // Update all datasets in parallel
    await Promise.all(
      validatedData.ids.map(id => 
        updateDataset(id, { sla: validatedData.sla })
      )
    );

    return json({ success: true });
  } catch (error) {
    console.error('Error updating datasets:', error);
    return json({ error: 'Failed to update datasets' }, { status: 500 });
  }
}
