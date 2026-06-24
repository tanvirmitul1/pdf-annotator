/**
 * Gemma Backend Configuration
 * 
 * This file centralizes all backend provider configurations.
 * To add a new provider:
 * 1. Add the provider key to GemmaBackend type in types.ts
 * 2. Add configuration to BACKEND_CONFIG
 * 3. Add handler to backend-handlers.ts
 * 4. Add stream transformer to stream-transformers.ts
 */

import type { GemmaBackend, BackendConfig } from "./types";

export const BACKEND_CONFIG: Record<GemmaBackend, BackendConfig> = {
  local: {
    name: "Local Ollama",
    description: "Local Ollama instance with full multimodal support",
    capabilities: {
      supportsImages: true,
      supportsAudio: true,
      supportsStreaming: true,
    },
    endpoint: {
      url: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
      model: process.env.OLLAMA_MODEL ?? "gemma4:e2b",
    },
  },
  "gateway-api": {
    name: "Gateway API",
    description: "Remote vLLM gateway (OpenAI-compatible, text-only)",
    capabilities: {
      supportsImages: false,
      supportsAudio: false,
      supportsStreaming: true,
    },
    endpoint: {
      url: process.env.GATEWAY_API_URL ?? "https://gateway.bangla.gov.bd/G26BA4B/v1",
      apiKey: process.env.GATEWAY_API_KEY ?? "not-needed",
      model: process.env.GATEWAY_MODEL ?? "nvidia/Gemma-4-26B-A4B-NVFP4",
    },
  },
};

export function getBackendConfig(backend: GemmaBackend): BackendConfig {
  return BACKEND_CONFIG[backend];
}

export type { GemmaBackend, BackendConfig } from "./types";
