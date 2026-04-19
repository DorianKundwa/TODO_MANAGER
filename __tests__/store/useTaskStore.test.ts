import { useTaskStore } from '../../store/useTaskStore';
import { Priority, Recurrence } from '../../types/task';

// Reset the store before each test
const initialState = useTaskStore.getState();

describe('useTaskStore', () => {
  beforeEach(() => {
    useTaskStore.setState(initialState, true);
  });

  it('should add a task', () => {
    const taskData = {
      title: 'Test Task',
      description: 'Test Description',
      dueDate: '2026-04-19',
      startTime: '10:00',
      endTime: '11:00',
      priority: Priority.MEDIUM,
      recurrence: Recurrence.NONE,
      parentTaskId: null,
      reminder: {
        enabled: false,
        minutesBefore: 15,
        repeating: false,
      },
    };

    useTaskStore.getState().addTask(taskData);
    const tasks = useTaskStore.getState().tasks;

    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Test Task');
    expect(tasks[0].id).toBeDefined();
    expect(tasks[0].completed).toBe(false);
  });

  it('should update a task', () => {
    const taskData = {
      title: 'Initial Title',
      description: '',
      dueDate: '2026-04-19',
      startTime: null,
      endTime: null,
      priority: Priority.LOW,
      recurrence: Recurrence.NONE,
      parentTaskId: null,
      reminder: { enabled: false, minutesBefore: 0, repeating: false },
    };

    useTaskStore.getState().addTask(taskData);
    const initialTask = useTaskStore.getState().tasks[0];

    useTaskStore.getState().updateTask(initialTask.id, { title: 'Updated Title' });
    const updatedTask = useTaskStore.getState().tasks[0];

    expect(updatedTask.title).toBe('Updated Title');
  });

  it('should delete a task', () => {
    const taskData = {
      title: 'Task to Delete',
      description: '',
      dueDate: '2026-04-19',
      startTime: null,
      endTime: null,
      priority: Priority.LOW,
      recurrence: Recurrence.NONE,
      parentTaskId: null,
      reminder: { enabled: false, minutesBefore: 0, repeating: false },
    };

    useTaskStore.getState().addTask(taskData);
    const task = useTaskStore.getState().tasks[0];

    useTaskStore.getState().deleteTask(task.id);
    expect(useTaskStore.getState().tasks.length).toBe(0);
  });

  it('should toggle task completion', () => {
    const taskData = {
      title: 'Toggle Task',
      description: '',
      dueDate: '2026-04-19',
      startTime: null,
      endTime: null,
      priority: Priority.LOW,
      recurrence: Recurrence.NONE,
      parentTaskId: null,
      reminder: { enabled: false, minutesBefore: 0, repeating: false },
    };

    useTaskStore.getState().addTask(taskData);
    const task = useTaskStore.getState().tasks[0];

    useTaskStore.getState().toggleComplete(task.id);
    expect(useTaskStore.getState().tasks[0].completed).toBe(true);
    expect(useTaskStore.getState().tasks[0].completedAt).not.toBeNull();

    useTaskStore.getState().toggleComplete(task.id);
    expect(useTaskStore.getState().tasks[0].completed).toBe(false);
    expect(useTaskStore.getState().tasks[0].completedAt).toBeNull();
  });

  it('should filter tasks by status', () => {
    const task1 = {
      title: 'Active Task',
      description: '',
      dueDate: '2026-04-19',
      startTime: null,
      endTime: null,
      priority: Priority.LOW,
      recurrence: Recurrence.NONE,
      parentTaskId: null,
      reminder: { enabled: false, minutesBefore: 0, repeating: false },
    };
    const task2 = {
      title: 'Completed Task',
      description: '',
      dueDate: '2026-04-19',
      startTime: null,
      endTime: null,
      priority: Priority.LOW,
      recurrence: Recurrence.NONE,
      parentTaskId: null,
      reminder: { enabled: false, minutesBefore: 0, repeating: false },
    };

    useTaskStore.getState().addTask(task1);
    useTaskStore.getState().addTask(task2);
    
    const secondTaskId = useTaskStore.getState().tasks[0].id;
    useTaskStore.getState().toggleComplete(secondTaskId);

    useTaskStore.getState().setFilter('completed');
    expect(useTaskStore.getState().getFilteredTasks().length).toBe(1);
    expect(useTaskStore.getState().getFilteredTasks()[0].completed).toBe(true);

    useTaskStore.getState().setFilter('all');
    expect(useTaskStore.getState().getFilteredTasks().length).toBe(2);
  });
});
