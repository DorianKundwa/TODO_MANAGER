import { SyncEngine } from '../../services/SyncEngine';
import { DatabaseService } from '../../services/database/DatabaseService';
import NetInfo from '@react-native-community/netinfo';
import { Priority, Recurrence, Task } from '../../types/task';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

describe('Sync Integration', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (DatabaseService as any).instance = null;
    db = await DatabaseService.getInstance();
    
    // Mock DB methods
    db.getSyncQueue = jest.fn().mockResolvedValue([]);
    db.removeFromSyncQueue = jest.fn().mockResolvedValue(undefined);
    db.saveTask = jest.fn().mockResolvedValue(undefined);
    db.log = jest.fn().mockResolvedValue(undefined);
    db.getAllTasks = jest.fn().mockResolvedValue([]);
  });

  it('should not sync when offline', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
    
    await SyncEngine.getInstance().sync();
    
    expect(db.getSyncQueue).not.toHaveBeenCalled();
  });

  it('should process outbound queue when online', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    
    const mockQueueItem = {
      id: 1,
      action: 'create',
      taskId: 'task-123',
      payload: JSON.stringify({ title: 'New Task' }),
      retryCount: 0
    };
    
    (db.getSyncQueue as jest.Mock).mockResolvedValue([mockQueueItem]);
    
    // Mock finding the task in DB to update its status
    const mockTask: Task = {
      id: 'task-123',
      title: 'New Task',
      description: '',
      dueDate: '2026-04-19',
      startTime: null,
      endTime: null,
      priority: Priority.LOW,
      completed: false,
      completedAt: null,
      recurrence: Recurrence.NONE,
      reminder: { enabled: false, minutesBefore: 0, repeating: false },
      createdAt: new Date().toISOString(),
      notificationId: null,
      parentTaskId: null,
    };
    (db.getAllTasks as jest.Mock).mockResolvedValue([mockTask]);

    await SyncEngine.getInstance().sync();
    
    expect(db.getSyncQueue).toHaveBeenCalled();
    expect(db.removeFromSyncQueue).toHaveBeenCalledWith(1);
    expect(db.saveTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-123' }), 'synced');
  });

  it('should increment retry count on failure', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    
    const mockQueueItem = {
      id: 2,
      action: 'update',
      taskId: 'task-456',
      payload: JSON.stringify({ completed: true }),
      retryCount: 1
    };
    
    (db.getSyncQueue as jest.Mock).mockResolvedValue([mockQueueItem]);
    
    // Simulate a failure in the loop (e.g., db.removeFromSyncQueue throws)
    (db.removeFromSyncQueue as jest.Mock).mockRejectedValue(new Error('Network error'));
    (db.updateSyncQueueRetry as jest.Mock) = jest.fn().mockResolvedValue(undefined);

    await SyncEngine.getInstance().sync();
    
    expect(db.updateSyncQueueRetry).toHaveBeenCalledWith(2, 2);
    expect(db.log).toHaveBeenCalledWith('warn', expect.stringContaining('Retry 2'), expect.anything());
  });
});
