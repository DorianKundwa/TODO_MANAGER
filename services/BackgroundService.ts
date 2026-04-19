import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { DatabaseService } from './database/DatabaseService';
import { scheduleTaskReminder } from './notifications';
import { processRecurringTasks } from './recurringTasks';

const REMINDER_CHECK_TASK = 'BACKGROUND_REMINDER_CHECK';
const SYNC_TASK = 'BACKGROUND_SYNC';

export class BackgroundService {
  private static instance: BackgroundService;

  private constructor() {}

  static getInstance(): BackgroundService {
    if (!BackgroundService.instance) {
      BackgroundService.instance = new BackgroundService();
    }
    return BackgroundService.instance;
  }

  async init() {
    this.defineTasks();
    await this.registerTasks();
  }

  private defineTasks() {
    // Task to check for reminders that need scheduling or execution
    TaskManager.defineTask(REMINDER_CHECK_TASK, async () => {
      try {
        const db = await DatabaseService.getInstance();
        await db.log('info', '[Background] Running reminder check task');

        const tasks = await db.getAllTasks();
        
        // 1. Process recurring tasks
        const newRecurringTasks = processRecurringTasks(tasks);
        for (const task of newRecurringTasks) {
          await db.saveTask(task, 'pending_create');
          await db.addToSyncQueue('create', task.id, task);
        }

        // 2. Ensure all upcoming tasks have notifications scheduled
        const upcomingTasks = tasks.filter(t => !t.completed && t.reminder.enabled && !t.notificationId);
        for (const task of upcomingTasks) {
          const notifId = await scheduleTaskReminder(task);
          if (notifId) {
            await db.saveTask({ ...task, notificationId: notifId });
          }
        }

        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('[Background] Reminder check failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Task to sync data with server (placeholder for real sync engine)
    TaskManager.defineTask(SYNC_TASK, async () => {
      try {
        const db = await DatabaseService.getInstance();
        const queue = await db.getSyncQueue();
        
        if (queue.length === 0) return BackgroundFetch.BackgroundFetchResult.NoData;

        await db.log('info', `[Background] Syncing ${queue.length} items from queue`);
        
        // This is where bi-directional sync would happen.
        // For now, we simulate a successful sync.
        for (const item of queue) {
          // Simulate API call...
          await db.removeFromSyncQueue(item.id);
          
          if (item.action === 'delete') {
            await db.deleteTask(item.taskId, false); // Hard delete after sync
          } else {
            // Update syncStatus to 'synced'
            const tasks = await db.getAllTasks();
            const task = tasks.find(t => t.id === item.taskId);
            if (task) {
              await db.saveTask(task, 'synced');
            }
          }
        }

        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('[Background] Sync task failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }

  private async registerTasks() {
    try {
      // Register background fetch tasks
      await BackgroundFetch.registerTaskAsync(REMINDER_CHECK_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false, // Keep running after app is closed
        startOnBoot: true, // Start on device reboot
      });

      await BackgroundFetch.registerTaskAsync(SYNC_TASK, {
        minimumInterval: 60 * 60, // 1 hour
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('[Background] Tasks registered successfully');
    } catch (error) {
      console.error('[Background] Task registration failed:', error);
    }
  }

  async unregisterTasks() {
    await BackgroundFetch.unregisterTaskAsync(REMINDER_CHECK_TASK);
    await BackgroundFetch.unregisterTaskAsync(SYNC_TASK);
  }
}
