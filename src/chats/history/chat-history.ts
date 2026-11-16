import type { ChatMessage, ChatRole } from '../chat-message';
import type { ChatErrorCode } from '../llm/types';

export type ConversationSummary = {
  id: string;
  title: string;
  preview: string;
  createdAt: number;
  updatedAt: number;
};

export type StoredConversation = {
  summary: ConversationSummary;
  messages: ChatMessage[];
};

export type StoredMessageRow = {
  id: string;
  conversationId: string;
  position: number;
  role: string;
  text: string;
  reasoning: string;
  reasoningDuration: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  errorRetryable: number | null;
};

export type ConversationGroupLabel = 'Today' | 'Yesterday' | 'Previous 7 days' | 'Earlier';

const TITLE_CAP = 60;
const PREVIEW_CAP = 120;
const DAY_MS = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Counts code points, so an emoji is one character and never sliced in half. */
function truncate(text: string, cap: number): string {
  const characters = Array.from(text);
  return characters.length > cap ? `${characters.slice(0, cap).join('')}…` : text;
}

function isBlankReply(message: ChatMessage): boolean {
  return (
    message.role === 'assistant' &&
    collapse(message.text) === '' &&
    collapse(message.reasoning) === '' &&
    message.error === undefined
  );
}

/**
 * What gets written. Local-only messages never leave the device, and a trailing
 * assistant message with no text, no reasoning, and no error is the placeholder
 * a reply starts in — writing it would reopen as a phantom empty bubble. An
 * errored blank is kept: it explains itself. Only the tail is dropped because a
 * blank reply can only be the newest message.
 */
export function persistableMessages(messages: ChatMessage[]): ChatMessage[] {
  const kept = messages.filter((message) => !message.localOnly);
  while (kept.length > 0 && isBlankReply(kept[kept.length - 1])) {
    kept.pop();
  }
  return kept;
}

export function toStoredRows(messages: ChatMessage[], conversationId: string): StoredMessageRow[] {
  return messages.map((message, position) => ({
    id: message.id,
    conversationId,
    position,
    role: message.role,
    text: message.text,
    reasoning: message.reasoning,
    reasoningDuration: message.reasoningDuration ?? null,
    errorCode: message.error?.code ?? null,
    errorMessage: message.error?.message ?? null,
    errorRetryable: message.error === undefined ? null : message.error.retryable ? 1 : 0,
  }));
}

export function fromStoredRows(rows: StoredMessageRow[]): ChatMessage[] {
  return rows.map((row) => {
    const role: ChatRole = row.role === 'user' ? 'user' : 'assistant';
    return {
      id: row.id,
      role,
      text: row.text,
      streaming: false,
      reasoning: row.reasoning,
      reasoningStreaming: false,
      reasoningDuration: row.reasoningDuration ?? undefined,
      ...(row.errorCode === null
        ? {}
        : {
            error: {
              code: row.errorCode as ChatErrorCode,
              message: row.errorMessage ?? '',
              retryable: row.errorRetryable === 1,
            },
          }),
    };
  });
}

export function deriveConversationTitle(messages: ChatMessage[]): string {
  const firstQuestion = messages.find((message) => message.role === 'user' && !message.localOnly);
  const text = collapse(firstQuestion?.text ?? '');
  return text === '' ? 'New chat' : truncate(text, TITLE_CAP);
}

export function deriveConversationPreview(messages: ChatMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.localOnly) continue;
    const text = collapse(message.text);
    if (text !== '') return truncate(text, PREVIEW_CAP);
  }
  return '';
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

const GROUP_ORDER: ConversationGroupLabel[] = ['Today', 'Yesterday', 'Previous 7 days', 'Earlier'];

export function groupConversationsByDay(
  list: ConversationSummary[],
  now: number,
): { label: ConversationGroupLabel; items: ConversationSummary[] }[] {
  const today = startOfDay(now);
  const groups = new Map<ConversationGroupLabel, ConversationSummary[]>();

  for (const item of list) {
    // Rounding absorbs the 23 and 25 hour days around a DST change.
    const daysBack = Math.round((today - startOfDay(item.updatedAt)) / DAY_MS);
    const label: ConversationGroupLabel =
      daysBack <= 0
        ? 'Today'
        : daysBack === 1
          ? 'Yesterday'
          : daysBack <= 7
            ? 'Previous 7 days'
            : 'Earlier';
    const bucket = groups.get(label);
    if (bucket) bucket.push(item);
    else groups.set(label, [item]);
  }

  return GROUP_ORDER.flatMap((label) => {
    const items = groups.get(label);
    return items ? [{ label, items }] : [];
  });
}

export function formatConversationTime(updatedAt: number, now: number): string {
  const elapsed = Math.max(0, now - updatedAt);
  if (elapsed < 60_000) return 'now';
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / 3_600_000)}h`;
  if (elapsed < 7 * DAY_MS) return WEEKDAYS[new Date(updatedAt).getDay()];
  const date = new Date(updatedAt);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}
