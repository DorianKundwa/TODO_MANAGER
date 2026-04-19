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
        // Implement retry logic or mark as failed for manual intervention
      }
    }
  }

  private async fetchInboundChanges(db: DatabaseService) {
    // This is where we would fetch data from the server
    // const serverChanges = await api.getRecentChanges(lastSyncedAt);
    
    // For each server change:
    // 1. Check if local version exists
    // 2. Resolve conflicts (Server-wins or Client-wins strategy)
    // 3. Update local DB
  }

  /**
   * Simple conflict resolution: Server Wins (Default)
   */
  private resolveConflict(local: Task, server: Task): Task {
    // Logic to compare timestamps and decide which version to keep
    // In a real app, we might ask the user or use last-write-wins.
    return server;
  }
}
