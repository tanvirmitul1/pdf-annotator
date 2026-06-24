"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Loader2,
  MoreVertical,
  Trash2,
  Edit2,
  Pin,
  PinOff,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  useListConversationsQuery,
  useDeleteConversationMutation,
  useUpdateConversationMutation,
} from "../_store/conversations-api";
import { formatDistanceToNow } from "date-fns";

interface ModernSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewChat?: () => void;
  onSelectConversation?: (id: string) => void;
  activeConversationId?: string | null;
}

export function ModernSidebar({
  isCollapsed,
  onToggleCollapse,
  onNewChat,
  onSelectConversation,
  activeConversationId,
}: ModernSidebarProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data, isLoading } = useListConversationsQuery(
    {
      search: searchQuery || undefined,
      archived: showArchived,
      limit: 100,
    },
    { skip: status !== "authenticated" }
  );

  const [deleteConversation] = useDeleteConversationMutation();
  const [updateConversation] = useUpdateConversationMutation();

  const handleNewChat = async () => {
    if (status !== "authenticated") {
      router.push("/login?callbackUrl=/gemma/chat");
      return;
    }

    onNewChat?.();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation(id).unwrap();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      await updateConversation({ id, updates: { pinned: !currentPinned } }).unwrap();
    } catch (error) {
      console.error("Failed to pin:", error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await updateConversation({ id, updates: { archived: true } }).unwrap();
    } catch (error) {
      console.error("Failed to archive:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const pinnedConversations = data?.conversations.filter((c) => c.pinned) || [];
  const recentConversations = data?.conversations.filter((c) => !c.pinned) || [];

  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center gap-3 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="shrink-0"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            className="shrink-0"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {status === "authenticated" && session?.user && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback className="bg-blue-500 text-white text-sm">
                      {session.user.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </PopoverTrigger>
              <PopoverContent side="right" className="w-64 p-0">
                <UserMenuContent
                  user={session.user}
                  onSettings={() => router.push("/app/settings")}
                  onSignOut={handleSignOut}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">Chats</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={handleNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>

        {status === "authenticated" && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {status === "loading" ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : status !== "authenticated" ? (
          <div className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">Welcome</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Sign in to save your conversations and access them from anywhere
              </p>
            </div>

            <div className="space-y-2">
              <Button
                variant="default"
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/login?callbackUrl=/gemma/chat")}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/register?callbackUrl=/gemma/chat")}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : data?.conversations.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <MessageSquare className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
            {!searchQuery && (
              <Button variant="outline" size="sm" onClick={handleNewChat}>
                <Plus className="h-4 w-4 mr-2" />
                Start chatting
              </Button>
            )}
          </div>
        ) : (
          <div className="py-2">
            {pinnedConversations.length > 0 && (
              <div className="mb-4">
                <h3 className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pinned
                </h3>
                <div>
                  {pinnedConversations.map((conv) => (
                    <ConversationRow
                      key={conv.id}
                      conversation={conv}
                      isActive={activeConversationId === conv.id}
                      onDelete={handleDelete}
                      onTogglePin={handleTogglePin}
                      onArchive={handleArchive}
                      onSelect={onSelectConversation}
                    />
                  ))}
                </div>
              </div>
            )}

            {recentConversations.length > 0 && (
              <div>
                {pinnedConversations.length > 0 && (
                  <h3 className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Recent
                  </h3>
                )}
                <div>
                  {recentConversations.map((conv) => (
                    <ConversationRow
                      key={conv.id}
                      conversation={conv}
                      isActive={activeConversationId === conv.id}
                      onDelete={handleDelete}
                      onTogglePin={handleTogglePin}
                      onArchive={handleArchive}
                      onSelect={onSelectConversation}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Menu at Bottom */}
      {status === "authenticated" && session?.user && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback className="bg-blue-500 text-white text-sm">
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {session.user.name || "User"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {session.user.email}
                  </p>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 p-0">
              <UserMenuContent
                user={session.user}
                onSettings={() => {
                  router.push("/app/settings");
                  setUserMenuOpen(false);
                }}
                onSignOut={handleSignOut}
                showArchived={showArchived}
                onToggleArchived={() => setShowArchived(!showArchived)}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

function ConversationRow({
  conversation,
  isActive,
  onDelete,
  onTogglePin,
  onArchive,
  onSelect,
}: {
  conversation: {
    id: string;
    title: string;
    pinned: boolean;
    updatedAt: string | Date;
    messages?: Array<{ content: string; createdAt: string | Date; role: string }>;
  };
  isActive?: boolean;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onArchive: (id: string) => void;
  onSelect?: (id: string) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors",
        isActive
          ? "bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800"
          : "hover:bg-slate-100 dark:hover:bg-slate-800"
      )}
      onClick={() => onSelect?.(conversation.id)}
    >
      <MessageSquare className="h-4 w-4 shrink-0 text-slate-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {conversation.title}
        </p>
        {conversation.messages?.[0] && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {formatDistanceToNow(new Date(conversation.updatedAt), {
              addSuffix: true,
            })}
          </p>
        )}
      </div>

      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(true);
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(conversation.id, conversation.pinned);
              setIsMenuOpen(false);
            }}
          >
            {conversation.pinned ? (
              <>
                <PinOff className="h-4 w-4 mr-2" />
                Unpin
              </>
            ) : (
              <>
                <Pin className="h-4 w-4 mr-2" />
                Pin
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(false);
            }}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onArchive(conversation.id);
              setIsMenuOpen(false);
            }}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 dark:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.id);
              setIsMenuOpen(false);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function UserMenuContent({
  user,
  onSettings,
  onSignOut,
  showArchived,
  onToggleArchived,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onSettings: () => void;
  onSignOut: () => void;
  showArchived?: boolean;
  onToggleArchived?: () => void;
}) {
  return (
    <div>
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback className="bg-blue-500 text-white">
              {user.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white truncate">
              {user.name || "User"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>
      <div className="p-1">
        <Button
          variant="ghost"
          className="w-full justify-start"
          size="sm"
          onClick={onSettings}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        {onToggleArchived && (
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
            onClick={onToggleArchived}
          >
            <Archive className="h-4 w-4 mr-2" />
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          size="sm"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
