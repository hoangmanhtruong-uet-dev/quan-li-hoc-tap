'use client';

import React from 'react';

interface CoachMarkdownRendererProps {
  content: string;
  className?: string;
}

// Academic keywords to highlight as quantum purple badges
const ACADEMIC_KEYWORDS = [
  'CampusOS Coach',
  'Subnetting',
  'Mạng máy tính',
  'Mô hình OSI',
  'TCP/IP',
  'OSI',
  'TCP',
  'UDP',
  'CTDL & Giải thuật',
  'CTDL & GT',
  'CTDL',
  'Big-O',
  'Dijkstra',
  'Bellman-Ford',
  'Xác suất Thống kê',
  'Toán rời rạc',
  'Triết học Mác - Lênin',
  'Triết học',
  'Deadline',
  'Lộ trình 3 giai đoạn',
  'Học tập chủ động',
  'Pomodoro',
];

// Time & date patterns to highlight as urgency badges
const TIME_REGEX =
  /\b(\d{1,2}:\d{2}\s*(?:hôm nay|ngày mai|hôm qua)?|\d{1,2}h\d{0,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|23:59|hôm nay|ngày mai|tuần sau|cuối tuần)\b/gi;

/**
 * Tokenize an inline text segment to convert keywords and time into styled badges
 */
function renderInlineWithBadges(text: string): React.ReactNode[] {
  // First match code snippets like `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, pIdx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const codeSnippet = part.slice(1, -1);
      return (
        <code
          key={`code-${pIdx}`}
          className="rounded-md bg-black/60 border border-white/10 px-1.5 py-0.5 font-mono text-xs text-cyan-300 font-bold"
        >
          {codeSnippet}
        </code>
      );
    }

    // Check for bold **text** or *italic*
    const boldParts = part.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

    return (
      <span key={`p-${pIdx}`}>
        {boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
            const rawInner = bPart.slice(2, -2);
            // Check if inner matches an academic keyword or deadline
            const isAcademic = ACADEMIC_KEYWORDS.some((kw) =>
              rawInner.toLowerCase().includes(kw.toLowerCase())
            );
            const isTime = TIME_REGEX.test(rawInner);

            if (isAcademic) {
              return (
                <span
                  key={`bold-acad-${bIdx}`}
                  className="inline-flex items-center mx-1 px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 font-semibold text-xs border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)] align-middle"
                >
                  {rawInner}
                </span>
              );
            }

            if (isTime) {
              return (
                <span
                  key={`bold-time-${bIdx}`}
                  className="inline-flex items-center mx-1 px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-bold font-mono text-xs border border-rose-500/30 align-middle"
                >
                  ⏰ {rawInner}
                </span>
              );
            }

            return (
              <strong key={`bold-${bIdx}`} className="font-bold text-foreground">
                {rawInner}
              </strong>
            );
          }

          if (bPart.startsWith('*') && bPart.endsWith('*') && bPart.length > 2) {
            const rawItalic = bPart.slice(1, -1);
            return (
              <span
                key={`it-${bIdx}`}
                className="inline-block px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 text-xs font-medium border border-cyan-400/20 mx-0.5"
              >
                {rawItalic}
              </span>
            );
          }

          // Plain text token: also scan for standalone times
          return <span key={`plain-${bIdx}`}>{bPart}</span>;
        })}
      </span>
    );
  });
}

/**
 * CoachMarkdownRenderer transforms raw markdown into rich, elegant Cyber-Glass styled typography.
 */
export function CoachMarkdownRenderer({ content, className = '' }: CoachMarkdownRendererProps) {
  if (!content) return null;

  // Split content into blocks: code blocks, blockquotes, lists, paragraphs
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeLanguage = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    // Triple backticks code block
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3).trim();
        codeBlockContent = [];
      } else {
        inCodeBlock = false;
        elements.push(
          <div
            key={`code-blk-${i}`}
            className="my-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-inner"
          >
            {codeLanguage && (
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3.5 py-1.5 font-mono text-[11px] text-muted-foreground">
                <span className="uppercase tracking-wider">{codeLanguage}</span>
                <span className="text-[10px] text-cyan-400">CampusOS Code</span>
              </div>
            )}
            <pre className="overflow-x-auto p-3.5 font-mono text-xs text-cyan-200/90 leading-relaxed">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockContent = [];
        codeLanguage = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Empty line spacer
    if (!trimmed) {
      elements.push(<div key={`sp-${i}`} className="h-2" />);
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4
          key={`h3-${i}`}
          className="text-sm font-bold text-foreground mt-3 mb-1.5 flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          {renderInlineWithBadges(trimmed.slice(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3
          key={`h2-${i}`}
          className="text-base font-extrabold text-foreground mt-3.5 mb-1.5 flex items-center gap-2 text-cyan-300"
        >
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500" />
          {renderInlineWithBadges(trimmed.slice(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2
          key={`h1-${i}`}
          className="text-lg font-black text-foreground mt-4 mb-2 tracking-tight"
        >
          {renderInlineWithBadges(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="my-2 border-l-2 border-cyan-400/80 bg-cyan-500/5 px-3.5 py-2 rounded-r-xl text-xs italic text-cyan-200/90"
        >
          {renderInlineWithBadges(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered List (- or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={`li-${i}`} className="my-1 flex items-start gap-2.5 text-xs sm:text-sm pl-1">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_6px_rgba(61,232,255,0.8)]" />
          <div className="flex-1 leading-relaxed text-foreground/90">
            {renderInlineWithBadges(trimmed.slice(2))}
          </div>
        </div>
      );
      continue;
    }

    // Numbered List (1. , 2. )
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      elements.push(
        <div key={`num-${i}`} className="my-1.5 flex items-start gap-2.5 text-xs sm:text-sm pl-1">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-purple-500/20 font-mono text-[10px] font-bold text-purple-300 border border-purple-500/30">
            {numberedMatch[1]}
          </span>
          <div className="flex-1 leading-relaxed text-foreground/90">
            {renderInlineWithBadges(numberedMatch[2] || '')}
          </div>
        </div>
      );
      continue;
    }

    // Standard paragraph line
    elements.push(
      <p key={`p-${i}`} className="my-1 text-xs sm:text-sm leading-relaxed text-foreground/90">
        {renderInlineWithBadges(line)}
      </p>
    );
  }

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>;
}

export default CoachMarkdownRenderer;
