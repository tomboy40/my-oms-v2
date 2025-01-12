import { json } from "@remix-run/node";
import type { LoaderArgs } from "@remix-run/node";
import { getDatasetsByInterfaceSerial } from "~/models/dataset.server";

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const interfaceSerial = url.searchParams.get("interfaceSerial");

  if (!interfaceSerial) {
    return json({ datasets: [] });
  }

  const datasets = await getDatasetsByInterfaceSerial(interfaceSerial);
  return json({ datasets });
}
