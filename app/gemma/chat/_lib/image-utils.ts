export const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
] as const;

export const ACCEPTED_AUDIO_TYPES = [
  "audio/wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
] as const;

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/");
}

/**
 * Reads a File and returns the raw base64 string (no data: prefix).
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:<mime>;base64," prefix
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Failed to read file as base64"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Get audio duration in seconds from a File */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
  });
}
