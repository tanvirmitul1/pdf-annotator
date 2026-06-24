"use client";

import { useState, useCallback } from "react";
import { Plus, Search, Settings, Archive, Folder, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  useListConversationsQuery,
  useCreateConversationMutation,
} from "../_store/conversations-api";
import { ConversationItem } from "./conversation-item";
import { useRouter } from "next/navigation";

interface ChatSidebarProps {
  activeConversationId?: string;
  onClose?: () => void;
  isMobile?: boolean;
}

export function ChatSidebar({
  activeConversationId,
  onClose,
  isMobile = false,
}: ChatSidebarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const { data, isLoading, error } = useListConversationsQuery({
    search: searchQuery || undefined,
    archived: showArchived,
    pinned: showPinnedOnly || undefined,
    limit: 100,
  });

  const [createConversation, { isLoading: isCreating }] =
    useCreateConversationMutation();

  const handleNewChat = useCallback(async () => {
    try {
      const conversation = await createConversation({}).unwrap();
      router.push(`/gemma/chat/${conversation.id}`);
      if (isMobile && onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  }, [createConversation, router, isMobile, onClose]);

  const handleConversationClick = useCallback(
    (conversationId: string) => {
      router.push(`/gemma/chat/${conversationId}`);
      if (isMobile && onClose) {
        onClose();
      }
    },
    [router, isMobile, onClose]
  );

  const pinnedConversations = data?.conversations.filter((c) => c.pinned) || [];
  const unpinnedConversations = data?.conversations.filter((c) => !c.pinned) || [];

  return (
    <div
      className={cn(
        "flex flex-col h-full border-r border-border/40 bg-background",
        isMobile ? "w-full" : "w-80"
      )}
    >
      {/* Header */}
      <div className="shrink-0 p-3 space-y-3 border-b border-border/40">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="size-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </span>
            Conversations
          </h2>
          
          {isMobile && onClose && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        <Button
          onClick={handleNewChat}
          disabled={isCreating}
          className="w-full bg-gradient-to-br from-primary to-accent text-white hover:opacity-90"
          size="sm"
        >
          {isCreating ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Plus className="size-4 mr-2" />
          )}
          New Chat
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showArchived ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className={cn(showArchived && "bg-secondary")}
                >
                  <Archive className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {showArchived ? "Show active" : "Show archived"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push("/gemma/chat/settings")}
                >
                  <Settings className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-destructive text-center">
            Failed to load conversations
          </div>
        ) : data?.conversations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {searchQuery
                ? "No conversations found"
                : "No conversations yet"}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                disabled={isCreating}
              >
                <Plus className="size-4 mr-2" />
                Start your first chat
              </Button>
            )}
          </div>
        ) : (
          <div className="py-2">
            {/* Pinned Section */}
            {pinnedConversations.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Pinned
                </div>
                <div className="space-y-0.5">
                  {pinnedConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeConversationId}
                      onClick={() => handleConversationClick(conversation.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Conversations */}
            {unpinnedConversations.length > 0 && (
              <div>
                {pinnedConversations.length > 0 && (
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Recent
                  </div>
                )}
                <div className="space-y-0.5">
                  {unpinnedConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeConversationId}
                      onClick={() => handleConversationClick(conversation.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 p-3 border-t border-border/40">
        <div className="text-xs text-muted-foreground text-center">
          {data?.pagination.total || 0} conversation{data?.pagination.total !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
