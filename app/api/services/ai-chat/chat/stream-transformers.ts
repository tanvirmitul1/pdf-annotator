/**
 * Stream Transformers
 * 
 * Each backend has its own streaming format. Stream transformers
 * convert backend-specific formats to our unified SSE format.
 * 
 * To add a new streaming format:
 * 1. Create a transformer function
 * 2. Add it to STREAM_TRANSFORMERS map
 * 3. Ensure the backend handler returns the expected stream format
 */

import type { GemmaBackend } from "./types";

// ── SSE Helpers ────────────────────────────────────────────────────
const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;

function sseToken(encoder: TextEncoder, token: string) {
  return encoder.encode(`data: ${JSON.stringify({ token })}\n\n`);
}

function sseDone(encoder: TextEncoder) {
  return encoder.encode("data: [DONE]\n\n");
}

function sseError(encoder: TextEncoder, message: string) {
  return encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`);
}

// ── Stream Transformer Interface ───────────────────────────────────
export type StreamTransformer = (
  stream: ReadableStream<Uint8Array>
) => ReadableStream<Uint8Array>;

// ── Ollama Stream Transformer ──────────────────────────────────────
function transformOllamaStream(stream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = stream.getReader();

  return new ReadableStream({
    async start(ctrl) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const chunk = JSON.parse(trimmed) as {
                message?: { content?: string };
                done?: boolean;
              };
              if (chunk.message?.content) {
                ctrl.enqueue(sseToken(encoder, chunk.message.content));
              }
              if (chunk.done) {
                ctrl.enqueue(sseDone(encoder));
              }
            } catch {
              // skip malformed JSON
            }
          }
        }

        if (buffer.trim()) {
          try {
            const chunk = JSON.parse(buffer.trim()) as {
              message?: { content?: string };
              done?: boolean;
            };
            if (chunk.message?.content) {
              ctrl.enqueue(sseToken(encoder, chunk.message.content));
            }
            if (chunk.done) {
              ctrl.enqueue(sseDone(encoder));
            }
          } catch {
            // skip malformed JSON
          }
        }
      } catch (err) {
        ctrl.enqueue(
          sseError(encoder, err instanceof Error ? err.message : "Stream error")
        );
      } finally {
        ctrl.close();
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

// ── OpenAI-Compatible Stream Transformer ───────────────────────────
function transformOpenAIStream(stream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = stream.getReader();

  return new ReadableStream({
    async start(ctrl) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n");
          buffer = events.pop() ?? "";

          for (const line of events) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const payload = trimmed.slice(6);
            if (payload === "[DONE]") {
              ctrl.enqueue(sseDone(encoder));
              continue;
            }

            try {
              const chunk = JSON.parse(payload) as {
                choices?: Array<{
                  delta?: { content?: string };
                  finish_reason?: string | null;
                }>;
              };
              const content = chunk.choices?.[0]?.delta?.content;
              if (content) {
                ctrl.enqueue(sseToken(encoder, content));
              }
              if (chunk.choices?.[0]?.finish_reason) {
                ctrl.enqueue(sseDone(encoder));
              }
            } catch {
              // skip malformed JSON
            }
          }
        }

        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith("data: ")) {
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") {
              ctrl.enqueue(sseDone(encoder));
            } else {
              try {
                const chunk = JSON.parse(payload) as {
                  choices?: Array<{
                    delta?: { content?: string };
                    finish_reason?: string | null;
                  }>;
                };
                const content = chunk.choices?.[0]?.delta?.content;
                if (content) {
                  ctrl.enqueue(sseToken(encoder, content));
                }
                if (chunk.choices?.[0]?.finish_reason) {
                  ctrl.enqueue(sseDone(encoder));
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        }
      } catch (err) {
        ctrl.enqueue(
          sseError(encoder, err instanceof Error ? err.message : "Stream error")
        );
      } finally {
        ctrl.close();
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

// ── Transformer Registry ───────────────────────────────────────────
export const STREAM_TRANSFORMERS: Record<GemmaBackend, StreamTransformer> = {
  local: transformOllamaStream,
  "gateway-api": transformOpenAIStream,
};

export function getStreamTransformer(backend: GemmaBackend): StreamTransformer {
  const transformer = STREAM_TRANSFORMERS[backend];
  if (!transformer) {
    throw new Error(`No stream transformer for backend: ${backend}`);
  }
  return transformer;
}

import { getBackendConfig } from "./backend-config";

export function getBackendCapabilities(backend: GemmaBackend) {
  return getBackendConfig(backend).capabilities;
}

export { SSE_HEADERS };
