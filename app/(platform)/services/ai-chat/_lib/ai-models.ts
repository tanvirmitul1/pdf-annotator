import { ChatModel } from "@prisma/client";

export interface AIModelConfig {
  id: ChatModel;
  name: string;
  description: string;
  provider: "ollama" | "vllm" | "openai" | "anthropic" | "google";
  endpoint?: string;
  modelName: string;
  features: {
    streaming: boolean;
    multimodal: boolean;
    functionCalling: boolean;
  };
  limits: {
    maxTokens: number;
    contextWindow: number;
  };
  pricing?: {
    promptTokenCost: number; // per 1K tokens
    completionTokenCost: number; // per 1K tokens
  };
}

export const AI_MODELS: Record<ChatModel, AIModelConfig> = {
  GEMMA_LOCAL: {
    id: "GEMMA_LOCAL",
    name: "Gemma (Local)",
    description: "Local Ollama instance with multimodal support",
    provider: "ollama",
    endpoint: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
    modelName: process.env.OLLAMA_MODEL || "gemma4:e2b",
    features: {
      streaming: true,
      multimodal: true,
      functionCalling: false,
    },
    limits: {
      maxTokens: 4096,
      contextWindow: 8192,
    },
  },
  GEMMA_GATEWAY: {
    id: "GEMMA_GATEWAY",
    name: "Gemma (Gateway)",
    description: "Remote vLLM gateway, text-only",
    provider: "vllm",
    endpoint:
      process.env.GATEWAY_API_URL ||
      "https://gateway.bangla.gov.bd/G26BA4B/v1",
    modelName:
      process.env.GATEWAY_MODEL || "nvidia/Gemma-4-26B-A4B-NVFP4",
    features: {
      streaming: true,
      multimodal: false,
      functionCalling: false,
    },
    limits: {
      maxTokens: 4096,
      contextWindow: 8192,
    },
  },
  GPT_4: {
    id: "GPT_4",
    name: "GPT-4",
    description: "Most capable OpenAI model",
    provider: "openai",
    modelName: "gpt-4",
    features: {
      streaming: true,
      multimodal: false,
      functionCalling: true,
    },
    limits: {
      maxTokens: 8192,
      contextWindow: 8192,
    },
    pricing: {
      promptTokenCost: 0.03,
      completionTokenCost: 0.06,
    },
  },
  GPT_4_TURBO: {
    id: "GPT_4_TURBO",
    name: "GPT-4 Turbo",
    description: "Faster and cheaper GPT-4",
    provider: "openai",
    modelName: "gpt-4-turbo-preview",
    features: {
      streaming: true,
      multimodal: true,
      functionCalling: true,
    },
    limits: {
      maxTokens: 4096,
      contextWindow: 128000,
    },
    pricing: {
      promptTokenCost: 0.01,
      completionTokenCost: 0.03,
    },
  },
  GPT_3_5_TURBO: {
    id: "GPT_3_5_TURBO",
    name: "GPT-3.5 Turbo",
    description: "Fast and economical",
    provider: "openai",
    modelName: "gpt-3.5-turbo",
    features: {
      streaming: true,
      multimodal: false,
      functionCalling: true,
    },
    limits: {
      maxTokens: 4096,
      contextWindow: 16384,
    },
    pricing: {
      promptTokenCost: 0.0005,
      completionTokenCost: 0.0015,
    },
  },
  CLAUDE_3_OPUS: {
    id: "CLAUDE_3_OPUS",
    name: "Claude 3 Opus",
    description: "Most powerful Claude model",
    provider: "anthropic",
    modelName: "claude-3-opus-20240229",
    features: {
      streaming: true,
      multimodal: true,
      functionCalling: false,
    },
    limits: {
      maxTokens: 4096,
      contextWindow: 200000,
    },
    pricing: {
      promptTokenCost: 0.015,
      completionTokenCost: 0.075,
    },
  },
  CLAUDE_3_SONNET: {
    id: "CLAUDE_3_SONNET",
    name: "Claude 3 Sonnet",
    description: "Balanced performance and speed",
    provider: "anthropic",
    modelName: "claude-3-sonnet-20240229",
    features: {
      streaming: true,
      multimodal: true,
      functionCalling: false,
    },
    limits: {
      maxTokens: 4096,
      contextWindow: 200000,
    },
    pricing: {
      promptTokenCost: 0.003,
      completionTokenCost: 0.015,
    },
  },
  CLAUDE_3_HAIKU: {
    id: "CLAUDE_3_HAIKU",
    name: "Claude 3 Haiku",
    description: "Fastest Claude model",
    provider: "anthropic",
    modelName: "claude-3-haiku-20240307",
    features: {
      streaming: true,
      multimodal: true,
      functionCalling: false,
    },
    limits: {
      maxTokens: 4096,
      contextWindow: 200000,
    },
    pricing: {
      promptTokenCost: 0.00025,
      completionTokenCost: 0.00125,
    },
  },
  GEMINI_PRO: {
    id: "GEMINI_PRO",
    name: "Gemini Pro",
    description: "Google's latest AI model",
    provider: "google",
    modelName: "gemini-pro",
    features: {
      streaming: true,
      multimodal: false,
      functionCalling: true,
    },
    limits: {
      maxTokens: 8192,
      contextWindow: 32768,
    },
  },
  GEMINI_ULTRA: {
    id: "GEMINI_ULTRA",
    name: "Gemini Ultra",
    description: "Most capable Gemini model",
    provider: "google",
    modelName: "gemini-ultra",
    features: {
      streaming: true,
      multimodal: true,
      functionCalling: true,
    },
    limits: {
      maxTokens: 8192,
      contextWindow: 32768,
    },
  },
  DEEPSEEK_CHAT: {
    id: "DEEPSEEK_CHAT",
    name: "DeepSeek Chat",
    description: "Cost-effective alternative",
    provider: "openai", // OpenAI-compatible API
    modelName: "deepseek-chat",
    features: {
      streaming: true,
      multimodal: false,
      functionCalling: false,
    },
    limits: {
      maxTokens: 4096,
      contextWindow: 16384,
    },
  },
  LLAMA_3_70B: {
    id: "LLAMA_3_70B",
    name: "Llama 3 70B",
    description: "Open-source powerhouse",
    provider: "ollama",
    modelName: "llama3:70b",
    features: {
      streaming: true,
      multimodal: false,
      functionCalling: false,
    },
    limits: {
      maxTokens: 4096,
      contextWindow: 8192,
    },
  },
  MISTRAL_LARGE: {
    id: "MISTRAL_LARGE",
    name: "Mistral Large",
    description: "European AI champion",
    provider: "openai", // OpenAI-compatible API
    modelName: "mistral-large-latest",
    features: {
      streaming: true,
      multimodal: false,
      functionCalling: true,
    },
    limits: {
      maxTokens: 8192,
      contextWindow: 32768,
    },
  },
};

export function getModelConfig(model: ChatModel): AIModelConfig {
  return AI_MODELS[model];
}

export function getAvailableModels(): AIModelConfig[] {
  // Only return models that have endpoints configured or are always available
  return Object.values(AI_MODELS).filter((model) => {
    if (model.id === "GEMMA_LOCAL" || model.id === "GEMMA_GATEWAY") {
      return true; // Always available
    }
    // For other models, check if API keys are configured
    return false; // Disabled by default until API keys are added
  });
}
