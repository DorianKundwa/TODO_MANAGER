/**
 * Recurring tasks service.
 * Processes completed recurring tasks and generates new instances
 * with updated due dates based on the recurrence pattern.
 */

import { Task, Recurrence } from '../types/task';
import { addToDate, getToday } from '../utils/dateHelpers';
import { generateId } from '../utils/idGenerator';

/**
 * Check all tasks and generate new instances for completed recurring tasks.
 * Returns an array of new tasks to be added to the store.
 *
 * Logic:
 * - For each completed task with a recurrence pattern,
 *   generate a new uncompleted copy with the next due date.
 * - Only generates if the next due date hasn't already been created.
 */
export function processRecurringTasks(tasks: Task[]): Task[] {
  const newTasks: Task[] = [];
  const today = getToday();

  for (const task of tasks) {
    // Skip non-recurring or uncompleted tasks
    if (task.recurrence === Recurrence.NONE || !task.completed) {
      continue;
    }

    // Calculate the next due date based on recurrence type
    let nextDueDate: string;
    switch (task.recurrence) {
      case Recurrence.DAILY:
        nextDueDate = addToDate(task.dueDate, 1, 'days');
        break;
      case Recurrence.WEEKLY:
        nextDueDate = addToDate(task.dueDate, 1, 'weeks');
        break;
      case Recurrence.MONTHLY:
        nextDueDate = addToDate(task.dueDate, 1, 'months');
        break;
      default:
        continue;
    }

    // Check if a task with the same title and next due date already exists
    const alreadyExists = tasks.some(
      (t) => t.title === task.title && t.dueDate === nextDueDate && !t.completed
    );

    // Also check in the new tasks we're about to add
    const alreadyInNew = newTasks.some(
      (t) => t.title === task.title && t.dueDate === nextDueDate
    );

    if (!alreadyExists && !alreadyInNew) {
      // Create a new task instance with the next due date
      const newTask: Task = {
        ...task,
        id: generateId(),
        dueDate: nextDueDate,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        notificationId: null, // Will be scheduled separately
      };

      newTasks.push(newTask);
    }
  }

  return newTasks;
}

/**
 * Get the next occurrence date label for a recurring task.
 */
export function getNextOccurrenceLabel(task: Task): string | null {
  if (task.recurrence === Recurrence.NONE) return null;

  switch (task.recurrence) {
    case Recurrence.DAILY:
      return 'Repeats daily';
    case Recurrence.WEEKLY:
      return 'Repeats weekly';
    case Recurrence.MONTHLY:
      return 'Repeats monthly';
    default:
      return null;
  }
}
