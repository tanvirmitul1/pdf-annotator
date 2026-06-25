"use client";

import Link from "next/link";
import { LucideIcon, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  path: string;
  enabled: boolean;
  comingSoon?: boolean;
  gradient?: string;
  glowColor?: string;
  stats?: {
    label: string;
    value: number;
  };
}

export function ServiceCard({
  name,
  description,
  icon: Icon,
  path,
  enabled,
  comingSoon,
  gradient = "from-primary to-accent",
  glowColor = "var(--primary)",
  stats,
}: ServiceCardProps) {
  const isDisabled = !enabled || comingSoon;

  const cardContent = (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl border p-7 sm:p-8 transition-all duration-300",
        isDisabled
          ? "border-border/30 bg-muted/20 opacity-60 cursor-not-allowed"
          : "border-border/30 bg-card/70 backdrop-blur-sm cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl"
      )}
      style={
        !isDisabled
          ? { "--glow": glowColor } as React.CSSProperties
          : undefined
      }
    >
      {/* Hover glow effect */}
      {!isDisabled && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in oklab, ${glowColor} 10%, transparent) 0, transparent 70%)`,
          }}
        />
      )}

      {/* Hover border glow */}
      {!isDisabled && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${glowColor} 25%, transparent), 0 8px 32px -8px color-mix(in oklab, ${glowColor} 12%, transparent)`,
          }}
        />
      )}

      <div className="relative flex flex-col h-full">
        {/* Icon & Badge Row */}
        <div className="flex items-start justify-between mb-5">
          <div
            className={cn(
              "inline-flex size-14 items-center justify-center rounded-2xl transition-transform duration-300",
              isDisabled
                ? "bg-muted"
                : `bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110`
            )}
            style={
              !isDisabled
                ? { boxShadow: `0 4px 14px -2px color-mix(in oklab, ${glowColor} 30%, transparent)` }
                : undefined
            }
          >
            <Icon className={cn("size-7", isDisabled ? "text-muted-foreground" : "text-white")} />
          </div>

          {comingSoon && (
            <div className="px-3 py-1 rounded-full bg-muted/60 border border-border/40">
              <span className="text-[11px] font-medium text-muted-foreground">Coming Soon</span>
            </div>
          )}

          {!enabled && !comingSoon && (
            <Lock className="size-5 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2 text-foreground tracking-tight">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Stats */}
        {stats && !isDisabled && (
          <div className="mt-5 pt-5 border-t border-border/30">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {stats.value}
              </span>
              <span className="text-sm text-muted-foreground">{stats.label}</span>
            </div>
          </div>
        )}

        {/* Action */}
        {!isDisabled && (
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-primary">
            <span>Open service</span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1.5" />
          </div>
        )}
      </div>
    </div>
  );

  if (isDisabled) {
    return cardContent;
  }

  return <Link href={path} className="block h-full">{cardContent}</Link>;
}
