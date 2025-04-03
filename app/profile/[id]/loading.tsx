export default function LoadingProfile() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Header Skeleton */}
            <div className="mb-6 flex items-center justify-between">
              <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
            </div>

            {/* Bio Skeleton */}
            <div className="mb-6">
              <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-20 animate-pulse rounded bg-gray-200" />
            </div>

            {/* Gaming Stats Skeleton */}
            <div>
              <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-32 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
