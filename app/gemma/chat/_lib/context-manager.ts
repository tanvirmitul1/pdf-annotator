/**
 * Rolling Summary Context Manager
 *
 * Problem: Sending all previous messages on every request causes token limits
 * to be exceeded as conversations grow.
 *
 * Solution: Sliding window + incremental rolling summary.
 *
 * How it works:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ Message 1: "Hi"                                                 │
 * │ Message 2: "Hello! How can I help?"                             │
 * │ Message 3: "Tell me about X"           ← these get summarized   │
 * │ Message 4: "X is a framework..."       ←  into a short text     │
 * │ ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───      │
 * │ Message 5: "How do I install it?"      ← kept verbatim          │
 * │ Message 6: "Run npm install x"         ← kept verbatim          │
 * │ Message 7: "What about config?"  [NEW] ← kept verbatim          │
 * │                                                                  │
 * │ Sent to API:                                                    │
 * │   [Summary of M1-M4] + [M5, M6, M7]                            │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Key: Summary updates INCREMENTALLY each time the window slides:
 *   Turn 1: summary = summarize(M1, M2)
 *   Turn 2: summary = summarize(prev_summary + M3, M4)  ← NOT re-reading M1,M2
 *   Turn 3: summary = summarize(prev_summary + M5, M6)  ← NOT re-reading M1-M4
 *
 * This keeps both the summarization call AND the final payload small.
 */

interface ContextMessage {
  role: string;
  content: string;
  images?: string[];
}

/** Number of recent message pairs (user+assistant) to keep verbatim */
const RECENT_WINDOW_PAIRS = 2;
/** Total messages before we trigger summarization */
const SUMMARIZE_THRESHOLD = 6;
/** Max chars for summary text (keeps it compact) */
const MAX_SUMMARY_CHARS = 500;
/** Rough chars-to-tokens ratio */
const CHARS_PER_TOKEN = 4;
/** Max input tokens we allow (leave room for output from 8192 total) */
const MAX_INPUT_TOKENS = 3000;

const SUMMARIZE_PROMPT = `Summarize this conversation in 2-3 sentences. Keep only essential facts, decisions, and the user's current goal. Be extremely concise. Output ONLY the summary, nothing else.`;

/**
 * Build the context payload to send to the API.
 *
 * Takes all messages and an optional existing summary.
 * Returns the messages to send (summary + recent window) and
 * identifies which new messages need to be folded into the summary.
 */
export function buildContextPayload(
  allMessages: ContextMessage[],
  existingSummary: string | null,
  /** How many messages were already summarized in the existing summary */
  summarizedCount: number
): {
  messagesToSend: ContextMessage[];
  /** Messages that need to be folded into the summary (newly evicted from window) */
  newMessagesToSummarize: ContextMessage[];
} {
  console.log(
    `%c[Context Manager] buildContextPayload`,
    "color: #4CAF50; font-weight: bold",
    {
      totalMessages: allMessages.length,
      threshold: SUMMARIZE_THRESHOLD,
      alreadySummarized: summarizedCount,
      hasSummary: !!existingSummary,
    }
  );

  // If under threshold, send everything
  if (allMessages.length <= SUMMARIZE_THRESHOLD) {
    console.log(
      `%c[Context Manager] Under threshold (${allMessages.length} <= ${SUMMARIZE_THRESHOLD}) → sending ALL messages`,
      "color: #2196F3"
    );
    return {
      messagesToSend: allMessages,
      newMessagesToSummarize: [],
    };
  }

  // Keep the last N pairs verbatim
  const recentCount = RECENT_WINDOW_PAIRS * 2;
  const recentMessages = allMessages.slice(-recentCount);
  const olderMessages = allMessages.slice(0, -recentCount);

  // Which of the older messages are NOT yet in the summary?
  const newlyEvicted = olderMessages.slice(summarizedCount);

  console.log(
    `%c[Context Manager] Splitting messages`,
    "color: #FF9800; font-weight: bold",
    {
      olderMessages: olderMessages.length,
      alreadySummarized: summarizedCount,
      newlyEvicted: newlyEvicted.length,
      recentKeptVerbatim: recentMessages.length,
    }
  );

  if (newlyEvicted.length > 0) {
    console.log(
      `%c[Context Manager] New messages to fold into summary:`,
      "color: #FF9800",
      newlyEvicted.map((m) => `${m.role}: ${m.content.substring(0, 50)}...`)
    );
  }

  console.log(
    `%c[Context Manager] Recent messages (kept verbatim):`,
    "color: #4CAF50",
    recentMessages.map((m) => `${m.role}: ${m.content.substring(0, 50)}...`)
  );

  // Build final payload
  const messagesToSend = prependSummary(recentMessages, existingSummary);

  // Check total token estimate
  const totalChars = messagesToSend.reduce((sum, m) => sum + m.content.length, 0);
  const tokenEstimate = Math.ceil(totalChars / CHARS_PER_TOKEN);
  console.log(
    `%c[Context Manager] Payload estimate: ~${tokenEstimate} input tokens (limit: ${MAX_INPUT_TOKENS})`,
    tokenEstimate > MAX_INPUT_TOKENS ? "color: #f44336; font-weight: bold" : "color: #4CAF50"
  );

  return {
    messagesToSend,
    newMessagesToSummarize: newlyEvicted,
  };
}

/**
 * Prepend existing summary as the first user message for context.
 */
function prependSummary(
  messages: ContextMessage[],
  summary: string | null
): ContextMessage[] {
  if (!summary) {
    console.log(
      `%c[Context Manager] No summary → sending ${messages.length} messages as-is`,
      "color: #9E9E9E"
    );
    return messages;
  }

  console.log(
    `%c[Context Manager] Prepending summary (${summary.length} chars) + ${messages.length} recent messages`,
    "color: #9C27B0; font-weight: bold"
  );

  const summaryMessage: ContextMessage = {
    role: "user",
    content: `[Context from earlier conversation]\n${summary}\n\n[Continue the conversation from here]`,
  };

  const ackMessage: ContextMessage = {
    role: "assistant",
    content: "Got it, I have the context. Go ahead.",
  };

  return [summaryMessage, ackMessage, ...messages];
}

/**
 * Generate or update a rolling summary incrementally.
 *
 * This is the key function: it takes the PREVIOUS summary + only the
 * NEWLY evicted messages and produces an updated summary.
 * It does NOT re-read old messages — just folds new ones into the existing summary.
 *
 * prev_summary + new_messages → updated_summary
 */
export async function generateSummary(
  newMessages: ContextMessage[],
  existingSummary: string | null,
  backend: string,
  signal?: AbortSignal
): Promise<string> {
  console.log(
    `%c[Context Manager] Generating incremental summary`,
    "color: #E91E63; font-weight: bold",
    {
      newMessagesToFold: newMessages.length,
      hasExistingSummary: !!existingSummary,
      existingSummaryLength: existingSummary?.length ?? 0,
    }
  );

  // Build the prompt: previous summary + new messages to fold in
  let contentToSummarize = "";

  if (existingSummary) {
    contentToSummarize += `Current summary:\n"${existingSummary}"\n\nNew messages to incorporate into the summary:\n`;
  }

  // Only include the NEW messages, not the full history
  contentToSummarize += newMessages
    .map((m) => {
      // Truncate very long messages for the summarization call itself
      const content = m.content.length > 300
        ? m.content.substring(0, 300) + "..."
        : m.content;
      return `${m.role === "user" ? "User" : "Assistant"}: ${content}`;
    })
    .join("\n");

  console.log(
    `%c[Context Manager] Summarization input (${contentToSummarize.length} chars):`,
    "color: #E91E63",
    contentToSummarize.substring(0, 200) + "..."
  );

  const response = await fetch("/api/gemma/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gemma-Backend": backend,
    },
    signal,
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: `${SUMMARIZE_PROMPT}\n\n---\n\n${contentToSummarize}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate summary");
  }

  // Read the SSE stream
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let fullText = "";
  let sseBuffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const events = sseBuffer.split("\n\n");
      sseBuffer = events.pop() ?? "";

      for (const event of events) {
        const dataLine = event.split("\n").find((l) => l.startsWith("data: "));
        if (!dataLine) continue;

        const payload = dataLine.slice(6);
        if (payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload) as { token?: string };
          if (parsed.token) {
            fullText += parsed.token;
          }
        } catch {
          // skip malformed events
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Truncate summary if it's too long
  let result = fullText.trim();
  if (result.length > MAX_SUMMARY_CHARS) {
    result = result.substring(0, MAX_SUMMARY_CHARS) + "...";
    console.log(
      `%c[Context Manager] Summary truncated to ${MAX_SUMMARY_CHARS} chars`,
      "color: #FF9800"
    );
  }

  console.log(
    `%c[Context Manager] Summary ready (${result.length} chars)`,
    "color: #4CAF50; font-weight: bold",
    result
  );

  return result;
}

export { SUMMARIZE_THRESHOLD, RECENT_WINDOW_PAIRS };
