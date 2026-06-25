"use client";

import { FileText, MessageSquare, Layers, LucideIcon } from "lucide-react";
import { ServiceCard } from "./service-card";

const iconMap: Record<string, LucideIcon> = {
  FileText,
  MessageSquare,
  Layers,
};

const serviceStyles: Record<string, { gradient: string; glowColor: string }> = {
  DOCUMENTS: {
    gradient: "from-blue-500 to-cyan-500",
    glowColor: "oklch(0.65 0.2 240)",
  },
  AI_CHAT: {
    gradient: "from-purple-500 to-pink-500",
    glowColor: "oklch(0.6 0.25 300)",
  },
};

interface ServiceData {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color?: string;
  path: string;
  enabled: boolean;
  comingSoon?: boolean;
  stats?: {
    label: string;
    value: number;
  };
}

interface ServiceCardWrapperProps {
  services: ServiceData[];
}

export function ServiceCardWrapper({ services }: ServiceCardWrapperProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => {
        const Icon = iconMap[service.iconName] || FileText;
        const style = serviceStyles[service.id];
        return (
          <ServiceCard
            key={service.id}
            name={service.name}
            description={service.description}
            icon={Icon}
            path={service.path}
            enabled={service.enabled}
            comingSoon={service.comingSoon}
            gradient={style?.gradient}
            glowColor={style?.glowColor}
            stats={service.stats}
          />
        );
      })}

      {/* Coming soon placeholder */}
      <ServiceCard
        name="More Services"
        description="Additional productivity tools coming soon"
        icon={Layers}
        path="#"
        enabled={false}
        comingSoon
      />
    </div>
  );
}
