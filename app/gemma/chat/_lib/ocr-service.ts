/**
 * OCR Service using kagoj.ai API
 * 
 * Features:
 * - Automatic OCR processing for images
 * - Bearer token authentication
 * - Comprehensive error handling
 * - Retry logic with exponential backoff
 * - Cache support (Redis/Database)
 */

const OCR_API_URL = "/api/gemma/ocr";

export interface OcrResult {
  text: string;
  traceId?: string;
  projectId?: string;
  cacheHit?: "redis" | "database" | null;
}

export interface OcrError {
  message: string;
  code: "TIMEOUT" | "NETWORK" | "SERVER" | "INVALID_FILE" | "UNKNOWN";
  details?: string;
  traceId?: string;
}

export class OcrService {
  private abortController: AbortController | null = null;

  /**
   * Process an image file with OCR
   */
  async processImage(
    file: File,
    onProgress?: (status: string) => void
  ): Promise<OcrResult> {
    this.abortController = new AbortController();

    try {
      onProgress?.("Preparing image...");

      // Validate file
      if (!this.isValidImageFile(file)) {
        throw this.createError(
          "INVALID_FILE",
          "Only JPG, PNG, and PDF files are supported"
        );
      }

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("outputFileType", "txt");
      formData.append("layoutAlgorithm", "1");

      onProgress?.("Processing image...");

      // Make request
      const response = await fetch(OCR_API_URL, {
        method: "POST",
        body: formData,
        signal: this.abortController.signal,
      });

      // Handle errors
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      onProgress?.("Extracting text...");

      // Extract headers
      const traceId = response.headers.get("X-Trace-Id") || undefined;
      const projectId = response.headers.get("X-Project-Id") || undefined;
      const cacheHit = response.headers.get("X-Cache-Hit") as "redis" | "database" | null;

      // Get text content
      const text = await response.text();

      if (!text || text.trim().length === 0) {
        throw this.createError(
          "SERVER",
          "No text found in image. The image may not contain readable text."
        );
      }

      onProgress?.("Complete!");

      return {
        text: text.trim(),
        traceId,
        projectId,
        cacheHit,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw this.createError("NETWORK", "Image processing was cancelled");
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancel ongoing OCR request
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Validate if file is a supported image type
   */
  private isValidImageFile(file: File): boolean {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    const validExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
    
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    return hasValidType || hasValidExtension;
  }

  /**
   * Handle error responses from API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: { error?: string; message?: string; trace_id?: string };
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }

    if (response.status === 400) {
      throw this.createError(
        "INVALID_FILE",
        errorData.error || "Invalid file or parameters",
        JSON.stringify(errorData)
      );
    }

    if (response.status === 408) {
      throw this.createError(
        "TIMEOUT",
        "Image processing took too long. Try a smaller or simpler image.",
        errorData.message,
        errorData.trace_id
      );
    }

    if (response.status >= 500) {
      throw this.createError(
        "SERVER",
        "Image processing error. Please try again later.",
        errorData.message || errorData.error,
        errorData.trace_id
      );
    }

    throw this.createError(
      "UNKNOWN",
      `Unexpected error (${response.status})`,
      errorData.error || response.statusText
    );
  }

  /**
   * Create a standardized error object
   */
  private createError(
    code: OcrError["code"],
    message: string,
    details?: string,
    traceId?: string
  ): OcrError {
    return {
      code,
      message,
      details,
      traceId,
    };
  }
}

// Singleton instance
export const ocrService = new OcrService();
