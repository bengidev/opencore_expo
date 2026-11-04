/**
 * A small Markdown reader for chat answers.
 *
 * PanelUI's `Response` is the reference for the behaviour here: an answer is
 * read as blocks (headings, paragraphs, lists, quotes, fences) and inline runs
 * (bold, italic, code, links, strike), and while it is still arriving an
 * unterminated construct at the tail is finished rather than escaped — an open
 * `**` is bold text still being written, an open fence is code still filling.
 *
 * The parser is deliberately not a general Markdown implementation. It reads
 * what the model writes, which is the same trade PanelUI makes. Keeping it
 * dependency-free and JSX-free lets the node test suite exercise it directly.
 */

import { getWordScheduleMs, STREAM_WORD_STAGGER_MS } from './streaming-timing.ts';

export type MarkdownInline = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  strike?: boolean;
  href?: string;
};

export type MarkdownListItem = {
  marker: string;
  inlines: MarkdownInline[];
};

export type MarkdownBlock =
  | { type: 'heading'; level: number; inlines: MarkdownInline[] }
  | { type: 'paragraph'; inlines: MarkdownInline[] }
  | { type: 'list'; ordered: boolean; items: MarkdownListItem[] }
  | { type: 'quote'; inlines: MarkdownInline[] }
  | { type: 'code'; language: string | null; code: string }
  | { type: 'rule' };

export type ParseMarkdownOptions = {
  /**
   * Finish an unterminated construct at the end of the input. Only the tail is
   * treated this way: a finished document means what it says.
   */
  streaming?: boolean;
};

type InlineStyle = Pick<MarkdownInline, 'bold' | 'italic' | 'code' | 'strike' | 'href'>;

const LINK_PREFIXES = ['https://', 'http://', 'mailto:', 'tel:'];

const FENCE_RE = /^\s*```(.*)$/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const QUOTE_RE = /^\s*>\s?(.*)$/;
const LIST_RE = /^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/;
const RULE_RE = /^\s*([-*_])(?:\s*\1){2,}\s*$/;

export function parseMarkdown(
  source: string,
  options: ParseMarkdownOptions = {},
): MarkdownBlock[] {
  const streaming = options.streaming ?? false;
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(FENCE_RE);
    if (fence) {
      const language = fence[1]?.trim() || null;
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index] ?? '')) {
        codeLines.push(lines[index] ?? '');
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: 'code', language, code: codeLines.join('\n') });
      continue;
    }

    if (RULE_RE.test(line)) {
      blocks.push({ type: 'rule' });
      index += 1;
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1]?.length ?? 1,
        inlines: parseInline(heading[2] ?? '', streaming),
      });
      index += 1;
      continue;
    }

    if (QUOTE_RE.test(line)) {
      const quoted: string[] = [];
      while (index < lines.length && QUOTE_RE.test(lines[index] ?? '')) {
        quoted.push((lines[index] ?? '').replace(QUOTE_RE, '$1').trim());
        index += 1;
      }
      blocks.push({
        type: 'quote',
        inlines: parseInline(quoted.join(' '), streaming),
      });
      continue;
    }

    const listItem = line.match(LIST_RE);
    if (listItem) {
      const ordered = /^\d/.test(listItem[2] ?? '');
      const items: MarkdownListItem[] = [];

      while (index < lines.length) {
        const match = (lines[index] ?? '').match(LIST_RE);
        if (!match) break;
        items.push({
          marker: ordered ? `${items.length + 1}.` : '•',
          inlines: parseInline(match[3] ?? '', streaming),
        });
        index += 1;
      }

      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraph: string[] = [line.trim()];
    index += 1;
    while (index < lines.length) {
      const next = lines[index] ?? '';
      if (
        !next.trim() ||
        FENCE_RE.test(next) ||
        RULE_RE.test(next) ||
        HEADING_RE.test(next) ||
        QUOTE_RE.test(next) ||
        LIST_RE.test(next)
      ) {
        break;
      }
      paragraph.push(next.trim());
      index += 1;
    }

    blocks.push({
      type: 'paragraph',
      inlines: parseInline(paragraph.join(' '), streaming),
    });
  }

  return blocks;
}

function parseInline(
  text: string,
  streaming: boolean,
  inherited: InlineStyle = {},
): MarkdownInline[] {
  const out: MarkdownInline[] = [];
  let buffer = '';

  const flush = () => {
    if (!buffer) return;
    out.push({ ...inherited, text: buffer });
    buffer = '';
  };

  const pushStyled = (inner: string, style: InlineStyle) => {
    flush();
    out.push(...parseInline(inner, streaming, { ...inherited, ...style }));
  };

  let index = 0;
  while (index < text.length) {
    const char = text[index] ?? '';

    if (char === '\\' && index + 1 < text.length) {
      buffer += text[index + 1] ?? '';
      index += 2;
      continue;
    }

    if (char === '`') {
      const close = text.indexOf('`', index + 1);
      if (close !== -1) {
        flush();
        out.push({ ...inherited, text: text.slice(index + 1, close), code: true });
        index = close + 1;
        continue;
      }
      if (streaming) {
        pushStyled(text.slice(index + 1), { code: true });
        index = text.length;
        continue;
      }
    }

    if (text.startsWith('**', index) || text.startsWith('__', index)) {
      const delimiter = text.slice(index, index + 2);
      const close = text.indexOf(delimiter, index + 2);
      if (close !== -1) {
        pushStyled(text.slice(index + 2, close), { bold: true });
        index = close + 2;
        continue;
      }
      if (streaming) {
        pushStyled(text.slice(index + 2), { bold: true });
        index = text.length;
        continue;
      }
      buffer += delimiter;
      index += 2;
      continue;
    }

    if (text.startsWith('~~', index)) {
      const close = text.indexOf('~~', index + 2);
      if (close !== -1) {
        pushStyled(text.slice(index + 2, close), { strike: true });
        index = close + 2;
        continue;
      }
      if (streaming) {
        pushStyled(text.slice(index + 2), { strike: true });
        index = text.length;
        continue;
      }
      buffer += '~~';
      index += 2;
      continue;
    }

    if (char === '*' || char === '_') {
      const close = text.indexOf(char, index + 1);
      if (close !== -1) {
        pushStyled(text.slice(index + 1, close), { italic: true });
        index = close + 1;
        continue;
      }
      if (streaming) {
        pushStyled(text.slice(index + 1), { italic: true });
        index = text.length;
        continue;
      }
      buffer += char;
      index += 1;
      continue;
    }

    if (char === '[') {
      const labelEnd = text.indexOf(']', index + 1);
      if (labelEnd !== -1 && text[labelEnd + 1] === '(') {
        const hrefEnd = text.indexOf(')', labelEnd + 2);
        if (hrefEnd !== -1) {
          const label = text.slice(index + 1, labelEnd);
          const href = text.slice(labelEnd + 2, hrefEnd).trim();
          if (label && href) {
            pushStyled(label, { href });
            index = hrefEnd + 1;
            continue;
          }
        } else if (streaming) {
          // A half-typed link shows its label and nothing else, so the text
          // does not jump when the closing paren lands (PanelUI Response).
          pushStyled(text.slice(index + 1, labelEnd), {});
          index = text.length;
          continue;
        }
      }
    }

    buffer += char;
    index += 1;
  }

  flush();
  return mergeInline(out);
}

function mergeInline(segments: MarkdownInline[]): MarkdownInline[] {
  const merged: MarkdownInline[] = [];

  for (const segment of segments) {
    const previous = merged[merged.length - 1];
    if (!segment.text) continue;
    if (previous && sameStyle(previous, segment)) {
      previous.text += segment.text;
    } else {
      merged.push({ ...segment });
    }
  }

  return merged;
}

function sameStyle(a: MarkdownInline, b: MarkdownInline): boolean {
  return (
    Boolean(a.bold) === Boolean(b.bold) &&
    Boolean(a.italic) === Boolean(b.italic) &&
    Boolean(a.code) === Boolean(b.code) &&
    Boolean(a.strike) === Boolean(b.strike) &&
    (a.href ?? '') === (b.href ?? '')
  );
}

/** Duration of the per-word dissolve for a parsed answer. */
export function getMarkdownStreamingDurationMs(text: string): number {
  const blocks = parseMarkdown(text, { streaming: true });
  return getWordScheduleMs(countMarkdownWords(blocks), STREAM_WORD_STAGGER_MS);
}

export function isAllowedLink(href: string): boolean {
  return LINK_PREFIXES.some((prefix) => href.startsWith(prefix));
}

export function countMarkdownWords(blocks: MarkdownBlock[]): number {
  let count = 0;

  for (const block of blocks) {
    if (block.type === 'heading' || block.type === 'paragraph' || block.type === 'quote') {
      count += countInlineWords(block.inlines);
    } else if (block.type === 'list') {
      for (const item of block.items) {
        count += countInlineWords(item.inlines);
      }
    } else if (block.type === 'code') {
      count += block.code.match(/\S+/g)?.length ?? 0;
    }
  }

  return count;
}

function countInlineWords(inlines: MarkdownInline[]): number {
  return inlines.reduce((total, segment) => {
    return total + (segment.text.match(/\S+/g)?.length ?? 0);
  }, 0);
}
