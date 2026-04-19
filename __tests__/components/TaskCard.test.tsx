import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TaskCard from '../../components/TaskCard';
import { Priority, Recurrence, Task } from '../../types/task';
import { useTaskStore } from '../../store/useTaskStore';

// Mock useTaskStore
jest.mock('../../store/useTaskStore');

describe('TaskCard Component', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Desc',
    dueDate: '2026-04-19',
    startTime: '10:00',
    endTime: '11:00',
    priority: Priority.HIGH,
    completed: false,
    completedAt: null,
    recurrence: Recurrence.NONE,
    reminder: { enabled: true, minutesBefore: 15, repeating: false },
    createdAt: new Date().toISOString(),
    notificationId: null,
    parentTaskId: null,
    syncStatus: 'synced'
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTaskStore as unknown as jest.Mock).mockReturnValue({
      toggleComplete: jest.fn(),
      deleteTask: jest.fn(),
      darkMode: true
    });
  });

  it('renders correctly', () => {
    const { getByText } = render(<TaskCard task={mockTask} onPress={mockOnPress} />);
    expect(getByText('Test Task')).toBeTruthy();
    expect(getByText('Test Desc')).toBeTruthy();
  });

  it('shows activity indicator when syncing', () => {
    const syncingTask = { ...mockTask, syncStatus: 'pending_create' as const };
    const { getByTestId } = render(
      <TaskCard task={syncingTask} onPress={mockOnPress} />
    );
    expect(getByTestId('task-sync-indicator')).toBeTruthy();
  });

  it('does not show activity indicator when synced', () => {
    const { queryByTestId } = render(
      <TaskCard task={mockTask} onPress={mockOnPress} />
    );
    expect(queryByTestId('task-sync-indicator')).toBeNull();
  });

  it('calls onPress when clicked', () => {
    const { getByText } = render(<TaskCard task={mockTask} onPress={mockOnPress} />);
    fireEvent.press(getByText('Test Task'));
    expect(mockOnPress).toHaveBeenCalledWith(mockTask);
  });
});
