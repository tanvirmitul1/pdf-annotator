export interface ChatAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  base64: string;
  preview: string;
  kind: "image" | "audio";
  ocrText?: string;
  ocrTraceId?: string;
  ocrCacheHit?: "redis" | "database" | null;
  /** Duration in seconds for audio files */
  duration?: number;
  file?: File; // Store original file for OCR
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  attachments?: ChatAttachment[];
}

export interface Artifact {
  identifier: string;
  title: string;
  type: string;
  content: string;
}

export interface PdfSection {
  heading?: string;
  body: string;
}

export interface PdfStructure {
  title?: string;
  author?: string;
  createdAt?: string;
  sections?: PdfSection[];
}

export interface DocStructure {
  title?: string;
  author?: string;
  createdAt?: string;
  sections?: PdfSection[]; // reuses same shape
}
