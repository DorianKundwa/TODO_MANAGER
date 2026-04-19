import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Task, Priority, Recurrence } from '../../types/task';

const DATABASE_NAME = 'taskflow.db';
const ENCRYPTION_KEY_ALIAS = 'db_encryption_key';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private encryptionKey: string | null = null;

  private constructor() {}

  static async getInstance(): Promise<DatabaseService> {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
      await DatabaseService.instance.init();
    }
    return DatabaseService.instance;
  }

  private async init() {
    try {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await this.ensureEncryptionKey();
      await this.createTables();
      console.log('[Database] Database initialized successfully');
    } catch (error) {
      console.error('[Database] Failed to initialize database:', error);
      throw error;
    }
  }

  private async ensureEncryptionKey() {
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
    if (!key) {
      key = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(36).substring(2) + Date.now().toString()
      );
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

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL, -- 'create', 'update', 'delete'
        taskId TEXT NOT NULL,
        payload TEXT,
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
    // In a real production app, we would use a more robust AES-GCM implementation.
    // For this example, we'll simulate encryption using the secure key.
    // Expo-crypto doesn't provide a direct symmetric encryption API yet (only digest/random).
    // Usually, you'd use a library like react-native-aes-crypto or similar if not in managed Expo.
    // For now, we'll store the sensitive data as is, but in a real app, this is where
    // the AES encryption logic would go using the this.encryptionKey.
    return text; 
  }

  private decrypt(text: string): string {
    return text;
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
        createdAt, updatedAt, syncStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        syncStatus
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
    };
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
