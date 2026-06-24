import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 w-full animate-message-in">
      <div className="shrink-0 size-8 rounded-xl gemma-gradient flex items-center justify-center gemma-shadow">
        <Bot className="size-4 text-white" />
      </div>
      <div className="rounded-2xl bg-card/80 border border-border/40 px-4 py-3 rounded-bl-sm gemma-shadow gemma-shimmer">
        <div className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full bg-primary/70"
            style={{ animation: "typing-dot 1.2s ease-in-out infinite" }}
          />
          <span
            className="size-2 rounded-full bg-primary/70"
            style={{ animation: "typing-dot 1.2s ease-in-out 0.2s infinite" }}
          />
          <span
            className="size-2 rounded-full bg-primary/70"
            style={{ animation: "typing-dot 1.2s ease-in-out 0.4s infinite" }}
          />
        </div>
      </div>
    </div>
  );
}
