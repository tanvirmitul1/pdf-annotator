import type { Artifact } from "../types";
import { MIME_TYPES, TYPE_TO_EXTENSION } from "../constants";
import { generatePdf } from "./pdf-generator";
import { generateDocx } from "./docx-generator";

function getExtension(title: string): string {
  const parts = title.split(".");
  if (parts.length > 1) return parts.pop()!.toLowerCase();
  return "";
}

function getMimeType(type: string, title: string): string {
  const ext = getExtension(title);
  return MIME_TYPES[ext] ?? MIME_TYPES[type] ?? "text/plain;charset=utf-8";
}

/** Ensure the filename has a proper extension based on artifact type */
function ensureExtension(title: string, type: string): string {
  const ext = getExtension(title);
  if (ext) return title; // already has an extension

  const mapped = TYPE_TO_EXTENSION[type.toLowerCase()];
  if (mapped) return `${title}.${mapped}`;
  return `${title}.txt`; // fallback
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadArtifact(artifact: Artifact): Promise<void> {
  const ext = getExtension(artifact.title);
  const isPdf = artifact.type === "pdf" || ext === "pdf";
  const isDocx =
    artifact.type === "docx" ||
    artifact.type === "doc" ||
    ext === "docx" ||
    ext === "doc";

  const filename = ensureExtension(artifact.title, artifact.type);
  let blob: Blob;

  if (isPdf) {
    const pdfBytes = await generatePdf(artifact.content);
    blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
      type: "application/pdf",
    });
  } else if (isDocx) {
    blob = generateDocx(artifact.content);
    triggerDownload(blob, filename.replace(/\.docx$/i, ".doc"));
    return;
  } else {
    const mime = getMimeType(artifact.type, artifact.title);
    blob = new Blob([artifact.content], { type: mime });
  }

  triggerDownload(blob, filename);
}

/**
 * Formats artifact content for display in the viewer panel.
 * For PDFs and DOCX, converts structured JSON to readable text.
 * For everything else, returns the raw content.
 */
export function getDisplayContent(artifact: Artifact): string {
  const ext = getExtension(artifact.title);
  const isStructured =
    artifact.type === "pdf" ||
    artifact.type === "docx" ||
    artifact.type === "doc" ||
    ext === "pdf" ||
    ext === "docx" ||
    ext === "doc";

  if (!isStructured) return artifact.content;

  try {
    const parsed = JSON.parse(artifact.content) as {
      title?: string;
      author?: string;
      createdAt?: string;
      sections?: { heading?: string; body?: string }[];
    };
    const parts: string[] = [];
    if (parsed.title) parts.push(`# ${parsed.title}\n`);
    if (parsed.author || parsed.createdAt) {
      parts.push(
        [parsed.author, parsed.createdAt].filter(Boolean).join(" — ") + "\n"
      );
    }
    if (parsed.sections) {
      for (const s of parsed.sections) {
        if (s.heading) parts.push(`\n## ${s.heading}\n`);
        if (s.body) parts.push(s.body);
      }
    }
    return parts.join("\n");
  } catch {
    return artifact.content;
  }
}
