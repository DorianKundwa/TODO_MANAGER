import { DatabaseService } from './database/DatabaseService';
import { Task } from '../types/task';
import NetInfo from '@react-native-community/netinfo';

export class SyncEngine {
  private static instance: SyncEngine;
  private isSyncing: boolean = false;

  private constructor() {}

  static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  /**
   * Main sync method to be called when app comes online or periodically.
   */
  async sync(): Promise<void> {
    if (this.isSyncing) return;
    
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    this.isSyncing = true;
    const db = await DatabaseService.getInstance();
    
    try {
      await db.log('info', '[Sync] Starting bi-directional sync');
      
      // 1. Process outbound queue
      await this.processOutboundQueue(db);
      
      // 2. Fetch inbound changes from server
      await this.fetchInboundChanges(db);
      
      await db.setLastSyncedAt(new Date().toISOString());
      await db.log('info', '[Sync] Sync completed successfully');
    } catch (error) {
      await db.log('error', '[Sync] Sync failed', error);
      console.error('[Sync] Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async processOutboundQueue(db: DatabaseService) {
    const queue = await db.getSyncQueue();
    if (queue.length === 0) return;

    for (const item of queue) {
      const retryCount = item.retryCount || 0;
      if (retryCount >= 5) {
        await db.log('error', `[Sync] Max retries reached for item ${item.id}`, item);
        continue;
      }

      try {
        // Simulate server request
        // const response = await api.syncAction(item.action, item.taskId, JSON.parse(item.payload));
        
        // On success:
        await db.removeFromSyncQueue(item.id);
        
        if (item.action === 'delete') {
          await db.deleteTask(item.taskId, false); // Hard delete
        } else {
          // Update status to synced
          const tasks = await db.getAllTasks();
          const task = tasks.find(t => t.id === item.taskId);
          if (task) {
            await db.saveTask(task, 'synced');
          }
        }
      } catch (error) {
        console.error(`[Sync] Failed to sync item ${item.id}:`, error);
        // Increment retry count
        await db.updateSyncQueueRetry(item.id, retryCount + 1);
        await db.log('warn', `[Sync] Retry ${retryCount + 1} for item ${item.id}`, { error });
      }
    }
  }

  private async fetchInboundChanges(db: DatabaseService) {
    // This is where we would fetch data from the server
    // const lastSyncedAt = await db.getLastSyncedAt();
    // const serverChanges = await api.getRecentChanges(lastSyncedAt);
    
    // For simulation: assume no new server changes
    const serverChanges: any[] = []; 
    
    for (const serverTask of serverChanges) {
      const localTasks = await db.getAllTasks();
      const localTask = localTasks.find(t => t.id === serverTask.id);
      
      if (!localTask) {
        // Task doesn't exist locally, just create it
        await db.saveTask(serverTask, 'synced');
      } else {
        // Task exists locally, check for conflicts
        if (localTask.syncStatus === 'synced') {
          // Local is already synced, just update with server version
          await db.saveTask(serverTask, 'synced');
        } else {
          // Local has pending changes, resolve conflict
          const resolvedTask = this.resolveConflict(localTask, serverTask);
          await db.saveTask(resolvedTask, 'synced');
          // If we resolved in favor of server or a merge, we should clear local queue
          // In this simple version, we assume server-wins/last-write-wins
        }
      }
    }
  }

  /**
   * Conflict resolution strategy: Last-Write-Wins (LWW)
   */
  private resolveConflict(local: Task, server: Task): Task {
    const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : new Date(local.createdAt).getTime();
    const serverTime = server.updatedAt ? new Date(server.updatedAt).getTime() : new Date(server.createdAt).getTime();
    
    return serverTime >= localTime ? server : local;
  }
}
