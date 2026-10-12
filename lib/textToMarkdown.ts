/**
 * Professional Text-to-Markdown Transformer
 *
 * Transforms user-provided privacy policy text into clean, structured Markdown (.md)
 * with a professional document structure, consistent headings, subheadings,
 * numbered sections, bullet lists, paragraphs, and spacing.
 *
 * Strict Rules:
 * - NO AI rewriting, summarizing, or paraphrasing.
 * - Transformation focuses strictly on formatting and document structure.
 * - Preserves the user's original wording, meaning, legal statements, contact details, dates, and factual information.
 * - Does not invent missing information, add legal claims, or modify clauses.
 * - Detects existing headings and lists where possible; formats unstructured text conservatively.
 */

export interface MarkdownConversionResult {
  markdown: string;
  title: string;
  characterCount: number;
  wordCount: number;
}

/**
 * Normalizes line endings to \n
 */
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Checks if a line is already a Markdown heading (# ... ######)
 */
function isExistingMarkdownHeading(line: string): boolean {
  return /^#{1,6}\s+\S+/.test(line.trim());
}

/**
 * Known common privacy policy section headings (case-insensitive)
 */
const COMMON_POLICY_SECTIONS = new Set([
  "introduction",
  "overview",
  "scope",
  "definitions",
  "information we collect",
  "information you provide",
  "information collected automatically",
  "personal data we collect",
  "personal information we collect",
  "how we collect information",
  "how we use your information",
  "how we use your data",
  "use of information",
  "use of your personal data",
  "purposes of processing",
  "legal basis for processing",
  "legal grounds",
  "disclosure of information",
  "sharing your information",
  "how we share your information",
  "data sharing",
  "third-party service providers",
  "third-party services",
  "cookies and tracking technologies",
  "cookies and tracking",
  "cookie policy",
  "analytics and advertising",
  "data retention",
  "retention of your personal data",
  "how long we keep your data",
  "data security",
  "security of your information",
  "security of your personal data",
  "data protection",
  "your rights",
  "your privacy rights",
  "your data protection rights",
  "your choices",
  "opt-out rights",
  "user choices",
  "international data transfers",
  "international transfers",
  "transfer of your personal data",
  "children's privacy",
  "children's personal information",
  "privacy of minors",
  "california privacy rights",
  "gdpr compliance",
  "changes to this policy",
  "changes to this privacy policy",
  "updates to this policy",
  "updates to this privacy policy",
  "contact us",
  "contact information",
  "how to contact us",
  "questions and complaints",
]);

/**
 * Checks if a string looks like an all-caps heading (e.g. "INFORMATION WE COLLECT")
 */
function isAllCapsHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 90) return false;
  if (/[.;!?]$/.test(trimmed)) return false;

  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 3) return false;

  const upper = trimmed.replace(/[^A-Z]/g, "");
  return upper.length / letters.length >= 0.85;
}

/**
 * Checks if a line is a numbered/lettered section header
 */
function isSectionHeader(line: string): { isHeader: boolean; level: number } {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 90) {
    return { isHeader: false, level: 2 };
  }

  // Check lines ending with punctuation
  if (/[.;!?]$/.test(trimmed)) {
    // Exception: heading ending with colon (e.g. "Contact Us:"), but NOT introductory clause like "We use your info to:"
    if (trimmed.endsWith(":")) {
      // Reject sentences starting with pronouns or prepositions
      if (/^(we|you|our|they|this|please|if|when|for|such|as|in|note|by)\b/i.test(trimmed)) {
        return { isHeader: false, level: 2 };
      }
      if (trimmed.length < 50 && /^[A-Z]/.test(trimmed)) {
        return { isHeader: true, level: 3 };
      }
    }
    return { isHeader: false, level: 2 };
  }

  // Document Title / Header (Level 1)
  if (
    /^(privacy\s+policy|privacy\s+notice|privacy\s+statement)/i.test(trimmed) ||
    /^(privacy\s+policy\s+for\s+.+)/i.test(trimmed) ||
    /^(.+\s+privacy\s+policy)$/i.test(trimmed)
  ) {
    return { isHeader: true, level: 1 };
  }

  // Sub-sub-section e.g. 1.1.1 Overview
  if (/^\d+\.\d+\.\d+\s+[A-Za-z]/.test(trimmed)) {
    return { isHeader: true, level: 4 };
  }

  // Sub-section e.g. 1.1 or 2.3 or Section 1.1
  if (/^\d+\.\d+\s+[A-Za-z]/.test(trimmed) || /^(sub-?section|article)\s+[A-Z0-9\.]+/i.test(trimmed)) {
    return { isHeader: true, level: 3 };
  }

  // Explicit Section/Article headers: "Section 1: Information We Collect", "Article 2"
  if (/^(section|article|part|chapter)\s+[0-9IVXLCDMivxlcdm]+/i.test(trimmed)) {
    return { isHeader: true, level: 2 };
  }

  // Roman numerals: "I. INTRODUCTION"
  if (/^[IVXLCDM]+\.\s+[A-Za-z]/.test(trimmed)) {
    return { isHeader: true, level: 2 };
  }

  // Numbered major section: e.g. "1. INTRODUCTION" or "1. Information We Collect"
  if (/^\d{1,2}\.\s+[A-Za-z]/.test(trimmed)) {
    if (trimmed.length < 60 && !/^\d{1,2}\.\s+(we|you|our|they|this|please|if|when)\b/i.test(trimmed)) {
      return { isHeader: true, level: 2 };
    }
  }

  // All-caps standalone header
  if (isAllCapsHeading(trimmed)) {
    return { isHeader: true, level: 2 };
  }

  // Common privacy policy topic title (e.g. "Information We Collect", "Data Security", "Contact Us")
  const normalizedLower = trimmed.toLowerCase().replace(/[:#]/g, "").trim();
  if (COMMON_POLICY_SECTIONS.has(normalizedLower)) {
    return { isHeader: true, level: 2 };
  }

  return { isHeader: false, level: 2 };
}

/**
 * Checks if a line is a bullet item
 * Matches: -, *, +, •, –, —, o, ▪, ▫, ►, ✓
 */
function parseBulletItem(line: string): { isBullet: boolean; indent: string; content: string } {
  const match = line.match(/^(\s*)([-*+•–—o▪▫►✓]|\(?[•]\)?)\s+(.+)$/);
  if (!match) return { isBullet: false, indent: "", content: "" };

  const rawIndent = match[1] || "";
  const indentLevel = Math.floor(rawIndent.length / 2);
  const normalizedIndent = "  ".repeat(indentLevel);
  const content = match[3].trim();

  return { isBullet: true, indent: normalizedIndent, content };
}

/**
 * Checks if a line is a numbered list item (e.g. 1., 1), (1), a., a))
 */
function parseNumberedItem(line: string): { isNumbered: boolean; indent: string; prefix: string; content: string } {
  // Pattern 1: 1. or 1) or 1 -
  const match1 = line.match(/^(\s*)(\d+)[\.\)\-]\s+(.+)$/);
  if (match1) {
    const rawIndent = match1[1] || "";
    const indentLevel = Math.floor(rawIndent.length / 2);
    return {
      isNumbered: true,
      indent: "  ".repeat(indentLevel),
      prefix: `${match1[2]}.`,
      content: match1[3].trim(),
    };
  }

  // Pattern 2: (1)
  const match2 = line.match(/^(\s*)\((\d+)\)\s+(.+)$/);
  if (match2) {
    const rawIndent = match2[1] || "";
    const indentLevel = Math.floor(rawIndent.length / 2);
    return {
      isNumbered: true,
      indent: "  ".repeat(indentLevel),
      prefix: `${match2[2]}.`,
      content: match2[3].trim(),
    };
  }

  // Pattern 3: a. or a) or (a)
  const match3 = line.match(/^(\s*)([a-zA-Z])[\.\)]\s+(.+)$/) || line.match(/^(\s*)\(([a-zA-Z])\)\s+(.+)$/);
  if (match3) {
    const rawIndent = match3[1] || "";
    const indentLevel = Math.max(1, Math.floor(rawIndent.length / 2));
    return {
      isNumbered: true,
      indent: "  ".repeat(indentLevel),
      prefix: `${match3[2].toLowerCase()}.`,
      content: match3[3].trim(),
    };
  }

  return { isNumbered: false, indent: "", prefix: "", content: "" };
}

/**
 * Polishes metadata lines like "Effective Date: October 12, 2026" or "Last Updated: ..."
 */
function formatMetadataLine(line: string): string {
  const trimmed = line.trim();
  const match = trimmed.match(/^(effective\s+date|last\s+updated|last\s+modified|version)\s*:\s*(.+)$/i);
  if (match) {
    const label = match[1];
    const value = match[2];
    // Capitalize label for professional polish while preserving user value exactly
    const capitalizedLabel = label
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    return `**${capitalizedLabel}:** ${value}`;
  }
  return trimmed;
}

/**
 * Transforms user text into a polished, professional Markdown privacy policy.
 * Focuses purely on formatting without AI rewriting, paraphrasing, or invented clauses.
 */
export function convertTextToMarkdown(rawText: string): MarkdownConversionResult {
  if (!rawText || !rawText.trim()) {
    return {
      markdown: "",
      title: "Privacy Policy",
      characterCount: 0,
      wordCount: 0,
    };
  }

  const normalized = normalizeLineEndings(rawText.trim());
  const lines = normalized.split("\n");

  const outputBlocks: string[] = [];
  let detectedTitle = "";
  let hasMainHeading = false;

  let i = 0;
  while (i < lines.length) {
    const currentLine = lines[i];
    const trimmed = currentLine.trim();

    // Skip empty lines in loop
    if (!trimmed) {
      i++;
      continue;
    }

    // Check Setext heading on next line (e.g. line followed by === or ---)
    if (i + 1 < lines.length) {
      const nextLineTrimmed = lines[i + 1].trim();
      if (/^={3,}$/.test(nextLineTrimmed)) {
        const headingText = trimmed;
        if (!detectedTitle) detectedTitle = headingText;
        outputBlocks.push(`# ${headingText}`);
        hasMainHeading = true;
        i += 2;
        continue;
      } else if (/^-{3,}$/.test(nextLineTrimmed) && !trimmed.startsWith("-") && !trimmed.startsWith("*")) {
        const headingText = trimmed;
        outputBlocks.push(`## ${headingText}`);
        i += 2;
        continue;
      }
    }

    // 1. Existing Markdown Heading (# ... ######)
    if (isExistingMarkdownHeading(currentLine)) {
      if (currentLine.trim().startsWith("# ") && !detectedTitle) {
        detectedTitle = currentLine.trim().replace(/^#\s+/, "");
        hasMainHeading = true;
      }
      outputBlocks.push(currentLine.trim());
      i++;
      continue;
    }

    // 2. Section Heading Detection
    const headerCheck = isSectionHeader(trimmed);
    if (headerCheck.isHeader) {
      let level = headerCheck.level;
      if (!hasMainHeading && (level === 1 || outputBlocks.length === 0)) {
        level = 1;
        hasMainHeading = true;
        if (!detectedTitle) detectedTitle = trimmed;
      } else if (level === 1 && hasMainHeading) {
        level = 2;
      }

      const prefix = "#".repeat(level);
      outputBlocks.push(`${prefix} ${trimmed}`);
      i++;
      continue;
    }

    // 3. Bullet List Grouping
    const bulletCheck = parseBulletItem(currentLine);
    if (bulletCheck.isBullet) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const itemLine = lines[i];
        if (!itemLine.trim()) break;

        const itemParsed = parseBulletItem(itemLine);
        if (itemParsed.isBullet) {
          listItems.push(`${itemParsed.indent}- ${itemParsed.content}`);
          i++;
        } else if (listItems.length > 0 && /^\s{2,}/.test(itemLine)) {
          listItems.push(`  ${itemLine.trim()}`);
          i++;
        } else {
          break;
        }
      }
      outputBlocks.push(listItems.join("\n"));
      continue;
    }

    // 4. Numbered List Grouping
    const numCheck = parseNumberedItem(currentLine);
    if (numCheck.isNumbered) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const itemLine = lines[i];
        if (!itemLine.trim()) break;

        const numParsed = parseNumberedItem(itemLine);
        if (numParsed.isNumbered) {
          listItems.push(`${numParsed.indent}${numParsed.prefix} ${numParsed.content}`);
          i++;
        } else if (listItems.length > 0 && /^\s{2,}/.test(itemLine)) {
          listItems.push(`  ${itemLine.trim()}`);
          i++;
        } else {
          break;
        }
      }
      outputBlocks.push(listItems.join("\n"));
      continue;
    }

    // 5. Code block or Quote preservation
    if (trimmed.startsWith("```") || trimmed.startsWith(">")) {
      outputBlocks.push(trimmed);
      i++;
      continue;
    }

    // 6. Horizontal Rule preservation
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      outputBlocks.push("---");
      i++;
      continue;
    }

    // 7. Check if this is a metadata line right near the top (e.g. Effective Date:)
    if (/^(effective\s+date|last\s+updated|last\s+modified|version)\s*:/i.test(trimmed)) {
      outputBlocks.push(formatMetadataLine(trimmed));
      i++;
      continue;
    }

    // 8. Regular Paragraph Block
    const paragraphLines: string[] = [trimmed];
    i++;

    while (i < lines.length) {
      const nextLine = lines[i];
      const nextTrimmed = nextLine.trim();

      if (!nextTrimmed) break;
      if (isExistingMarkdownHeading(nextLine)) break;
      if (isSectionHeader(nextTrimmed).isHeader) break;
      if (parseBulletItem(nextLine).isBullet) break;
      if (parseNumberedItem(nextLine).isNumbered) break;
      if (nextTrimmed.startsWith("```") || nextTrimmed.startsWith(">")) break;
      if (/^={3,}$/.test(nextTrimmed) || /^-{3,}$/.test(nextTrimmed)) break;
      if (/^(effective\s+date|last\s+updated|last\s+modified|version)\s*:/i.test(nextTrimmed)) break;

      paragraphLines.push(nextTrimmed);
      i++;
    }

    outputBlocks.push(paragraphLines.join(" "));
  }

  // Infer title if not explicitly set
  if (!detectedTitle) {
    if (outputBlocks.length > 0) {
      const first = outputBlocks[0].replace(/^#+\s*/, "").trim();
      if (first.length > 0 && first.length < 80) {
        detectedTitle = first;
      }
    }
  }

  const finalTitle = detectedTitle || "Privacy Policy";
  const finalMarkdown = outputBlocks.join("\n\n").trim();

  const characterCount = finalMarkdown.length;
  const wordCount = finalMarkdown.split(/\s+/).filter(Boolean).length;

  return {
    markdown: finalMarkdown,
    title: finalTitle,
    characterCount,
    wordCount,
  };
}

/**
 * Extracts a human-readable title from markdown content
 */
export function extractTitleFromMarkdown(markdown: string): string {
  if (!markdown) return "Privacy Policy";
  const match = markdown.match(/^#\s+(.+)$/m);
  if (match && match[1]) {
    return match[1].replace(/[*_~`]/g, "").trim();
  }
  const lines = markdown.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const first = lines[0].replace(/^[#*_\-\s]+/, "").trim();
    if (first.length > 0 && first.length < 80) {
      return first;
    }
  }
  return "Privacy Policy";
}
