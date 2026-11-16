import * as SQLite from 'expo-sqlite';

import type { ChatMessage } from '../chat-message';
import {
  fromStoredRows,
  toStoredRows,
  type ConversationSummary,
  type StoredConversation,
  type StoredMessageRow,
} from './chat-history';
import { createSerialQueue } from './serial-queue';

const DATABASE_NAME = 'opencore-chat.db';
const SCHEMA_VERSION = 1;

/**
 * `PRAGMA foreign_keys` is per connection, so it is set every time the database
 * is opened, and the delete of a conversation relies on ON DELETE CASCADE.
 */
const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS conversations (
  id          TEXT PRIMARY KEY NOT NULL,
  title       TEXT NOT NULL,
  preview     TEXT NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id                 TEXT PRIMARY KEY NOT NULL,
  conversation_id    TEXT NOT NULL
                       REFERENCES conversations(id) ON DELETE CASCADE,
  position           INTEGER NOT NULL,
  role               TEXT NOT NULL,
  text               TEXT NOT NULL,
  reasoning          TEXT NOT NULL DEFAULT '',
  reasoning_duration INTEGER,
  error_code         TEXT,
  error_message      TEXT,
  error_retryable    INTEGER
);

CREATE INDEX IF NOT EXISTS messages_by_conversation ON messages(conversation_id, position);
CREATE INDEX IF NOT EXISTS conversations_by_activity ON conversations(updated_at DESC);
`;

const SUMMARY_COLUMNS =
  'id, title, preview, created_at AS createdAt, updated_at AS updatedAt';

const MESSAGE_COLUMNS = `id, conversation_id AS conversationId, position, role, text,
  reasoning, reasoning_duration AS reasoningDuration, error_code AS errorCode,
  error_message AS errorMessage, error_retryable AS errorRetryable`;

let opening: Promise<SQLite.SQLiteDatabase | null> | null = null;

async function open(): Promise<SQLite.SQLiteDatabase | null> {
  try {
    const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await database.execAsync('PRAGMA journal_mode = WAL;');
    await database.execAsync('PRAGMA foreign_keys = ON;');
    const version = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    if ((version?.user_version ?? 0) < SCHEMA_VERSION) {
      await database.execAsync(SCHEMA);
      await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
    }
    return database;
  } catch (error) {
    console.warn('[chat history]', error);
    return null;
  }
}

/** One handle per app run; a failed open stays failed instead of retrying forever. */
function database(): Promise<SQLite.SQLiteDatabase | null> {
  opening ??= open();
  return opening;
}

// Every read and write is enqueued before its first await, so a list or a load
// issued right after a save observes the committed row.
const enqueue = createSerialQueue((error) => console.warn('[chat history]', error));

export function listConversations(): Promise<ConversationSummary[]> {
  return enqueue(async () => {
    const db = await database();
    if (!db) return [];
    return db.getAllAsync<ConversationSummary>(
      `SELECT ${SUMMARY_COLUMNS} FROM conversations ORDER BY updated_at DESC`,
    );
  });
}

export function loadConversation(id: string): Promise<StoredConversation | null> {
  return enqueue(async () => {
    const db = await database();
    if (!db) return null;
    const summary = await db.getFirstAsync<ConversationSummary>(
      `SELECT ${SUMMARY_COLUMNS} FROM conversations WHERE id = ?`,
      id,
    );
    if (!summary) return null;
    const rows = await db.getAllAsync<StoredMessageRow>(
      `SELECT ${MESSAGE_COLUMNS} FROM messages WHERE conversation_id = ? ORDER BY position ASC`,
      id,
    );
    return { summary, messages: fromStoredRows(rows) };
  });
}

export function saveConversation(
  summary: ConversationSummary,
  messages: ChatMessage[],
): Promise<void> {
  return enqueue(async () => {
    const db = await database();
    if (!db) return;
    const rows = toStoredRows(messages, summary.id);
    // Not withExclusiveTransactionAsync: that runs on a new connection, where
    // the foreign_keys pragma is not set, so the cascade would not fire.
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO conversations (id, title, preview, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           preview = excluded.preview,
           updated_at = excluded.updated_at`,
        summary.id,
        summary.title,
        summary.preview,
        summary.createdAt,
        summary.updatedAt,
      );
      await db.runAsync('DELETE FROM messages WHERE conversation_id = ?', summary.id);
      for (const row of rows) {
        await db.runAsync(
          `INSERT INTO messages (id, conversation_id, position, role, text, reasoning,
             reasoning_duration, error_code, error_message, error_retryable)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          row.id,
          row.conversationId,
          row.position,
          row.role,
          row.text,
          row.reasoning,
          row.reasoningDuration,
          row.errorCode,
          row.errorMessage,
          row.errorRetryable,
        );
      }
    });
  });
}

export function deleteConversation(id: string): Promise<void> {
  return enqueue(async () => {
    const db = await database();
    if (!db) return;
    await db.runAsync('DELETE FROM conversations WHERE id = ?', id);
  });
}
