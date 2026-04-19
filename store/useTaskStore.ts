/**
 * Zustand store for task management.
 * Combines state, actions, and persistence via AsyncStorage.
 * This is the single source of truth for all task data.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Priority, Recurrence, FilterType, CompletionStats } from '../types/task';
import { getToday, isToday, isFuture } from '../utils/dateHelpers';
import { generateId } from '../utils/idGenerator';
import { processRecurringTasks } from '../services/recurringTasks';
import { scheduleTaskReminder, cancelTaskReminder } from '../services/notifications';

interface TaskStore {
  // ── State ──────────────────────────────────────────────
  tasks: Task[];
  filter: FilterType;
  searchQuery: string;
  darkMode: boolean;
  hasLoadedInitially: boolean;

  // ── Actions ────────────────────────────────────────────
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'notificationId'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  setFilter: (filter: FilterType) => void;
  setSearchQuery: (query: string) => void;
  toggleDarkMode: () => void;
  clearCompleted: () => void;
  processRecurring: () => void;
  setHasLoaded: () => void;

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

      // ── Actions ──────────────────────────────────────────

      /** Add a new task with auto-generated id and timestamps */
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: generateId(),
          completed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          notificationId: null,
        };

        set((state) => ({ tasks: [newTask, ...state.tasks] }));

        // Schedule notification if reminder is enabled
        if (newTask.reminder.enabled) {
          scheduleTaskReminder(newTask).then((notifId) => {
            if (notifId) {
              set((state) => ({
                tasks: state.tasks.map((t) =>
                  t.id === newTask.id ? { ...t, notificationId: notifId } : t
                ),
              }));
            }
          });
        }
      },

      /** Update specific fields on an existing task */
      updateTask: (id, updates) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        // Cancel old notification if reminder changed
        if (updates.reminder !== undefined || updates.dueDate !== undefined || updates.startTime !== undefined) {
          cancelTaskReminder(task.notificationId);
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));

        // Reschedule notification if needed
        const updatedTask = { ...task, ...updates };
        if (updatedTask.reminder.enabled && !updatedTask.completed) {
          scheduleTaskReminder(updatedTask).then((notifId) => {
            if (notifId) {
              set((state) => ({
                tasks: state.tasks.map((t) =>
                  t.id === id ? { ...t, notificationId: notifId } : t
                ),
              }));
            }
          });
        }
      },

      /** Delete a task and cancel its notification */
      deleteTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (task?.notificationId) {
          cancelTaskReminder(task.notificationId);
        }
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      /** Toggle a task's completion status */
      toggleComplete: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t;
            const completed = !t.completed;
            return {
              ...t,
              completed,
              completedAt: completed ? new Date().toISOString() : null,
            };
          }),
        }));

        // Process recurring tasks after completion
        const task = get().tasks.find((t) => t.id === id);
        if (task?.completed && task.recurrence !== Recurrence.NONE) {
          get().processRecurring();
        }
      },

      /** Set the current filter view */
      setFilter: (filter) => set({ filter }),

      /** Set the search query */
      setSearchQuery: (query) => set({ searchQuery: query }),

      /** Toggle between light and dark theme */
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      /** Remove all completed tasks */
      clearCompleted: () => {
        const completedTasks = get().tasks.filter((t) => t.completed);
        completedTasks.forEach((t) => {
          if (t.notificationId) cancelTaskReminder(t.notificationId);
        });
        set((state) => ({
          tasks: state.tasks.filter((t) => !t.completed),
        }));
      },

      /** Generate new instances of completed recurring tasks */
      processRecurring: () => {
        const { tasks } = get();
        const newTasks = processRecurringTasks(tasks);
        if (newTasks.length > 0) {
          set((state) => ({ tasks: [...newTasks, ...state.tasks] }));

          // Schedule notifications for new recurring tasks
          newTasks.forEach((task) => {
            if (task.reminder.enabled) {
              scheduleTaskReminder(task).then((notifId) => {
                if (notifId) {
                  set((state) => ({
                    tasks: state.tasks.map((t) =>
                      t.id === task.id ? { ...t, notificationId: notifId } : t
                    ),
                  }));
                }
              });
            }
          });
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
            filtered = filtered.filter((t) => isToday(t.dueDate) && !t.completed);
            break;
          case 'upcoming':
            filtered = filtered.filter((t) => isFuture(t.dueDate) && !t.completed);
            break;
          case 'completed':
            filtered = filtered.filter((t) => t.completed);
            break;
          case 'all':
          default:
            filtered = filtered.filter((t) => !t.completed);
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

      /** Get all tasks for a specific date */
      getTasksByDate: (date: string) => {
        return get().tasks.filter((t) => t.dueDate === date);
      },

      /** Find a single task by ID */
      getTaskById: (id: string) => {
        return get().tasks.find((t) => t.id === id);
      },

      /** Generate marked dates object for react-native-calendars */
      getMarkedDates: () => {
        const { tasks } = get();
        const marked: Record<string, any> = {};

        tasks.forEach((task) => {
          if (!marked[task.dueDate]) {
            marked[task.dueDate] = { dots: [], marked: true };
          }

          const priorityColors: Record<string, string> = {
            high: '#F43F5E',
            medium: '#FBBF24',
            low: '#2DD4BF',
          };

          // Add a dot for this task's priority (max 3 dots per date)
          if (marked[task.dueDate].dots.length < 3) {
            marked[task.dueDate].dots.push({
              key: task.id,
              color: task.completed ? '#6B6B85' : priorityColors[task.priority],
            });
          }
        });

        return marked;
      },
    }),
    {
      name: '@taskflow/store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these fields (not UI state like filter/search)
      partialize: (state) => ({
        tasks: state.tasks,
        darkMode: state.darkMode,
      }),
    }
  )
);
