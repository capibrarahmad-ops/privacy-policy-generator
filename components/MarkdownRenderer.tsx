"use client";

import React, { useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  stripFirstHeading?: boolean;
}

/**
 * Validates URLs against an allowlist of safe protocols (http, https, mailto, relative anchor).
 * Disallows javascript:, data:, vbscript:, etc. to prevent XSS.
 */
function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://") || trimmed.startsWith("mailto:") || trimmed.startsWith("#")) {
    return true;
  }
  return false;
}

/**
 * Safely parses inline markdown formatting:
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Code: `code`
 * - Links: [label](url)
 * - Raw URLs: https://...
 */
function renderInlineText(text: string): React.ReactNode[] {
  if (!text) return [];

  const elements: React.ReactNode[] = [];
  // Tokenize by code, bold, italic, and links
  // Pattern matches:
  // 1: `code`
  // 2: **bold** or __bold__
  // 3: *italic* or _italic_
  // 4: [label](url)
  // 5: bare URL (https?://\S+)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s<)]+)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Add text preceding the token
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    // Inline Code: `code`
    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      elements.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono bg-slate-100 text-slate-800 border border-slate-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    // Bold: **text** or __text__
    else if ((token.startsWith("**") && token.endsWith("**") && token.length > 4) ||
             (token.startsWith("__") && token.endsWith("__") && token.length > 4)) {
      elements.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Italic: *text* or _text_
    else if ((token.startsWith("*") && token.endsWith("*") && token.length > 2) ||
             (token.startsWith("_") && token.endsWith("_") && token.length > 2)) {
      elements.push(
        <em key={`italic-${match.index}`} className="italic text-slate-800">
          {token.slice(1, -1)}
        </em>
      );
    }
    // Link: [label](url)
    else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const rawUrl = linkMatch[2].trim();
        if (isSafeUrl(rawUrl)) {
          elements.push(
            <a
              key={`link-${match.index}`}
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline font-medium break-all"
            >
              {label}
            </a>
          );
        } else {
          // If unsafe protocol, render plain text safely
          elements.push(label);
        }
      } else {
        elements.push(token);
      }
    }
    // Bare URL: https://...
    else if (token.startsWith("http://") || token.startsWith("https://")) {
      if (isSafeUrl(token)) {
        elements.push(
          <a
            key={`url-${match.index}`}
            href={token}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline font-medium break-all"
          >
            {token}
          </a>
        );
      } else {
        elements.push(token);
      }
    } else {
      elements.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

interface BlockToken {
  type: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "ul" | "ol" | "blockquote" | "codeblock" | "hr" | "table";
  content?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
}

/**
 * Parses markdown text into structured block tokens
 */
function parseBlocks(markdown: string): BlockToken[] {
  if (!markdown) return [];

  const rawBlocks = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split(/\n\s*\n+/);
  const tokens: BlockToken[] = [];

  for (const rawBlock of rawBlocks) {
    const trimmed = rawBlock.trim();
    if (!trimmed) continue;

    // Horizontal Rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      tokens.push({ type: "hr" });
      continue;
    }

    // Code Block ```
    if (trimmed.startsWith("```")) {
      const codeLines = trimmed.split("\n");
      const codeContent = codeLines.slice(1, codeLines[codeLines.length - 1].startsWith("```") ? -1 : undefined).join("\n");
      tokens.push({ type: "codeblock", content: codeContent });
      continue;
    }

    // Blockquote >
    if (trimmed.startsWith(">")) {
      const quoteContent = trimmed
        .split("\n")
        .map((l) => l.replace(/^>\s?/, ""))
        .join(" ");
      tokens.push({ type: "blockquote", content: quoteContent });
      continue;
    }

    // Headings # .. ######
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      tokens.push({
        type: `h${level}` as any,
        content: headingMatch[2].trim(),
      });
      continue;
    }

    // Unordered List
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      const lines = trimmed.split("\n");
      let currentItem = "";

      for (const line of lines) {
        const itemMatch = line.match(/^[-*+]\s+(.+)$/);
        if (itemMatch) {
          if (currentItem) items.push(currentItem);
          currentItem = itemMatch[1];
        } else if (/^\s{2,}/.test(line) && currentItem) {
          currentItem += " " + line.trim();
        } else if (currentItem) {
          currentItem += " " + line.trim();
        }
      }
      if (currentItem) items.push(currentItem);

      tokens.push({ type: "ul", items });
      continue;
    }

    // Ordered List
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      const lines = trimmed.split("\n");
      let currentItem = "";

      for (const line of lines) {
        const itemMatch = line.match(/^\d+\.\s+(.+)$/);
        if (itemMatch) {
          if (currentItem) items.push(currentItem);
          currentItem = itemMatch[1];
        } else if (/^\s{2,}/.test(line) && currentItem) {
          currentItem += " " + line.trim();
        } else if (currentItem) {
          currentItem += " " + line.trim();
        }
      }
      if (currentItem) items.push(currentItem);

      tokens.push({ type: "ol", items });
      continue;
    }

    // Table
    if (trimmed.includes("|") && trimmed.includes("\n")) {
      const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 2 && lines[1].includes("---")) {
        const headers = lines[0]
          .split("|")
          .map((c) => c.trim())
          .filter((c, idx, arr) => idx !== 0 && idx !== arr.length - 1);
        const rows = lines.slice(2).map((line) =>
          line
            .split("|")
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx !== 0 && idx !== arr.length - 1)
        );
        tokens.push({ type: "table", headers, rows });
        continue;
      }
    }

    // Regular Paragraph
    // Normalize soft line breaks to space
    const pContent = trimmed
      .split("\n")
      .map((l) => l.trim())
      .join(" ");
    tokens.push({ type: "p", content: pContent });
  }

  return tokens;
}

export function MarkdownRenderer({
  content,
  className = "",
  stripFirstHeading = false,
}: MarkdownRendererProps) {
  const blocks = useMemo(() => {
    const rawBlocks = parseBlocks(content);
    if (stripFirstHeading && rawBlocks.length > 0 && rawBlocks[0].type === "h1") {
      return rawBlocks.slice(1);
    }
    return rawBlocks;
  }, [content, stripFirstHeading]);

  if (!content || !content.trim()) {
    return (
      <div className="py-8 text-center text-slate-400 italic text-sm">
        No document content to display.
      </div>
    );
  }

  return (
    <div className={`space-y-6 text-slate-800 leading-relaxed font-sans ${className}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h1":
            return (
              <h1
                key={index}
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight pt-4 pb-2 border-b border-slate-200"
              >
                {renderInlineText(block.content || "")}
              </h1>
            );
          case "h2":
            return (
              <h2
                key={index}
                className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight pt-4 pb-1 border-b border-slate-100"
              >
                {renderInlineText(block.content || "")}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={index}
                className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight pt-2"
              >
                {renderInlineText(block.content || "")}
              </h3>
            );
          case "h4":
          case "h5":
          case "h6":
            return (
              <h4
                key={index}
                className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight"
              >
                {renderInlineText(block.content || "")}
              </h4>
            );
          case "p":
            return (
              <p key={index} className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {renderInlineText(block.content || "")}
              </p>
            );
          case "ul":
            return (
              <ul key={index} className="list-disc pl-6 space-y-2 text-sm sm:text-base text-slate-700">
                {(block.items || []).map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed">
                    {renderInlineText(item)}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={index} className="list-decimal pl-6 space-y-2 text-sm sm:text-base text-slate-700">
                {(block.items || []).map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed">
                    {renderInlineText(item)}
                  </li>
                ))}
              </ol>
            );
          case "blockquote":
            return (
              <blockquote
                key={index}
                className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-50 rounded-r-lg text-slate-700 italic text-sm sm:text-base my-4"
              >
                {renderInlineText(block.content || "")}
              </blockquote>
            );
          case "codeblock":
            return (
              <pre
                key={index}
                className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-xs sm:text-sm font-mono shadow-inner my-4"
              >
                <code>{block.content}</code>
              </pre>
            );
          case "hr":
            return <hr key={index} className="border-t border-slate-200 my-8" />;
          case "table":
            return (
              <div key={index} className="overflow-x-auto my-4 rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 font-semibold text-slate-800">
                    <tr>
                      {(block.headers || []).map((h, hIdx) => (
                        <th key={hIdx} className="px-4 py-3">
                          {renderInlineText(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {(block.rows || []).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-4 py-2.5 text-slate-700">
                            {renderInlineText(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
