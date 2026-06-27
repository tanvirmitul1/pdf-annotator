import { Skeleton } from "@/components/ui/skeleton"

export default function VerifyEmailLoading() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-16">
      {/* Navbar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-border/40 bg-background/25 px-6 py-4 sm:px-10">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Centered card area */}
      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo icon */}
        <div className="mb-6 flex justify-center">
          <Skeleton className="size-12 rounded-xl" />
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl">
          <div className="flex flex-col items-center gap-5 px-8 py-10">
            {/* Mail icon box */}
            <Skeleton className="size-14 rounded-2xl" />
            {/* Description text */}
            <div className="w-full space-y-2">
              <Skeleton className="mx-auto h-4 w-full" />
              <Skeleton className="mx-auto h-4 w-3/4" />
            </div>
            {/* Resend button */}
            <Skeleton className="h-10 w-48 rounded-lg" />
          </div>
        </div>

        {/* Legal line */}
        <Skeleton className="mx-auto mt-5 h-3 w-72" />
      </div>
    </main>
  )
}
