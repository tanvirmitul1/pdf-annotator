"use client";

import { useCallback, useState } from "react";
import type { ChatAttachment } from "../_lib/types";
import {
  fileToBase64,
  getAudioDuration,
  isImageFile,
  isAudioFile,
  MAX_IMAGE_SIZE,
  MAX_AUDIO_SIZE,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_AUDIO_TYPES,
} from "../_lib/image-utils";
import { ocrService, type OcrError } from "../_lib/ocr-service";

let nextId = 0;

export function useAttachments() {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [ocrLoading, setOcrLoading] = useState<Record<string, boolean>>({});
  const [ocrProgress, setOcrProgress] = useState<Record<string, string>>({});
  const [ocrErrors, setOcrErrors] = useState<Record<string, string>>({});

  const addFiles = useCallback(async (files: File[], autoOcr = true) => {
    const validFiles = files.filter((f) => {
      if (isImageFile(f)) {
        if (f.size > MAX_IMAGE_SIZE) return false;
        if (
          !ACCEPTED_IMAGE_TYPES.includes(
            f.type as (typeof ACCEPTED_IMAGE_TYPES)[number]
          )
        )
          return false;
        return true;
      }
      
      if (isAudioFile(f)) {
        if (f.size > MAX_AUDIO_SIZE) return false;
        if (
          !ACCEPTED_AUDIO_TYPES.includes(
            f.type as (typeof ACCEPTED_AUDIO_TYPES)[number]
          )
        )
          return false;
        return true;
      }
      return false;
    });

    const newAttachments = await Promise.all(
      validFiles.map(async (file) => {
        const base64 = await fileToBase64(file);
        const id = `attachment-${++nextId}`;
        const preview = URL.createObjectURL(file);
        const kind = isAudioFile(file) ? "audio" : "image";
        const duration =
          kind === "audio" ? await getAudioDuration(file) : undefined;
        return {
          id,
          fileName: file.name,
          mimeType: file.type,
          base64,
          preview,
          kind,
          duration,
          file, // Store original file for OCR
        } satisfies ChatAttachment & { file: File };
      })
    );

    setAttachments((prev) => [...prev, ...newAttachments]);

    // Auto-run OCR on images
    if (autoOcr) {
      for (const attachment of newAttachments) {
        if (attachment.kind === "image") {
          runOcrOnAttachment(attachment.id, attachment.file);
        }
      }
    }
  }, []);

  const removeAttachment = useCallback((id: string) => {
    // Cancel OCR if running
    if (ocrLoading[id]) {
      ocrService.cancel();
    }
    
    setAttachments((prev) => {
      const removed = prev.find((a) => a.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((a) => a.id !== id);
    });
    
    // Clean up loading/progress/error states
    setOcrLoading((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setOcrProgress((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setOcrErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [ocrLoading]);

  const runOcrOnAttachment = useCallback(async (id: string, file?: File) => {
    setOcrLoading((prev) => ({ ...prev, [id]: true }));
    setOcrProgress((prev) => ({ ...prev, [id]: "Starting..." }));
    setOcrErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      let targetFile = file;
      
      if (!targetFile) {
        const attachment = await new Promise<(ChatAttachment & { file?: File }) | undefined>(
          (resolve) => {
            setAttachments((prev) => {
              resolve(prev.find((a) => a.id === id) as (ChatAttachment & { file?: File }) | undefined);
              return prev;
            });
          }
        );
        
        if (!attachment?.file) {
          throw new Error("File not found");
        }
        targetFile = attachment.file;
      }

      const result = await ocrService.processImage(targetFile, (status) => {
        setOcrProgress((prev) => ({ ...prev, [id]: status }));
      });

      setAttachments((prev) =>
        prev.map((a) => 
          a.id === id 
            ? { 
                ...a, 
                ocrText: result.text,
                ocrTraceId: result.traceId,
                ocrCacheHit: result.cacheHit,
              } 
            : a
        )
      );
      
      setOcrProgress((prev) => ({ ...prev, [id]: "Processing complete!" }));
      
      // Clear progress after 2 seconds
      setTimeout(() => {
        setOcrProgress((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 2000);
    } catch (error) {
      const ocrError = error as OcrError;
      const errorMessage = ocrError.message || "Processing failed. Please try again.";
      
      setOcrErrors((prev) => ({ ...prev, [id]: errorMessage }));
      console.error("OCR Error:", ocrError);
    } finally {
      setOcrLoading((prev) => ({ ...prev, [id]: false }));
    }
  }, []);

  const retryOcr = useCallback((id: string) => {
    const attachment = attachments.find((a) => a.id === id) as ChatAttachment & { file?: File };
    if (attachment?.file) {
      runOcrOnAttachment(id, attachment.file);
    }
  }, [attachments, runOcrOnAttachment]);

  const cancelOcr = useCallback((id: string) => {
    ocrService.cancel();
    setOcrLoading((prev) => ({ ...prev, [id]: false }));
    setOcrProgress((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearAttachments = useCallback(() => {
    // Cancel any ongoing OCR
    ocrService.cancel();
    
    setAttachments((prev) => {
      for (const a of prev) URL.revokeObjectURL(a.preview);
      return [];
    });
    setOcrLoading({});
    setOcrProgress({});
    setOcrErrors({});
  }, []);

  const hasOcrPendingOrFailed = useCallback(() => {
    return attachments.some(att => {
      if (att.kind !== "image") return false;
      const isLoading = ocrLoading[att.id];
      const hasError = !!ocrErrors[att.id];
      const hasText = !!att.ocrText;
      return isLoading || hasError || !hasText;
    });
  }, [attachments, ocrLoading, ocrErrors]);

  return {
    attachments,
    ocrLoading,
    ocrProgress,
    ocrErrors,
    addFiles,
    removeAttachment,
    runOcrOnAttachment,
    retryOcr,
    cancelOcr,
    clearAttachments,
    hasOcrPendingOrFailed,
  } as const;
}
