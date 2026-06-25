import {
  FileCode2,
  FileText,
  FileSpreadsheet,
  FileJson,
  File,
  FileType,
  FileImage,
} from "lucide-react";
import { CODE_TYPES } from "./constants";

type IconComponent = typeof File;

export function getArtifactIcon(type: string, title: string): IconComponent {
  const ext = title.split(".").pop()?.toLowerCase();

  if (type === "pdf" || ext === "pdf") return FileText;
  if (type === "docx" || type === "doc" || ext === "docx" || ext === "doc")
    return FileType;
  if (
    type === "csv" ||
    type === "tsv" ||
    ext === "csv" ||
    ext === "tsv" ||
    ext === "xlsx"
  )
    return FileSpreadsheet;
  if (type === "json" || ext === "json") return FileJson;
  if (type === "svg" || ext === "svg") return FileImage;
  if (
    type === "text" ||
    type === "markdown" ||
    type === "md" ||
    type === "latex" ||
    type === "tex" ||
    ext === "txt" ||
    ext === "md" ||
    ext === "tex" ||
    ext === "rtf"
  )
    return FileText;
  if ((CODE_TYPES as readonly string[]).includes(type)) return FileCode2;

  // Check by extension for code files
  const codeExts = [
    "ts",
    "tsx",
    "js",
    "jsx",
    "py",
    "java",
    "go",
    "rs",
    "rb",
    "php",
    "swift",
    "kt",
    "scala",
    "lua",
    "r",
    "m",
    "sh",
    "ps1",
    "bat",
    "sql",
    "graphql",
    "gql",
    "c",
    "cpp",
    "h",
    "hpp",
    "cs",
  ];
  if (ext && codeExts.includes(ext)) return FileCode2;

  return File;
}
