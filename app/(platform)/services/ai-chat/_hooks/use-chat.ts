import { useCallback, useEffect, useRef, useState } from "react";
import type { Artifact, ChatAttachment, ChatMessage } from "../_lib/types";
import { parseArtifacts } from "../_lib/artifact-parser";
import {
  buildContextPayload,
  generateSummary,
  SUMMARIZE_THRESHOLD,
} from "../_lib/context-manager";

export function useChat(backend?: "local" | "gateway-api") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Rolling summary of older messages for context compression
  const summaryRef = useRef<string | null>(null);
  // How many messages have already been folded into the summary
  const summarizedCountRef = useRef(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // All artifacts from assistant messages
  const allArtifacts = messages
    .filter((m) => m.role === "assistant")
    .flatMap((m) => parseArtifacts(m.text));

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setCurrentConversationId(null);
    setActiveArtifact(null);
    setIsPanelOpen(false);
    setError(null);
    summaryRef.current = null;
    summarizedCountRef.current = 0;
  }, []);

  /** Load messages from an existing conversation */
  const loadConversation = useCallback(async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setActiveArtifact(null);
    setIsPanelOpen(false);
    setError(null);
    summaryRef.current = null;
    summarizedCountRef.current = 0;

    try {
      const response = await fetch(`/api/gemma/chat/conversations/${conversationId}/messages`);
      if (!response.ok) {
        throw new Error("Failed to load messages");
      }
      const data = await response.json() as {
        messages: Array<{ 
          role: string; 
          content: string;
          attachments?: Array<{
            id: string;
            fileName: string;
            mimeType: string;
            cloudinaryUrl: string;
            ocrText: string | null;
          }>;
        }>;
      };
      const loaded: ChatMessage[] = data.messages.map((m) => ({
        role: m.role === "ASSISTANT" ? "assistant" : "user",
        text: m.content,
        attachments: m.attachments?.map((att) => ({
          id: att.id,
          fileName: att.fileName,
          mimeType: att.mimeType,
          base64: "",
          preview: att.cloudinaryUrl,
          kind: att.mimeType.startsWith("image/") ? "image" : "audio" as const,
          ocrText: att.ocrText || undefined,
        })),
      }));
      setMessages(loaded);

      // Open artifact panel if loaded messages contain artifacts
      const lastAssistant = loaded.filter((m) => m.role === "assistant").pop();
      if (lastAssistant) {
        const artifacts = parseArtifacts(lastAssistant.text);
        if (artifacts.length > 0) {
          setActiveArtifact(artifacts[0]);
          setIsPanelOpen(true);
        }
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setError("Failed to load conversation messages");
      setMessages([]);
    }
  }, []);

  const openArtifact = useCallback((artifact: Artifact) => {
    setActiveArtifact(artifact);
    setIsPanelOpen(true);
  }, []);

  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  /** Cancel an in-flight streaming response */
  const stop = useCallback(() => {
    readerRef.current?.cancel();
    readerRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  // Generate title from text
  const generateTitle = (text: string): string => {
    const cleaned = text.trim().replace(/\n+/g, " ");
    return cleaned.length > 50 ? cleaned.substring(0, 50) + "..." : cleaned;
  };

  const submit = useCallback(
    async (
      attachments?: ChatAttachment[],
      hasOcrPending?: boolean,
      onConversationCreated?: (id: string, title: string) => void,
      onTitleGenerated?: (id: string, title: string) => void
    ) => {
      const trimmed = input.trim();
      const hasAttachments = attachments && attachments.length > 0;
      if ((!trimmed && !hasAttachments) || isLoading) return;

      setError(null);

      // For gateway backend, block submission if images have pending/failed OCR
      if (backend === "gateway-api" && hasAttachments && hasOcrPending) {
        setError("Please wait for image OCR to complete or remove images with errors.");
        return;
      }

      // Build user message text (no OCR prefix in UI)
      let fallback = "Describe this image.";
      if (hasAttachments) {
        const hasAudio = attachments.some((a) => a.kind === "audio");
        const hasImage = attachments.some((a) => a.kind === "image");
        if (hasAudio && !hasImage) {
          fallback =
            "Transcribe this audio. Auto-detect the language and provide the full transcription.";
        } else if (hasAudio && hasImage) {
          fallback = "Describe the image and transcribe the audio.";
        }
      }

      const messageText = trimmed || fallback;

      const userMessage: ChatMessage = {
        role: "user",
        text: messageText,
        attachments: hasAttachments ? attachments : undefined,
      };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Create abort controller for this request
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // If this is the first message, create a conversation
        let conversationIdToUse = currentConversationId;
        const isFirstMessage = !conversationIdToUse && messages.length === 0;

        if (isFirstMessage) {
          const initialTitle = generateTitle(messageText);
          try {
            const createResponse = await fetch("/api/gemma/chat/conversations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: initialTitle }),
            });

            if (createResponse.ok) {
              const newConversation = await createResponse.json() as { id: string };
              conversationIdToUse = newConversation.id;
              setCurrentConversationId(conversationIdToUse);
              onConversationCreated?.(conversationIdToUse, initialTitle);
            }
          } catch (createErr) {
            console.error("Failed to create conversation:", createErr);
          }
        }

        // --- Context Management Pipeline ---
        console.log(
          `%c[useChat] ====== Context Pipeline Start ======`,
          "color: #FF5722; font-weight: bold; font-size: 14px"
        );
        console.log(
          `%c[useChat] Total messages in conversation: ${updatedMessages.length}`,
          "color: #FF5722"
        );

        // Convert ChatMessages to API format
        const apiMessages = updatedMessages.map((m, i) => {
          const msg: { role: string; content: string; images?: string[] } = {
            role: m.role,
            content: m.text,
          };

          const isLast = i === updatedMessages.length - 1;

          if (isLast && m.attachments && m.attachments.length > 0) {
            if (backend === "gateway-api") {
              const ocrTexts = m.attachments
                .filter((a) => a.ocrText)
                .map((a) => a.ocrText);
              if (ocrTexts.length > 0) {
                const ocrBlock = ocrTexts.join("\n\n");
                msg.content = `[Extracted text from image(s):\n${ocrBlock}]\n\n${msg.content}`;
              }
            } else {
              msg.images = m.attachments.map((a) => a.base64);
            }
          }

          return msg;
        });

        // Build context payload and check if new messages need summarizing
        const contextResult = buildContextPayload(
          apiMessages,
          summaryRef.current,
          summarizedCountRef.current
        );
        const { newMessagesToSummarize } = contextResult;
        let { messagesToSend } = contextResult;

        // If there are newly evicted messages, fold them into the summary
        if (newMessagesToSummarize.length > 0) {
          console.log(
            `%c[useChat] ${newMessagesToSummarize.length} messages evicted from window → updating summary incrementally`,
            "color: #E91E63; font-weight: bold"
          );
          try {
            summaryRef.current = await generateSummary(
              newMessagesToSummarize,
              summaryRef.current,
              backend || "local",
              controller.signal
            );
            summarizedCountRef.current += newMessagesToSummarize.length;
            console.log(
              `%c[useChat] Summary updated! Total messages summarized: ${summarizedCountRef.current}`,
              "color: #4CAF50; font-weight: bold"
            );

            // Rebuild payload with the fresh summary
            const rebuilt = buildContextPayload(
              apiMessages,
              summaryRef.current,
              summarizedCountRef.current
            );
            messagesToSend = rebuilt.messagesToSend;
          } catch (sumErr) {
            console.error("[useChat] Summarization failed — sending recent window only:", sumErr);
          }
        } else if (apiMessages.length <= SUMMARIZE_THRESHOLD) {
          console.log(
            `%c[useChat] Messages (${apiMessages.length}) <= threshold (${SUMMARIZE_THRESHOLD}) → sending all, no summarization`,
            "color: #2196F3"
          );
        } else {
          console.log(
            `%c[useChat] No new evictions → reusing cached summary`,
            "color: #4CAF50"
          );
        }

        console.log(
          `%c[useChat] Final payload: ${messagesToSend.length} messages (from ${apiMessages.length} total)`,
          "color: #FF5722; font-weight: bold",
          messagesToSend.map((m) => ({
            role: m.role,
            chars: m.content.length,
            preview: m.content.substring(0, 60) + (m.content.length > 60 ? "..." : ""),
          }))
        );
        console.log(
          `%c[useChat] ====== Context Pipeline End ======`,
          "color: #FF5722; font-weight: bold; font-size: 14px"
        );

        const response = await fetch("/api/gemma/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Gemma-Backend": backend || "local",
          },
          signal: controller.signal,
          body: JSON.stringify({ messages: messagesToSend }),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as {
            error?: string;
            details?: string;
          };
          throw new Error(
            errorData.details ??
              errorData.error ??
              `Request failed (${response.status})`
          );
        }

        // Add an empty assistant message that we'll stream into
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "" } as ChatMessage,
        ]);

        // Read SSE stream token by token
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");
        readerRef.current = reader;

        const decoder = new TextDecoder();
        let fullText = "";
        let sseBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const events = sseBuffer.split("\n\n");
          // Keep the last partial event in the buffer
          sseBuffer = events.pop() ?? "";

          for (const event of events) {
            const dataLine = event
              .split("\n")
              .find((l) => l.startsWith("data: "));
            if (!dataLine) continue;

            const payload = dataLine.slice(6); // strip "data: "
            if (payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload) as {
                token?: string;
                error?: string;
              };
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.token) {
                fullText += parsed.token;
                const textSnapshot = fullText;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  updated[updated.length - 1] = {
                    ...last,
                    text: textSnapshot,
                  };
                  return updated;
                });
              }
            } catch (e) {
              if (e instanceof Error && e.message !== "Stream error") throw e;
            }
          }
        }

        // Save messages to conversation if we have an ID
        if (conversationIdToUse) {
          try {
            // Upload attachments to Cloudinary first if present
            let attachmentIds: string[] = [];
            let uploadedAttachments: Array<{ id: string; cloudinaryUrl: string }> = [];
            if (attachments && attachments.length > 0) {
              uploadedAttachments = await Promise.all(
                attachments.map(async (att) => {
                  const response = await fetch(`/api/gemma/chat/attachments`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      conversationId: conversationIdToUse,
                      fileName: att.fileName,
                      mimeType: att.mimeType,
                      base64: att.base64,
                      ocrText: att.ocrText,
                    }),
                  });

                  const result = await response.json() as { id: string; cloudinaryUrl: string };
                  return result;
                })
              );
              attachmentIds = uploadedAttachments.map(a => a.id);
            }

            // Update the user message in state with Cloudinary URLs
            if (uploadedAttachments.length > 0) {
              setMessages((prev) => {
                const updated = [...prev];
                // Find the last user message (the one we just added)
                for (let i = updated.length - 1; i >= 0; i--) {
                  if (updated[i].role === "user" && updated[i].attachments) {
                    updated[i] = {
                      ...updated[i],
                      attachments: updated[i].attachments!.map((att, idx) => ({
                        ...att,
                        preview: uploadedAttachments[idx]?.cloudinaryUrl || att.preview,
                      })),
                    };
                    break;
                  }
                }
                return updated;
              });
            }

            // Save user message
            await fetch(`/api/gemma/chat/conversations/${conversationIdToUse}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                role: "USER",
                content: messageText,
                attachments: attachmentIds.length > 0 ? attachmentIds : undefined,
              }),
            });

            // Save assistant message
            await fetch(`/api/gemma/chat/conversations/${conversationIdToUse}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                role: "ASSISTANT",
                content: fullText,
              }),
            });

            // Update title from AI response if this was the first exchange
            if (isFirstMessage && fullText.trim()) {
              const aiTitle = generateTitle(fullText.substring(0, 100));
              onTitleGenerated?.(conversationIdToUse, aiTitle);

              await fetch(`/api/gemma/chat/conversations/${conversationIdToUse}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: aiTitle }),
              });
            }
          } catch (saveErr) {
            console.error("Failed to save messages:", saveErr);
          }
        }

        // Auto-open panel if response has artifacts
        const responseArtifacts = parseArtifacts(fullText);
        if (responseArtifacts.length > 0) {
          setActiveArtifact(responseArtifacts[0]);
          setIsPanelOpen(true);
        }
      } catch (err) {
        // Ignore abort errors (user clicked stop)
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
      } finally {
        readerRef.current = null;
        abortRef.current = null;
        setIsLoading(false);
        textareaRef.current?.focus();
      }
    },
    [input, isLoading, messages, backend, currentConversationId]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [submit]
  );

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    activeArtifact,
    setActiveArtifact,
    isPanelOpen,
    allArtifacts,
    messagesEndRef,
    textareaRef,
    currentConversationId,
    openArtifact,
    togglePanel,
    closePanel,
    dismissError,
    submit,
    stop,
    handleKeyDown,
    clearChat,
    loadConversation,
  } as const;
}
