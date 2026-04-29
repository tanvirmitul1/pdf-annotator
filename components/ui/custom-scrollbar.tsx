import { cn } from "@/lib/utils"

interface CustomScrollbarProps {
  children: React.ReactNode
  className?: string
  maxHeight?: string
}

export function CustomScrollbar({ children, className, maxHeight }: CustomScrollbarProps) {
  return (
    <div
      className={cn(
        "custom-scrollbar overflow-auto",
        className
      )}
      style={{ maxHeight }}
    >
      {children}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--neutral-100));
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--neutral-300));
          border-radius: 4px;
          transition: background 0.2s;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--neutral-400));
        }
        
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--neutral-300)) hsl(var(--neutral-100));
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--neutral-900));
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--neutral-700));
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--neutral-600));
        }
        
        .dark .custom-scrollbar {
          scrollbar-color: hsl(var(--neutral-700)) hsl(var(--neutral-900));
        }
      `}</style>
    </div>
  )
}
