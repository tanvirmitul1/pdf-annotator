"use client";

import { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-xml-doc";
import { cn } from "@/lib/utils";

interface CodeHighlightProps {
  code: string;
  language: string;
  className?: string;
}

const LANGUAGE_MAP: Record<string, string> = {
  typescript: "typescript",
  ts: "typescript",
  tsx: "tsx",
  javascript: "javascript",
  js: "javascript",
  jsx: "jsx",
  python: "python",
  py: "python",
  java: "java",
  go: "go",
  rust: "rust",
  rs: "rust",
  sql: "sql",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  markdown: "markdown",
  md: "markdown",
  html: "markup",
  xml: "markup",
  css: "css",
  scss: "scss",
  text: "text",
  txt: "text",
};

export function CodeHighlight({ code, language, className }: CodeHighlightProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const prismLang = LANGUAGE_MAP[language.toLowerCase()] || "text";

  return (
    <pre className={cn("!bg-[#1d1f21] !p-4 !m-0 rounded-lg overflow-auto", className)}>
      <code ref={codeRef} className={`language-${prismLang}`}>
        {code}
      </code>
    </pre>
  );
}
