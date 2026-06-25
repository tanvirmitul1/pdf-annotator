"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "./_hooks/use-chat";
import { useCopyToClipboard } from "./_hooks/use-copy-clipboard";
import { useAttachments } from "./_hooks/use-attachments";
import { useSpeechRecognition } from "./_hooks/use-speech-recognition";
import { ChatPanel } from "./_components/chat-panel";
import { ArtifactPanel } from "./_components/artifact-panel";
import { ModernSidebar } from "./_components/modern-sidebar";
import { useListConversationsQuery } from "./_store/conversations-api";
import { cn } from "@/lib/utils";

type GemmaBackend = "local" | "gateway-api";

export default function GemmaChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("c");

  const [backend, setBackend] = useState<GemmaBackend>("gateway-api");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isArtifactPanelOpen, setIsArtifactPanelOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [hasLoadedFromUrl, setHasLoadedFromUrl] = useState(false);

  const chat = useChat(backend);
  const { copiedId, copy } = useCopyToClipboard();
  const attach = useAttachments();

  // Use the RTK query to enable refetching the conversation list
  const { refetch: refetchConversations } = useListConversationsQuery(
    { limit: 100 },
    { skip: false }
  );

  // Load conversation from URL on mount
  useEffect(() => {
    if (conversationIdFromUrl && !hasLoadedFromUrl) {
      chat.loadConversation(conversationIdFromUrl);
      setHasLoadedFromUrl(true);
    }
  }, [conversationIdFromUrl, hasLoadedFromUrl, chat]);

  // Update URL when conversation changes
  useEffect(() => {
    if (chat.currentConversationId) {
      router.replace(`/services/ai-chat?c=${chat.currentConversationId}`);
    } else if (hasLoadedFromUrl) {
      router.replace("/services/ai-chat");
    }
  }, [chat.currentConversationId, router, hasLoadedFromUrl]);

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
    router.replace("/services/ai-chat");
  }, [chat, attach, router]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      chat.loadConversation(id);
      attach.clearAttachments();
    },
    [chat, attach]
  );

  const handleConversationCreated = useCallback(
    (id: string, title: string) => {
      router.replace(`/services/ai-chat?c=${id}`);
      refetchConversations();
    },
    [router, refetchConversations]
  );

  const handleTitleGenerated = useCallback(
    () => {
      refetchConversations();
    },
    [refetchConversations]
  );

  const handleEditMessage = useCallback(
    (text: string) => {
      chat.setInput(text);
      chat.textareaRef.current?.focus();
    },
    [chat]
  );

  // Auto-collapse sidebar on medium screens when artifact panel opens
  useEffect(() => {
    if (showArtifactPanel && !isSidebarCollapsed) {
      // Check if we're in the md-lg range where space is tight
      const checkWidth = () => {
        if (window.innerWidth < 1280 && window.innerWidth >= 768) {
          setIsSidebarCollapsed(true);
        }
      };
      checkWidth();
    }
  }, [showArtifactPanel, isSidebarCollapsed]);

  // Close mobile sidebar when selecting a conversation
  const handleSelectConversationMobile = useCallback(
    (id: string) => {
      handleSelectConversation(id);
      setIsMobileSidebarOpen(false);
    },
    [handleSelectConversation]
  );

  const handleNewChatMobile = useCallback(() => {
    handleNewChat();
    setIsMobileSidebarOpen(false);
  }, [handleNewChat]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.div
        layout
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          "hidden md:flex flex-col shrink-0 border-r border-border/50 bg-sidebar",
          isSidebarCollapsed ? "w-16" : "w-72 lg:w-80"
        )}
      >
        <ModernSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          activeConversationId={chat.currentConversationId}
        />
      </motion.div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <motion.div
              key="sidebar-mobile"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-sidebar border-r border-border/50 shadow-2xl"
            >
              <ModernSidebar
                isCollapsed={false}
                onToggleCollapse={() => setIsMobileSidebarOpen(false)}
                onNewChat={handleNewChatMobile}
                onSelectConversation={handleSelectConversationMobile}
                activeConversationId={chat.currentConversationId}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              (id, title) => handleConversationCreated(id, title),
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
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onEditMessage={handleEditMessage}
        />
      </div>

      {/* Right Sidebar - Artifacts Panel (Desktop: lg+) */}
      {showArtifactPanel && (
        <div className="hidden lg:flex shrink-0 border-l border-border/50 bg-sidebar overflow-hidden">
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

      {/* Mobile/Tablet Artifact Panel Overlay (below lg) */}
      <AnimatePresence>
        {showArtifactPanel && (
          <motion.div
            key="artifact-mobile"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col"
          >
            <ArtifactPanel
              artifacts={chat.allArtifacts}
              activeArtifact={chat.activeArtifact}
              onSelectArtifact={chat.setActiveArtifact}
              onClose={() => setIsArtifactPanelOpen(false)}
              copiedId={copiedId}
              onCopy={copy}
              fullWidth
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
