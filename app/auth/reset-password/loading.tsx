import { Skeleton } from "@/components/ui/skeleton"

export default function ResetPasswordLoading() {
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
          <div className="px-8 py-8 flex flex-col gap-4">
            {/* New password input */}
            <Skeleton className="h-11 w-full rounded-lg" />
            {/* Confirm password input */}
            <Skeleton className="h-11 w-full rounded-lg" />
            {/* Submit button */}
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </div>

        {/* Legal line */}
        <Skeleton className="mx-auto mt-5 h-3 w-72" />
      </div>
    </main>
  )
}
