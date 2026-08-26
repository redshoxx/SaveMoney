import { getDatabase } from '@/db/database';
import { makeId } from '@/utils/money';

export type TodoItem = {
  id: string;
  title: string;
  notes: string | null;
  dueAt: string;
  completedAt: string | null;
  notificationId: string | null;
  createdAt: string;
};

let readyPromise: Promise<void> | null = null;

async function getTodoDatabase() {
  const db = await getDatabase();
  if (!readyPromise) {
    readyPromise = db.execAsync(`
      CREATE TABLE IF NOT EXISTS todo_items (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        notes TEXT,
        due_at TEXT NOT NULL,
        completed_at TEXT,
        notification_id TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_todo_due_at ON todo_items(completed_at, due_at);
    `).catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  await readyPromise;
  return db;
}

function mapTodo(row: Record<string, unknown>): TodoItem {
  return {
    id: String(row.id),
    title: String(row.title),
    notes: row.notes ? String(row.notes) : null,
    dueAt: String(row.due_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    notificationId: row.notification_id ? String(row.notification_id) : null,
    createdAt: String(row.created_at),
  };
}

export async function loadTodos() {
  const db = await getTodoDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM todo_items ORDER BY completed_at IS NOT NULL, due_at ASC, created_at DESC',
  );
  return rows.map(mapTodo);
}

export async function createTodo(input: { title: string; notes?: string | null; dueAt: string }) {
  const db = await getTodoDatabase();
  const id = makeId('todo');
  await db.runAsync(
    `INSERT INTO todo_items (id, title, notes, due_at, completed_at, notification_id, created_at)
     VALUES (?, ?, ?, ?, NULL, NULL, ?)`,
    id,
    input.title.trim(),
    input.notes?.trim() || null,
    input.dueAt,
    new Date().toISOString(),
  );
  return id;
}

export async function setTodoNotification(todoId: string, notificationId: string | null) {
  const db = await getTodoDatabase();
  await db.runAsync('UPDATE todo_items SET notification_id = ? WHERE id = ?', notificationId, todoId);
}

export async function setTodoCompleted(todoId: string, completed: boolean) {
  const db = await getTodoDatabase();
  await db.runAsync(
    'UPDATE todo_items SET completed_at = ?, notification_id = CASE WHEN ? = 1 THEN NULL ELSE notification_id END WHERE id = ?',
    completed ? new Date().toISOString() : null,
    completed ? 1 : 0,
    todoId,
  );
}

export async function deleteTodo(todoId: string) {
  const db = await getTodoDatabase();
  await db.runAsync('DELETE FROM todo_items WHERE id = ?', todoId);
}

export async function clearTodos() {
  const db = await getTodoDatabase();
  await db.runAsync('DELETE FROM todo_items');
}
