import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { FlowMap } from "~/components/FlowMap";
import { SearchFlow } from "~/components/FlowMap/SearchFlow";
import type { LoaderData } from "~/types/flowMap";
import { handleError } from '~/utils/validation.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get("search");
    const response = await fetch(`${url.origin}/api/flowmap?${searchTerm ? `search=${searchTerm}` : ''}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch flow map data');
    }

    const data = await response.json();
    return json<LoaderData>(data);
  } catch (error) {
    return handleError(error);
  }
}

export default function FlowMapRoute() {
  const { nodes, edges, searchTerm, serviceFound, error } = useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get("search") || "";

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!serviceFound && searchTerm) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            No services were found matching the search term: "{searchTerm}"
          </p>
          <SearchFlow initialSearchTerm={initialSearchTerm} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <SearchFlow initialSearchTerm={initialSearchTerm} />
      {nodes.length > 0 && (
        <div className="flex-1 min-h-[600px] h-full">
          <FlowMap data={{ nodes, edges }} />
        </div>
      )}
    </div>
  );
}
