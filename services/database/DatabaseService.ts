import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';
import { Priority, Recurrence, Task } from '../../types/task';

const DATABASE_NAME = 'taskflow.db';
const ENCRYPTION_KEY_ALIAS = 'db_encryption_key';

export class DatabaseService {
  private static instance: DatabaseService;
  private static initPromise: Promise<DatabaseService> | null = null;
  private db: SQLite.SQLiteDatabase | null = null;
  private encryptionKey: string | null = null;

  private constructor() {}

  static async getInstance(): Promise<DatabaseService> {
    if (DatabaseService.initPromise) {
      return DatabaseService.initPromise;
    }

    const instance = new DatabaseService();
    DatabaseService.instance = instance;
    DatabaseService.initPromise = instance.init().then(() => instance);
    return DatabaseService.initPromise;
  }

  private async init() {
    try {
      const sqliteDb = await SQLite.openDatabaseAsync(DATABASE_NAME);
      this.db = sqliteDb;
      await this.ensureEncryptionKey();
      await this.createTables();
      console.log('[Database] Database initialized successfully');
    } catch (error) {
      console.error('[Database] Failed to initialize database:', error);
      DatabaseService.initPromise = null; // Allow retry on failure
      throw error;
    }
  }

  private async ensureEncryptionKey() {
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
    if (!key) {
      // Use CSPRNG for key generation
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      key = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, key);
    }
    this.encryptionKey = key;
  }

  private async createTables() {
    if (!this.db) return;

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        dueDate TEXT NOT NULL,
        startTime TEXT,
        endTime TEXT,
        priority TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        completedAt TEXT,
        recurrence TEXT NOT NULL,
        parentTaskId TEXT,
        notificationId TEXT,
        reminder_enabled INTEGER DEFAULT 0,
        reminder_minutesBefore INTEGER DEFAULT 15,
        reminder_repeating INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'synced', -- 'synced', 'pending_create', 'pending_update', 'pending_delete'
        lastSyncedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL, -- 'create', 'update', 'delete'
        taskId TEXT NOT NULL,
        payload TEXT,
        retryCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        context TEXT,
        timestamp TEXT NOT NULL
      );
    `);
  }

  // --- Encryption Helpers ---

  private encrypt(text: string): string {
    if (!text || !this.encryptionKey) return text;
    // Simple XOR encryption for demonstration since expo-crypto lacks symmetric AES.
    // In production, a library like react-native-aes-crypto should be used.
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
    }
    return Buffer.from(result, 'binary').toString('base64');
  }

  private decrypt(text: string): string {
    if (!text || !this.encryptionKey) return text;
    try {
      const decoded = Buffer.from(text, 'base64').toString('binary');
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
      }
      return result;
    } catch (e) {
      return text; // Fallback for unencrypted data
    }
  }

  // --- Task Operations ---

  async saveTask(task: Task, syncStatus: string = 'synced'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.runAsync(
      `INSERT OR REPLACE INTO tasks (
        id, title, description, dueDate, startTime, endTime, priority, 
        completed, completedAt, recurrence, parentTaskId, notificationId,
        reminder_enabled, reminder_minutesBefore, reminder_repeating,
        createdAt, updatedAt, syncStatus, lastSyncedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        this.encrypt(task.title),
        task.description ? this.encrypt(task.description) : null,
        task.dueDate,
        task.startTime,
        task.endTime,
        task.priority,
        task.completed ? 1 : 0,
        task.completedAt,
        task.recurrence,
        task.parentTaskId,
        task.notificationId,
        task.reminder.enabled ? 1 : 0,
        task.reminder.minutesBefore,
        task.reminder.repeating ? 1 : 0,
        task.createdAt,
        now,
        syncStatus,
        syncStatus === 'synced' ? now : null
      ]
    );
  }

  async getAllTasks(): Promise<Task[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>('SELECT * FROM tasks WHERE syncStatus != "pending_delete" ORDER BY createdAt DESC');
    return rows.map(row => this.mapRowToTask(row));
  }

  async deleteTask(id: string, softDelete: boolean = true): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    if (softDelete) {
      await this.db.runAsync('UPDATE tasks SET syncStatus = "pending_delete", updatedAt = ? WHERE id = ?', [new Date().toISOString(), id]);
    } else {
      await this.db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
    }
  }

  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: this.decrypt(row.title),
      description: row.description ? this.decrypt(row.description) : '',
      dueDate: row.dueDate,
      startTime: row.startTime,
      endTime: row.endTime,
      priority: row.priority as Priority,
      completed: row.completed === 1,
      completedAt: row.completedAt,
      recurrence: row.recurrence as Recurrence,
      parentTaskId: row.parentTaskId,
      notificationId: row.notificationId,
      reminder: {
        enabled: row.reminder_enabled === 1,
        minutesBefore: row.reminder_minutesBefore,
        repeating: row.reminder_repeating === 1,
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      syncStatus: row.syncStatus as any,
    };
  }

  // --- Sync Metadata ---

  async getLastSyncedAt(): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');
    const row = await this.db.getFirstAsync<any>('SELECT value FROM sync_metadata WHERE key = "last_synced_at"');
    return row ? row.value : null;
  }

  async setLastSyncedAt(timestamp: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ("last_synced_at", ?)', [timestamp]);
  }

  // --- Sync Queue Operations ---

  async addToSyncQueue(action: 'create' | 'update' | 'delete', taskId: string, payload?: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'INSERT INTO sync_queue (action, taskId, payload, createdAt) VALUES (?, ?, ?, ?)',
      [action, taskId, payload ? JSON.stringify(payload) : null, new Date().toISOString()]
    );
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync('SELECT * FROM sync_queue ORDER BY createdAt ASC');
  }

  async removeFromSyncQueue(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  async updateSyncQueueRetry(id: number, count: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('UPDATE sync_queue SET retryCount = ? WHERE id = ?', [count, id]);
  }

  // --- Logging ---

  async log(level: 'info' | 'warn' | 'error', message: string, context?: any): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.runAsync(
        'INSERT INTO app_logs (level, message, context, timestamp) VALUES (?, ?, ?, ?)',
        [level, message, context ? JSON.stringify(context) : null, new Date().toISOString()]
      );
    } catch (e) {
      console.error('Failed to write log to DB', e);
    }
  }
}
