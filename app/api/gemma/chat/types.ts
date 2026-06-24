/**
 * Shared Types for Gemma Backend System
 * 
 * Centralized type definitions used across backend configurations,
 * handlers, and API routes.
 */

export type GemmaBackend = "local" | "gateway-api";

export interface BackendCapabilities {
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsStreaming: boolean;
}

export interface BackendEndpointConfig {
  url: string;
  apiKey?: string;
  model: string;
}

export interface BackendConfig {
  name: string;
  description: string;
  capabilities: BackendCapabilities;
  endpoint: BackendEndpointConfig;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  systemPrompt: string;
}

export interface StreamChunk {
  token?: string;
  error?: string;
  done?: boolean;
}
