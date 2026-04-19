/**
 * Zustand store for task management.
 * Combines state, actions, and persistence via AsyncStorage.
 * This is the single source of truth for all task data.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Priority, Recurrence, FilterType, CompletionStats } from '../types/task';
import { isToday, isFuture } from '../utils/dateHelpers';
import { generateId } from '../utils/idGenerator';
import { processRecurringTasks } from '../services/recurringTasks';
import { scheduleTaskReminder, cancelTaskReminder } from '../services/notifications';
import { DatabaseService } from '../services/database/DatabaseService';
import { SyncEngine } from '../services/SyncEngine';

interface TaskStore {
  // ── State ──────────────────────────────────────────────
  tasks: Task[];
  filter: FilterType;
  searchQuery: string;
  darkMode: boolean;
  hasLoadedInitially: boolean;
  syncing: boolean;
  lastError: string | null;

  // ── Actions ────────────────────────────────────────────
  initStore: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'notificationId'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  setFilter: (filter: FilterType) => void;
  setSearchQuery: (query: string) => void;
  toggleDarkMode: () => void;
  clearCompleted: () => Promise<void>;
  processRecurring: () => Promise<void>;
  setHasLoaded: () => void;
  syncData: () => Promise<void>;

  // ── Computed (selectors) ───────────────────────────────
  getFilteredTasks: () => Task[];
  getTodayStats: () => CompletionStats;
  getTasksByDate: (date: string) => Task[];
  getTaskById: (id: string) => Task | undefined;
  getMarkedDates: () => Record<string, any>;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ────────────────────────────────────
      tasks: [],
      filter: 'all',
      searchQuery: '',
      darkMode: true, // Default to dark mode for that sleek feel
      hasLoadedInitially: false,
      syncing: false,
      lastError: null,

      // ── Actions ──────────────────────────────────────────

      /** Load initial data from SQLite */
      initStore: async () => {
        try {
          const db = await DatabaseService.getInstance();
          const tasks = await db.getAllTasks();
          set({ tasks, hasLoadedInitially: true });
        } catch (error) {
          console.error('[Store] Failed to init store:', error);
        }
      },

      /** Add a new task with auto-generated id and timestamps */
      addTask: async (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: generateId(),
          completed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          notificationId: null,
        };

        // Optimistic update
        set((state) => ({ tasks: [newTask, ...state.tasks] }));

        try {
          const db = await DatabaseService.getInstance();
          
          // Schedule notification if reminder is enabled
          if (newTask.reminder.enabled) {
            const notifId = await scheduleTaskReminder(newTask);
            if (notifId) {
              newTask.notificationId = notifId;
              set((state) => ({
                tasks: state.tasks.map((t) =>
                  t.id === newTask.id ? { ...t, notificationId: notifId } : t
                ),
              }));
            }
          }

          await db.saveTask(newTask, 'pending_create');
          await db.addToSyncQueue('create', newTask.id, newTask);
          
          // Trigger background sync
          get().syncData();
        } catch (error) {
          set({ lastError: 'Failed to add task' });
          // Rollback
          set((state) => ({ tasks: state.tasks.filter(t => t.id !== newTask.id) }));
        }
      },

      /** Update specific fields on an existing task */
      updateTask: async (id, updates) => {
        const originalTask = get().tasks.find((t) => t.id === id);
        if (!originalTask) return;

        // Optimistic update
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));

        try {
          const db = await DatabaseService.getInstance();
          
          // Cancel old notification if reminder changed
          if (updates.reminder !== undefined || updates.dueDate !== undefined || updates.startTime !== undefined) {
            await cancelTaskReminder(originalTask.notificationId);
          }

          // Reschedule notification if needed
          const updatedTask = { ...originalTask, ...updates };
          if (updatedTask.reminder.enabled && !updatedTask.completed) {
            const notifId = await scheduleTaskReminder(updatedTask);
            if (notifId) {
              updatedTask.notificationId = notifId;
              set((state) => ({
                tasks: state.tasks.map((t) =>
                  t.id === id ? { ...t, notificationId: notifId } : t
                ),
              }));
            }
          }

          await db.saveTask(updatedTask, 'pending_update');
          await db.addToSyncQueue('update', id, updates);
          get().syncData();
        } catch (error) {
          set({ lastError: 'Failed to update task' });
          // Rollback
          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? originalTask : t)
          }));
        }
      },

      /** Delete a task and cancel its notification */
      deleteTask: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        // Optimistic delete
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));

        try {
          const db = await DatabaseService.getInstance();
          if (task.notificationId) {
            await cancelTaskReminder(task.notificationId);
          }
          await db.deleteTask(id);
          await db.addToSyncQueue('delete', id);
          get().syncData();
        } catch (error) {
          set({ lastError: 'Failed to delete task' });
          // Rollback
          set((state) => ({ tasks: [...state.tasks, task] }));
        }
      },

      /** Toggle a task's completion status */
      toggleComplete: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const originalCompleted = task.completed;
        const newCompleted = !originalCompleted;

        // Optimistic toggle
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t;
            return {
              ...t,
              completed: newCompleted,
              completedAt: newCompleted ? new Date().toISOString() : null,
            };
          }),
        }));

        try {
          const db = await DatabaseService.getInstance();
          const updatedTask = get().tasks.find(t => t.id === id)!;
          
          await db.saveTask(updatedTask, 'pending_update');
          await db.addToSyncQueue('update', id, { completed: newCompleted, completedAt: updatedTask.completedAt });

          if (newCompleted && updatedTask.recurrence !== Recurrence.NONE) {
            await get().processRecurring();
          }
          
          get().syncData();
        } catch (error) {
          set({ lastError: 'Failed to toggle status' });
          // Rollback
          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? task : t)
          }));
        }
      },

      /** Set the current filter view */
      setFilter: (filter) => set({ filter }),

      /** Set the search query */
      setSearchQuery: (query) => set({ searchQuery: query }),

      /** Toggle between light and dark theme */
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      /** Remove all completed tasks */
      clearCompleted: async () => {
        const completedTasks = get().tasks.filter((t) => t.completed);
        
        // Optimistic update
        set((state) => ({
          tasks: state.tasks.filter((t) => !t.completed),
        }));

        try {
          const db = await DatabaseService.getInstance();
          for (const t of completedTasks) {
            if (t.notificationId) await cancelTaskReminder(t.notificationId);
            await db.deleteTask(t.id);
            await db.addToSyncQueue('delete', t.id);
          }
          get().syncData();
        } catch (error) {
          set({ lastError: 'Failed to clear completed' });
          set((state) => ({ tasks: [...state.tasks, ...completedTasks] }));
        }
      },

      /** Generate new instances of completed recurring tasks */
      processRecurring: async () => {
        const { tasks } = get();
        const newTasks = processRecurringTasks(tasks);
        
        if (newTasks.length > 0) {
          try {
            const db = await DatabaseService.getInstance();
            
            // Schedule notifications and save to DB
            const tasksWithNotifs = await Promise.all(
              newTasks.map(async (task) => {
                let notifId = null;
                if (task.reminder.enabled) {
                  notifId = await scheduleTaskReminder(task);
                }
                const taskToSave = { ...task, notificationId: notifId };
                await db.saveTask(taskToSave, 'pending_create');
                await db.addToSyncQueue('create', task.id, taskToSave);
                return taskToSave;
              })
            );

            set((state) => ({
              tasks: [...tasksWithNotifs, ...state.tasks],
            }));
            
            get().syncData();
          } catch (error) {
            console.error('[Store] Failed to process recurring:', error);
          }
        }
      },

      /** Sync data using the SyncEngine */
      syncData: async () => {
        set({ syncing: true });
        try {
          await SyncEngine.getInstance().sync();
          // Reload from DB after sync to get server changes
          const db = await DatabaseService.getInstance();
          const tasks = await db.getAllTasks();
          set({ tasks });
        } finally {
          set({ syncing: false });
        }
      },

      /** Mark initial load as complete */
      setHasLoaded: () => set({ hasLoadedInitially: true }),

      // ── Selectors ────────────────────────────────────────

      /** Get tasks filtered by current filter and search query */
      getFilteredTasks: () => {
        const { tasks, filter, searchQuery } = get();
        let filtered = [...tasks];

        // Apply filter
        switch (filter) {
          case 'today':
            filtered = filtered.filter((t) => isToday(t.dueDate));
            break;
          case 'upcoming':
            filtered = filtered.filter((t) => isFuture(t.dueDate));
            break;
          case 'completed':
            filtered = filtered.filter((t) => t.completed);
            break;
          case 'all':
          default:
            // Show all tasks (completed and uncompleted)
            break;
        }

        // Apply search
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.title.toLowerCase().includes(query) ||
              t.description.toLowerCase().includes(query)
          );
        }

        // Sort: high priority first, then by due date
        filtered.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (pDiff !== 0) return pDiff;
          return a.dueDate.localeCompare(b.dueDate);
        });

        return filtered;
      },

      /** Get completion statistics for today */
      getTodayStats: () => {
        const { tasks } = get();
        const todayTasks = tasks.filter((t) => isToday(t.dueDate));
        const completed = todayTasks.filter((t) => t.completed).length;
        const total = todayTasks.length;
        return {
          total,
          completed,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      },

      /** Get tasks for a specific date */
      getTasksByDate: (date) => {
        const { tasks } = get();
        return tasks.filter((t) => t.dueDate === date);
      },

      /** Find a task by its unique ID */
      getTaskById: (id) => {
        const { tasks } = get();
        return tasks.find((t) => t.id === id);
      },

      /** Get an object of dates with task counts for calendar marking */
      getMarkedDates: () => {
        const { tasks, darkMode } = get();
        const marked: Record<string, any> = {};

        tasks.forEach((task) => {
          if (!marked[task.dueDate]) {
            marked[task.dueDate] = { dots: [] };
          }

          // Add a dot for each task, max 3 dots
          if (marked[task.dueDate].dots.length < 3) {
            const dotColor = {
              high: darkMode ? '#FF5252' : '#D32F2F',
              medium: darkMode ? '#FFD740' : '#F57C00',
              low: darkMode ? '#69F0AE' : '#388E3C',
            }[task.priority];

            marked[task.dueDate].dots.push({ key: task.id, color: dotColor });
          }
        });

        return marked;
      },
    }),
    {
      name: 'taskflow-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist UI preferences, data is in SQLite
      partialize: (state) => ({ 
        darkMode: state.darkMode, 
        filter: state.filter 
      }),
    }
  )
);
