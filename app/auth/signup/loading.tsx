import { Skeleton } from "@/components/ui/skeleton"

export default function SignupLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="relative flex min-h-screen">
        {/* Left Panel — hidden on mobile */}
        <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between border-r border-border/50 bg-card/40 px-10 py-10">
          <Skeleton className="h-8 w-32" />

          <div className="space-y-10">
            <div className="space-y-4">
              <Skeleton className="h-12 w-72" />
              <Skeleton className="h-10 w-56" />
              <Skeleton className="h-4 w-80" />
              <Skeleton className="h-4 w-64" />
            </div>

            <div className="space-y-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Skeleton className="h-3 w-40" />
        </div>

        {/* Right Panel — Form */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-8">
            {/* Logo on mobile */}
            <div className="lg:hidden">
              <Skeleton className="h-8 w-32 mx-auto mb-6" />
            </div>

            <div className="space-y-2 text-center lg:text-left">
              <Skeleton className="h-8 w-32 mx-auto lg:mx-0" />
              <Skeleton className="h-4 w-72 mx-auto lg:mx-0" />
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-px flex-1" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-px flex-1" />
            </div>

            {/* Name/Email/Password Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>

            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-4 w-52 mx-auto" />
          </div>
        </div>
      </div>
    </main>
  )
}
