# Gemma Chat Backend Architecture

This directory contains a scalable, provider-agnostic architecture for the Gemma chat backend.

## Architecture Overview

```
app/api/gemma/chat/
├── route.ts                  # Main API route handler
├── types.ts                  # Shared TypeScript types
├── backend-config.ts         # Backend provider configurations
├── backend-handlers.ts       # Backend-specific request handlers
├── stream-transformers.ts    # Stream format converters
└── README.md                 # This file
```

## Core Concepts

### 1. Backend Providers
A backend provider is a chat completion service (e.g., local Ollama, remote gateway API).

Each provider has:
- **Configuration**: endpoint URL, API key, model name
- **Capabilities**: what features it supports (images, audio, streaming)
- **Handler**: how to make requests to it
- **Stream Transformer**: how to parse its streaming responses

### 2. Separation of Concerns

- **`types.ts`**: All shared TypeScript types
- **`backend-config.ts`**: Static configuration for each provider
- **`backend-handlers.ts`**: Request execution logic (how to call the API)
- **`stream-transformers.ts`**: Response parsing logic (how to read the stream)
- **`route.ts`**: Orchestration layer (ties everything together)

## Adding a New Provider

### Example: Adding Azure OpenAI

#### Step 1: Add the provider to `types.ts`

```typescript
export type GemmaBackend = "local" | "gateway-api" | "azure-openai";
```

#### Step 2: Add configuration to `backend-config.ts`

```typescript
export const BACKEND_CONFIG: Record<GemmaBackend, BackendConfig> = {
  // ... existing configs
  "azure-openai": {
    name: "Azure OpenAI",
    description: "Microsoft Azure OpenAI Service",
    capabilities: {
      supportsImages: true,
      supportsAudio: false,
      supportsStreaming: true,
    },
    endpoint: {
      url: process.env.AZURE_OPENAI_ENDPOINT ?? "",
      apiKey: process.env.AZURE_OPENAI_KEY ?? "",
      model: process.env.AZURE_OPENAI_MODEL ?? "gpt-4",
    },
  },
};
```

#### Step 3: Create handler in `backend-handlers.ts`

```typescript
class AzureOpenAIHandler implements BackendHandler {
  async stream(request: ChatCompletionRequest, signal: AbortSignal): Promise<Response> {
    const config = getBackendConfig("azure-openai");
    
    const messages = [
      { role: "system", content: request.systemPrompt },
      ...request.messages,
    ];

    return fetch(`${config.endpoint.url}/openai/deployments/${config.endpoint.model}/chat/completions?api-version=2024-02-15-preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.endpoint.apiKey ?? "",
      },
      signal,
      body: JSON.stringify({
        messages,
        temperature: 0.7,
        stream: true,
      }),
    });
  }
}

// Add to registry
export const BACKEND_HANDLERS: Record<GemmaBackend, BackendHandler> = {
  // ... existing handlers
  "azure-openai": new AzureOpenAIHandler(),
};
```

#### Step 4: Add stream transformer to `stream-transformers.ts`

If the streaming format is the same as OpenAI, reuse the existing transformer:

```typescript
export const STREAM_TRANSFORMERS: Record<GemmaBackend, StreamTransformer> = {
  // ... existing transformers
  "azure-openai": transformOpenAIStream, // Reuse existing
};
```

Or create a custom transformer if needed:

```typescript
function transformAzureStream(stream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  // ... custom parsing logic
}

export const STREAM_TRANSFORMERS: Record<GemmaBackend, StreamTransformer> = {
  // ... existing transformers
  "azure-openai": transformAzureStream,
};
```

#### Step 5: Update `.env.example`

```bash
# Azure OpenAI
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
AZURE_OPENAI_KEY="your-api-key"
AZURE_OPENAI_MODEL="gpt-4"
```

Done! The new provider is now available.

## Frontend Integration

The frontend sends the selected backend via the `X-Gemma-Backend` header:

```typescript
fetch("/api/gemma/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Gemma-Backend": "azure-openai", // ← Selected backend
  },
  body: JSON.stringify({ messages }),
});
```

The API route automatically:
1. Validates the backend supports the requested features (images, audio)
2. Routes the request to the correct handler
3. Transforms the response stream to the unified SSE format

## Testing a New Provider

1. Add the provider following the steps above
2. Update the frontend backend selector to include the new option
3. Set the required env vars
4. Test via the UI or curl:

```bash
curl -X POST http://localhost:3000/api/gemma/chat \
  -H "Content-Type: application/json" \
  -H "X-Gemma-Backend: azure-openai" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

## Benefits of This Architecture

1. **Scalable**: Add new providers without modifying existing code
2. **Maintainable**: Each concern is isolated in its own file
3. **Type-safe**: Centralized types prevent inconsistencies
4. **Testable**: Each component can be tested independently
5. **DRY**: Reuse transformers and handlers across similar providers
6. **Self-documenting**: Code structure mirrors the conceptual model

## File Responsibilities

| File | Responsibility | When to Modify |
|------|---------------|----------------|
| `types.ts` | Type definitions | Adding new types or modifying existing ones |
| `backend-config.ts` | Static configuration | Adding provider or changing env vars |
| `backend-handlers.ts` | API request logic | Adding provider or changing request format |
| `stream-transformers.ts` | Stream parsing | Adding provider with new stream format |
| `route.ts` | Request orchestration | Changing overall flow or validation logic |

## Common Patterns

### Reusing Stream Transformers
If multiple providers use the same streaming format (e.g., OpenAI-compatible):

```typescript
export const STREAM_TRANSFORMERS: Record<GemmaBackend, StreamTransformer> = {
  "gateway-api": transformOpenAIStream,
  "azure-openai": transformOpenAIStream,    // Reuse
  "openai": transformOpenAIStream,          // Reuse
};
```

### Provider-Specific Options
Add optional fields to `BackendConfig` for provider-specific settings:

```typescript
export interface BackendConfig {
  name: string;
  description: string;
  capabilities: BackendCapabilities;
  endpoint: BackendEndpointConfig;
  options?: {
    temperature?: number;
    maxTokens?: number;
    [key: string]: unknown;
  };
}
```

### Capability Validation
The route automatically validates capabilities:

```typescript
const capabilities = getBackendCapabilities(selectedBackend);
if (hasImages && !capabilities.supportsImages) {
  return NextResponse.json({ error: "Images not supported" }, { status: 400 });
}
```

## Future Enhancements

- [ ] Add middleware for rate limiting per backend
- [ ] Add retry logic with exponential backoff
- [ ] Add response caching layer
- [ ] Add metrics/telemetry per provider
- [ ] Add provider health checks
- [ ] Add automatic failover between providers
