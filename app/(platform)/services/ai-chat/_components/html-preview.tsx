"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HtmlPreviewProps {
  html: string;
  className?: string;
}

export function HtmlPreview({ html, className }: HtmlPreviewProps) {
  const [error, setError] = useState<string | null>(null);

  // Extract CSS from HTML if present
  const extractStyles = (htmlContent: string): { html: string; css: string } => {
    const styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    let css = "";
    let cleanHtml = htmlContent;

    if (styleMatch) {
      styleMatch.forEach((styleTag) => {
        const content = styleTag.replace(/<\/?style[^>]*>/gi, "");
        css += content;
        cleanHtml = cleanHtml.replace(styleTag, "");
      });
    }

    return { html: cleanHtml, css };
  };

  const { html: cleanHtml, css } = extractStyles(html);

  // Create full document with base styles
  const frameContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    ${css}
  </style>
</head>
<body>
  ${cleanHtml}
</body>
</html>
  `;

  return (
    <div className={cn("relative h-full bg-white rounded-lg overflow-hidden", className)}>
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <iframe
        srcDoc={frameContent}
        sandbox="allow-scripts"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "white",
        }}
        onError={() => setError("Preview error occurred")}
      />
    </div>
  );
}
