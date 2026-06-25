/**
 * Backend Handlers
 * 
 * Each backend provider implements the BackendHandler interface.
 * To add a new provider:
 * 1. Create a new handler class implementing BackendHandler
 * 2. Add it to the BACKEND_HANDLERS map
 * 3. Update backend-config.ts with the new provider config
 * 4. Add stream transformer to stream-transformers.ts
 */

import type { GemmaBackend, ChatCompletionRequest } from "./types";
import { getBackendConfig } from "./backend-config";

export interface BackendHandler {
  stream(request: ChatCompletionRequest, signal: AbortSignal): Promise<Response>;
}

// ── Local Ollama Handler ───────────────────────────────────────────
class OllamaHandler implements BackendHandler {
  async stream(request: ChatCompletionRequest, signal: AbortSignal): Promise<Response> {
    const config = getBackendConfig("local");
    
    const ollamaMessages = [
      { role: "system", content: request.systemPrompt },
      ...request.messages.map(m => ({
        role: m.role,
        content: m.content,
        images: m.images,
      })),
    ];

    return fetch(`${config.endpoint.url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        model: config.endpoint.model,
        messages: ollamaMessages,
        stream: true,
      }),
    });
  }
}

// ── Gateway API Handler (OpenAI-compatible) ────────────────────────
class GatewayApiHandler implements BackendHandler {
  async stream(request: ChatCompletionRequest, signal: AbortSignal): Promise<Response> {
    const config = getBackendConfig("gateway-api");
    
    const openaiMessages = [
      { role: "system", content: request.systemPrompt },
      ...request.messages.map(m => ({
        role: m.role === "system" ? "system" : m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    console.log("\n----------------------------------------");
    console.log("[Gateway API] Sending to external API:");
    console.log(`  URL: ${config.endpoint.url}/chat/completions`);
    console.log(`  Model: ${config.endpoint.model}`);
    console.log(`  Messages: ${openaiMessages.length}`);
    console.log("[Gateway API] Payload messages:");
    openaiMessages.forEach((m, i) => {
      const preview = m.content.length > 100
        ? m.content.substring(0, 100) + `... (${m.content.length} chars)`
        : m.content;
      const isSummary = m.content.includes("[Previous conversation summary");
      const isSystemPrompt = m.role === "system" && i === 0;
      const label = isSystemPrompt
        ? " [SYSTEM PROMPT]"
        : isSummary
          ? " [CONTEXT SUMMARY]"
          : "";
      console.log(`  [${i}] ${m.role}${label}: ${preview}`);
    });
    const totalChars = openaiMessages.reduce((sum, m) => sum + m.content.length, 0);
    console.log(`[Gateway API] Total payload: ~${totalChars} chars (~${Math.round(totalChars / 4)} tokens estimate)`);
    console.log("----------------------------------------\n");

    return fetch(`${config.endpoint.url}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.endpoint.apiKey}`,
      },
      signal,
      body: JSON.stringify({
        model: config.endpoint.model,
        messages: openaiMessages,
        temperature: 1.0,
        top_p: 0.95,
        max_tokens: 2048,
        stream: true,
      }),
    });
  }
}

// ── Handler Registry ───────────────────────────────────────────────
export const BACKEND_HANDLERS: Record<GemmaBackend, BackendHandler> = {
  local: new OllamaHandler(),
  "gateway-api": new GatewayApiHandler(),
};

export function getBackendHandler(backend: GemmaBackend): BackendHandler {
  const handler = BACKEND_HANDLERS[backend];
  if (!handler) {
    throw new Error(`Unknown backend: ${backend}`);
  }
  return handler;
}
