export function ServiceSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading services">
      <div className="flex justify-between items-center">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
      </div>

      <div className="rounded-md border">
        <div className="bg-gray-50 px-3 py-3">
          <div className="grid grid-cols-9 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-3 py-4">
              <div className="grid grid-cols-9 gap-4">
                {Array.from({ length: 9 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
        </div>
      </div>

      <div className="sr-only">Loading service data...</div>
    </div>
  );
} 