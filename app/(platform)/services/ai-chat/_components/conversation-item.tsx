"use client";

import { useState, useCallback } from "react";
import {
  MessageSquare,
  Pin,
  Archive,
  Trash2,
  Edit2,
  Copy,
  MoreVertical,
  Loader2,
  PinOff,
  ArchiveRestore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Conversation } from "../_store/conversations-api";
import {
  useUpdateConversationMutation,
  useDeleteConversationMutation,
  useDuplicateConversationMutation,
} from "../_store/conversations-api";
import { formatDistanceToNow } from "date-fns";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState(conversation.title);

  const [updateConversation, { isLoading: isUpdating }] =
    useUpdateConversationMutation();
  const [deleteConversation, { isLoading: isDeleting }] =
    useDeleteConversationMutation();
  const [duplicateConversation, { isLoading: isDuplicating }] =
    useDuplicateConversationMutation();

  const handlePin = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await updateConversation({
          id: conversation.id,
          updates: { pinned: !conversation.pinned },
        }).unwrap();
      } catch (error) {
        console.error("Failed to pin conversation:", error);
      }
    },
    [conversation.id, conversation.pinned, updateConversation]
  );

  const handleArchive = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await updateConversation({
          id: conversation.id,
          updates: { archived: !conversation.archived },
        }).unwrap();
      } catch (error) {
        console.error("Failed to archive conversation:", error);
      }
    },
    [conversation.id, conversation.archived, updateConversation]
  );

  const handleDelete = useCallback(async () => {
    try {
      await deleteConversation(conversation.id).unwrap();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  }, [conversation.id, deleteConversation]);

  const handleRename = useCallback(async () => {
    if (!renameValue.trim()) return;
    
    try {
      await updateConversation({
        id: conversation.id,
        updates: { title: renameValue },
      }).unwrap();
      setShowRenameDialog(false);
    } catch (error) {
      console.error("Failed to rename conversation:", error);
    }
  }, [conversation.id, renameValue, updateConversation]);

  const handleDuplicate = useCallback(async () => {
    try {
      await duplicateConversation(conversation.id).unwrap();
    } catch (error) {
      console.error("Failed to duplicate conversation:", error);
    }
  }, [conversation.id, duplicateConversation]);

  const lastMessage = conversation.messages?.[0];
  const messageCount = conversation._count?.messages || 0;
  const timeAgo = lastMessage
    ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })
    : formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true });

  return (
    <>
      <button
        onClick={onClick}
        className={cn(
          "group w-full px-3 py-2.5 flex items-start gap-3 rounded-lg transition-all duration-200",
          "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive && "bg-muted"
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "shrink-0 size-8 rounded-lg flex items-center justify-center mt-0.5 transition-all",
            isActive
              ? "gemma-gradient"
              : "bg-muted/50 group-hover:bg-muted"
          )}
        >
          <MessageSquare
            className={cn(
              "size-4 transition-colors",
              isActive ? "text-white" : "text-muted-foreground"
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className={cn(
                "text-sm font-medium truncate transition-colors",
                isActive ? "text-foreground" : "text-foreground/90"
              )}
            >
              {conversation.title}
            </h3>
            
            {conversation.pinned && (
              <Pin className="size-3 text-primary shrink-0 mt-0.5" />
            )}
          </div>

          {lastMessage && (
            <p className="text-xs text-muted-foreground truncate mb-1">
              {lastMessage.content.slice(0, 60)}
              {lastMessage.content.length > 60 ? "..." : ""}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{messageCount} message{messageCount !== 1 ? "s" : ""}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Actions */}
        <div
          className={cn(
            "shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isActive && "opacity-100"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-6 hover:bg-muted"
                disabled={isUpdating || isDeleting || isDuplicating}
              >
                {isUpdating || isDeleting || isDuplicating ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <MoreVertical className="size-3" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowRenameDialog(true); }}>
                <Edit2 className="size-4 mr-2" />
                Rename
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handlePin}>
                {conversation.pinned ? (
                  <>
                    <PinOff className="size-4 mr-2" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="size-4 mr-2" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}>
                <Copy className="size-4 mr-2" />
                Duplicate
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleArchive}>
                {conversation.archived ? (
                  <>
                    <ArchiveRestore className="size-4 mr-2" />
                    Restore
                  </>
                ) : (
                  <>
                    <Archive className="size-4 mr-2" />
                    Archive
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </button>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{conversation.title}&quot; and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
            <DialogDescription>
              Give your conversation a memorable name
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleRename();
              }
            }}
            placeholder="Conversation name"
            className="mt-2"
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!renameValue.trim() || isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
