import { Skeleton } from "@/components/ui/skeleton"

export default function LoginLoading() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-16">
      {/* Navbar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-border/40 bg-background/25 px-6 py-4 sm:px-10">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-44" />
      </div>

      {/* Centered card area */}
      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo icon */}
        <div className="mb-6 flex justify-center">
          <Skeleton className="size-12 rounded-xl" />
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl">
          <div className="px-8 pb-8 pt-8 flex flex-col gap-5">
            {/* Title */}
            <Skeleton className="mx-auto h-9 w-20" />

            {/* Social icon buttons */}
            <div className="flex items-center justify-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <Skeleton className="size-10 rounded-lg" />
            </div>

            {/* OR divider */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-px flex-1" />
              <Skeleton className="h-3.5 w-6" />
              <Skeleton className="h-px flex-1" />
            </div>

            {/* Fields + actions */}
            <div className="flex flex-col gap-3">
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
              {/* Forgot password link */}
              <Skeleton className="ml-auto h-4 w-28" />
              {/* Submit */}
              <Skeleton className="mt-1 h-11 w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* Legal line */}
        <Skeleton className="mx-auto mt-5 h-3 w-72" />
      </div>
    </main>
  )
}
