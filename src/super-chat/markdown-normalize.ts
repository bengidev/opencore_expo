/**
 * Models occasionally emit inline HTML inside Markdown — most often `<br>` to
 * break a line inside a bullet, sometimes `<b>`/`<i>`. The native renderer
 * disables inline HTML, so those tags reached the screen verbatim. This pass
 * maps them onto Markdown outside code spans and fences, where a literal `<br>`
 * or `&amp;` is content and must survive untouched.
 */

const CODE_SEGMENT = /```[\s\S]*?```|`[^`\n]*`/g;

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

function normalizeSegment(segment: string): string {
  return segment
    .replace(/<br\s*\/?>\s*(?=[•*]\s)/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n\n')
    .replace(/<\/?(strong|b)>/gi, '**')
    .replace(/<\/?(em|i)>/gi, '_')
    .replace(/<\/?(?:p|div|span|ul|ol|li|code|pre|sup|sub|u|s|del)>/gi, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/gi, (entity) =>
      ENTITIES[entity.toLowerCase()] ?? entity,
    )
    // A tag split across two deltas would otherwise flash as literal text.
    .replace(/<\/?[a-z][^>]*$/i, '')
    .split('\n')
    .map((line) => line.replace(/^(\s*)•\s+/, '$1- '))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

export function normalizeMarkdownHtml(text: string): string {
  let result = '';
  let cursor = 0;

  for (const match of text.matchAll(CODE_SEGMENT)) {
    const start = match.index ?? 0;
    result += normalizeSegment(text.slice(cursor, start)) + match[0];
    cursor = start + match[0].length;
  }

  return result + normalizeSegment(text.slice(cursor));
}
