import { ServiceType } from "@prisma/client";
import { FileText, MessageSquare, LucideIcon } from "lucide-react";

export interface ServiceConfig {
  id: ServiceType;
  name: string;
  description: string;
  icon: LucideIcon;
  iconName: string;
  path: string;
  enabled: boolean;
  comingSoon?: boolean;
}

export const SERVICES: ServiceConfig[] = [
  {
    id: "DOCUMENTS" as ServiceType,
    name: "PDF Annotator",
    description: "Upload, annotate, and collaborate on PDF and image files",
    icon: FileText,
    iconName: "FileText",
    path: "/services/annotations",
    enabled: true,
  },
  {
    id: "AI_CHAT" as ServiceType,
    name: "AI Chat Assistant",
    description: "Intelligent chat with OCR, voice input, and artifacts",
    icon: MessageSquare,
    iconName: "MessageSquare",
    path: "/services/ai-chat",
    enabled: true,
  },
];

export function getServiceConfig(serviceType: ServiceType): ServiceConfig | undefined {
  return SERVICES.find((s) => s.id === serviceType);
}

export function getServiceByPath(path: string): ServiceConfig | undefined {
  return SERVICES.find((s) => path.startsWith(s.path));
}

export function getEnabledServices(): ServiceConfig[] {
  return SERVICES.filter((s) => s.enabled && !s.comingSoon);
}
