import { DatabaseService } from '../../services/database/DatabaseService';
import { Priority, Recurrence, Task } from '../../types/task';
import * as SQLite from 'expo-sqlite';

// Mock the openDatabaseAsync to return a controlled mock
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('DatabaseService', () => {
  let dbMock: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    dbMock = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };

    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(dbMock);
    
    // Access private instance to reset for each test
    (DatabaseService as any).instance = null;
  });

  it('should initialize and create tables', async () => {
    await DatabaseService.getInstance();
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('taskflow.db');
    expect(dbMock.execAsync).toHaveBeenCalled();
  });

  it('should save a task correctly', async () => {
    const db = await DatabaseService.getInstance();
    const task: Task = {
      id: 'task-1',
      title: 'Test Task',
      description: 'Desc',
      dueDate: '2026-04-19',
      startTime: null,
      endTime: null,
      priority: Priority.HIGH,
      completed: false,
      completedAt: null,
      recurrence: Recurrence.NONE,
      reminder: { enabled: true, minutesBefore: 15, repeating: false },
      createdAt: new Date().toISOString(),
      notificationId: null,
      parentTaskId: null,
    };

    await db.saveTask(task, 'pending_create');
    expect(dbMock.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO tasks'),
      expect.arrayContaining([
        'task-1', 
        expect.any(String), // encrypted title
        expect.any(String), // encrypted description
        '2026-04-19', 
        'high', 
        0, 
        'pending_create'
      ])
    );
    
    // Verify number of arguments
    const lastCall = dbMock.runAsync.mock.calls[dbMock.runAsync.mock.calls.length - 1];
    expect(lastCall[1].length).toBe(19);
  });

  it('should delete a task (soft delete by default)', async () => {
    const db = await DatabaseService.getInstance();
    await db.deleteTask('task-1');
    expect(dbMock.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE tasks SET syncStatus = "pending_delete", updatedAt = ? WHERE id = ?'),
      expect.arrayContaining([expect.any(String), 'task-1'])
    );
  });

  it('should add to sync queue', async () => {
    const db = await DatabaseService.getInstance();
    await db.addToSyncQueue('create', 'task-1', { title: 'New' });
    expect(dbMock.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO sync_queue'),
      expect.arrayContaining(['create', 'task-1', JSON.stringify({ title: 'New' })])
    );
  });
});
