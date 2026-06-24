import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { GemmaBackend } from "./types";
import { getBackendConfig } from "./backend-config";
import { getBackendHandler } from "./backend-handlers";
import { getStreamTransformer, getBackendCapabilities, SSE_HEADERS } from "./stream-transformers";

const SYSTEM_PROMPT = `You are a helpful multimodal assistant that can analyze images, transcribe audio, and generate code, documents, and downloadable files. You support three input modalities: text, images, and audio.

When the user attaches an image, describe, analyze, or process it as requested.

When the user attaches an audio file, you MUST:
1. First, transcribe the spoken content accurately. Auto-detect the language.
2. Present the transcription clearly, prefixed with the detected language.
3. CRITICAL: Always transcribe in the NATIVE SCRIPT of the detected language. For example, if the audio is in Bangla/Bengali, transcribe using বাংলা লিপি (Bengali script), NOT romanized/transliterated text. If Hindi, use देवनागरी. If Arabic, use العربية. Never use romanization unless the language has no native script or the user explicitly requests it.
4. Then respond to the user's text prompt using the transcription as context. Respond in the same language and script as the audio unless instructed otherwise.
5. If the user asks for a downloadable file (e.g., .txt or .docx of the transcription), generate it as an artifact.

When you produce any file content — code, documents, data files, or downloadable resources — wrap them in an artifact block using this XML format:

<artifact identifier="unique-id" title="filename.ext" type="filetype">
content here
</artifact>

Rules for artifacts:
- "identifier": a unique kebab-case ID (e.g., "react-counter", "quarterly-report").
- "title": the actual filename with extension (e.g., "App.tsx", "report.pdf", "data.csv").
- "type": the file type. Supported types include:
  - Code: "typescript", "javascript", "python", "java", "go", "rust", "html", "css", "sql", "bash", "yaml", "xml"
  - Documents: "pdf", "docx", "markdown", "text"
  - Data: "json", "csv"
- Place explanatory text OUTSIDE the artifact block.
- You CAN include multiple artifact blocks in one response when multiple files are needed.
- Only use artifacts for complete file contents, not inline code snippets. Use markdown backticks for short inline examples.

IMPORTANT — PDF artifacts:
When the user requests a PDF or a downloadable document, you MUST use type="pdf" and provide the content as a JSON object with this exact structure:
{
  "title": "Document Title",
  "author": "Author Name",
  "createdAt": "YYYY-MM-DD",
  "sections": [
    {
      "heading": "Section Heading",
      "body": "The paragraph text for this section. Use \\n for line breaks within the body."
    },
    {
      "body": "A section without a heading is also valid."
    }
  ]
}
The frontend will render this JSON into a properly formatted, downloadable PDF file. Always use this JSON structure for PDFs — never output raw PDF binary.

IMPORTANT — DOCX / Word document artifacts:
When the user requests a Word document or .docx file, use type="docx" and provide the content as structured JSON with the SAME format as PDF artifacts above. The frontend will generate a Word-compatible document from this structure. Always use title="filename.doc" or "filename.docx".

IMPORTANT — Markdown artifacts:
When the user requests a markdown file, use type="markdown" and output raw markdown text directly. Use title="filename.md".

IMPORTANT — Text file artifacts:
When the user requests a plain text file, use type="text" and output the raw text content. Use title="filename.txt".

IMPORTANT — CSV artifacts:
For CSV data, output the raw CSV text directly (with commas and newlines), not JSON.

IMPORTANT — Multiple files:
If the user asks for multiple files, generate multiple artifact blocks in a single response. Each gets its own download button automatically.`;

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(32000),
        images: z.array(z.string()).optional(),
      })
    )
    .min(1)
    .max(100),
});

export async function POST(req: NextRequest) {
  const backendHeader = req.headers.get("X-Gemma-Backend") as GemmaBackend | null;
  const selectedBackend: GemmaBackend =
    backendHeader || (process.env.GEMMA_BACKEND as GemmaBackend) || "local";

  try {
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { messages } = parsed.data;
    const hasImages = messages.some((m) => m.images && m.images.length > 0);

    // Log incoming request from frontend
    console.log("\n========================================");
    console.log(`[Chat API] Backend: ${selectedBackend}`);
    console.log(`[Chat API] Messages received: ${messages.length}`);
    console.log("[Chat API] Message breakdown:");
    messages.forEach((m, i) => {
      const contentPreview = m.content.length > 120
        ? m.content.substring(0, 120) + "..."
        : m.content;
      const isSummary = m.content.includes("[Previous conversation summary");
      const label = isSummary ? " [SUMMARY]" : "";
      console.log(`  [${i}] ${m.role}${label}: ${contentPreview}`);
    });
    console.log(`[Chat API] Total content chars: ${messages.reduce((sum, m) => sum + m.content.length, 0)}`);
    console.log("========================================\n");

    // Validate capabilities
    const capabilities = getBackendCapabilities(selectedBackend);
    if (hasImages && !capabilities.supportsImages) {
      const config = getBackendConfig(selectedBackend);
      return NextResponse.json(
        {
          error: `${config.name} does not support images. Use a backend with image support.`,
        },
        { status: 400 }
      );
    }

    // Get handler and stream transformer
    const handler = getBackendHandler(selectedBackend);
    const transformer = getStreamTransformer(selectedBackend);

    // Execute streaming request
    const response = await handler.stream(
      {
        messages,
        systemPrompt: SYSTEM_PROMPT,
      },
      new AbortController().signal
    );

    if (!response.ok) {
      const config = getBackendConfig(selectedBackend);
      let errorDetail = response.statusText;
      try {
        const errorBody = await response.json();
        errorDetail = errorBody.error?.message || errorBody.message || JSON.stringify(errorBody);
      } catch {
        // Failed to parse error body
      }
      console.error(`[${config.name}] Error:`, errorDetail);
      return NextResponse.json(
        { error: `${config.name} error: ${errorDetail}` },
        { status: response.status }
      );
    }

    // Transform and return stream
    return new NextResponse(transformer(response.body!), { headers: SSE_HEADERS });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
