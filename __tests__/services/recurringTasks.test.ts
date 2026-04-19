/**
 * Tests for the recurring tasks service.
 */

import { processRecurringTasks, getNextOccurrenceLabel } from '../../services/recurringTasks';
import { Task, Priority, Recurrence } from '../../types/task';
import { getToday, addToDate } from '../../utils/dateHelpers';

const TODAY = getToday();

/** Helper to build a minimal Task object for testing */
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-id-1',
    title: 'Test Task',
    description: '',
    dueDate: TODAY,
    startTime: null,
    endTime: null,
    priority: Priority.MEDIUM,
    completed: false,
    completedAt: null,
    recurrence: Recurrence.NONE,
    reminder: { enabled: false, minutesBefore: 0, repeating: false },
    createdAt: new Date().toISOString(),
    notificationId: null,
    ...overrides,
  };
}

describe('processRecurringTasks', () => {
  it('returns empty array when no tasks are present', () => {
    expect(processRecurringTasks([])).toEqual([]);
  });

  it('returns empty array for non-recurring tasks', () => {
    const task = makeTask({ completed: true, recurrence: Recurrence.NONE });
    expect(processRecurringTasks([task])).toEqual([]);
  });

  it('returns empty array for recurring but uncompleted tasks', () => {
    const task = makeTask({ completed: false, recurrence: Recurrence.DAILY });
    expect(processRecurringTasks([task])).toEqual([]);
  });

  it('generates a daily next occurrence on completion', () => {
    const task = makeTask({ completed: true, recurrence: Recurrence.DAILY });
    const newTasks = processRecurringTasks([task]);
    expect(newTasks.length).toBe(1);
    expect(newTasks[0].dueDate).toBe(addToDate(TODAY, 1, 'days'));
    expect(newTasks[0].completed).toBe(false);
    expect(newTasks[0].id).not.toBe(task.id);
  });

  it('generates a weekly next occurrence on completion', () => {
    const task = makeTask({ completed: true, recurrence: Recurrence.WEEKLY });
    const newTasks = processRecurringTasks([task]);
    expect(newTasks.length).toBe(1);
    expect(newTasks[0].dueDate).toBe(addToDate(TODAY, 1, 'weeks'));
  });

  it('generates a monthly next occurrence on completion', () => {
    const task = makeTask({ completed: true, recurrence: Recurrence.MONTHLY });
    const newTasks = processRecurringTasks([task]);
    expect(newTasks.length).toBe(1);
    expect(newTasks[0].dueDate).toBe(addToDate(TODAY, 1, 'months'));
  });

  it('does not duplicate if next occurrence already exists', () => {
    const completedTask = makeTask({ id: 'id-1', completed: true, recurrence: Recurrence.DAILY });
    const nextDate = addToDate(TODAY, 1, 'days');
    const existingNext = makeTask({ id: 'id-2', completed: false, dueDate: nextDate, recurrence: Recurrence.DAILY });
    const newTasks = processRecurringTasks([completedTask, existingNext]);
    expect(newTasks.length).toBe(0);
  });
});

describe('getNextOccurrenceLabel', () => {
  it('returns null for non-recurring tasks', () => {
    const task = makeTask({ recurrence: Recurrence.NONE });
    expect(getNextOccurrenceLabel(task)).toBeNull();
  });

  it('returns "Repeats daily" for daily tasks', () => {
    const task = makeTask({ recurrence: Recurrence.DAILY });
    expect(getNextOccurrenceLabel(task)).toBe('Repeats daily');
  });

  it('returns "Repeats weekly" for weekly tasks', () => {
    const task = makeTask({ recurrence: Recurrence.WEEKLY });
    expect(getNextOccurrenceLabel(task)).toBe('Repeats weekly');
  });

  it('returns "Repeats monthly" for monthly tasks', () => {
    const task = makeTask({ recurrence: Recurrence.MONTHLY });
    expect(getNextOccurrenceLabel(task)).toBe('Repeats monthly');
  });
});
