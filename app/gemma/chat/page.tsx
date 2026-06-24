"use client";

import { useCallback, useState } from "react";
import { useChat } from "./_hooks/use-chat";
import { useCopyToClipboard } from "./_hooks/use-copy-clipboard";
import { useAttachments } from "./_hooks/use-attachments";
import { useSpeechRecognition } from "./_hooks/use-speech-recognition";
import { ChatPanel } from "./_components/chat-panel";
import { ArtifactPanel } from "./_components/artifact-panel";
import { ModernSidebar } from "./_components/modern-sidebar";
import { useListConversationsQuery } from "./_store/conversations-api";

type GemmaBackend = "local" | "gateway-api";

export default function GemmaChatPage() {
  const [backend, setBackend] = useState<GemmaBackend>("gateway-api");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isArtifactPanelOpen, setIsArtifactPanelOpen] = useState(false);

  const chat = useChat(backend);
  const { copiedId, copy } = useCopyToClipboard();
  const attach = useAttachments();

  // Use the RTK query to enable refetching the conversation list
  const { refetch: refetchConversations } = useListConversationsQuery(
    { limit: 100 },
    { skip: false }
  );

  const handleSpeechTranscript = useCallback(
    (text: string) => {
      chat.setInput((prev: string) => {
        const separator = prev && !prev.endsWith(" ") ? " " : "";
        return prev + separator + text;
      });
    },
    [chat]
  );

  const speech = useSpeechRecognition({
    onTranscript: handleSpeechTranscript,
  });

  const hasArtifacts = chat.allArtifacts.length > 0;
  const isGateway = backend === "gateway-api";

  // Auto-open artifact panel when artifacts are available
  const showArtifactPanel = hasArtifacts && isArtifactPanelOpen;

  const handleNewChat = useCallback(() => {
    chat.clearChat();
    attach.clearAttachments();
  }, [chat, attach]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      chat.loadConversation(id);
      attach.clearAttachments();
    },
    [chat, attach]
  );

  const handleConversationCreated = useCallback(
    () => {
      refetchConversations();
    },
    [refetchConversations]
  );

  const handleTitleGenerated = useCallback(
    () => {
      refetchConversations();
    },
    [refetchConversations]
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Left Sidebar - Conversations */}
      <div
        className={`
          hidden md:flex flex-col
          ${isSidebarCollapsed ? "w-16" : "w-72 lg:w-80"}
          border-r border-slate-200 dark:border-slate-800
          bg-white dark:bg-slate-900
          transition-all duration-300 ease-in-out
        `}
      >
        <ModernSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          activeConversationId={chat.currentConversationId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatPanel
          messages={chat.messages}
          input={chat.input}
          onInputChange={chat.setInput}
          onSubmit={(attachments, hasOcrPending) =>
            chat.submit(
              attachments,
              hasOcrPending,
              () => handleConversationCreated(),
              () => handleTitleGenerated()
            )
          }
          onKeyDown={chat.handleKeyDown}
          isLoading={chat.isLoading}
          onStop={chat.stop}
          error={chat.error}
          onDismissError={chat.dismissError}
          onArtifactClick={(artifact) => {
            chat.openArtifact(artifact);
            setIsArtifactPanelOpen(true);
          }}
          hasArtifacts={hasArtifacts}
          isPanelOpen={isArtifactPanelOpen}
          onTogglePanel={() => setIsArtifactPanelOpen(!isArtifactPanelOpen)}
          messagesEndRef={chat.messagesEndRef}
          textareaRef={chat.textareaRef}
          showPanel={showArtifactPanel}
          attachments={attach.attachments}
          ocrLoading={attach.ocrLoading}
          ocrProgress={attach.ocrProgress}
          ocrErrors={attach.ocrErrors}
          onAddFiles={attach.addFiles}
          onRemoveAttachment={attach.removeAttachment}
          onRunOcr={attach.runOcrOnAttachment}
          onRetryOcr={attach.retryOcr}
          onCancelOcr={attach.cancelOcr}
          onClearAttachments={attach.clearAttachments}
          isListening={speech.isListening}
          isSpeechSupported={speech.isSupported}
          onToggleSpeech={speech.toggle}
          backend={backend}
          onBackendChange={setBackend}
          hasOcrPending={isGateway && attach.hasOcrPendingOrFailed()}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      </div>

      {/* Right Sidebar - Artifacts Panel */}
      {showArtifactPanel && (
        <div className="hidden lg:flex border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <ArtifactPanel
            artifacts={chat.allArtifacts}
            activeArtifact={chat.activeArtifact}
            onSelectArtifact={chat.setActiveArtifact}
            onClose={() => setIsArtifactPanelOpen(false)}
            copiedId={copiedId}
            onCopy={copy}
          />
        </div>
      )}

      {/* Mobile Artifact Panel Overlay */}
      {showArtifactPanel && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-slate-900">
          <ArtifactPanel
            artifacts={chat.allArtifacts}
            activeArtifact={chat.activeArtifact}
            onSelectArtifact={chat.setActiveArtifact}
            onClose={() => setIsArtifactPanelOpen(false)}
            copiedId={copiedId}
            onCopy={copy}
          />
        </div>
      )}
    </div>
  );
}
