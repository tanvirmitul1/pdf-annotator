import { ARTIFACT_REGEX } from "./constants";
import type { Artifact } from "./types";

export function parseArtifacts(text: string): Artifact[] {
  const artifacts: Artifact[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(ARTIFACT_REGEX.source, ARTIFACT_REGEX.flags);
  while ((match = regex.exec(text)) !== null) {
    artifacts.push({
      identifier: match[1],
      title: match[2],
      type: match[3],
      content: match[4],
    });
  }
  return artifacts;
}

export function stripArtifacts(text: string): string {
  return text.replace(ARTIFACT_REGEX, "").trim();
}
