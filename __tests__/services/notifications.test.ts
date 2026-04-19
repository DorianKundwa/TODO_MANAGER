import * as Notifications from 'expo-notifications';
import { requestNotificationPermissions, scheduleTaskReminder, cancelTaskReminder } from '../../services/notifications';
import { Priority, Recurrence, Task } from '../../types/task';

describe('notifications service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestNotificationPermissions', () => {
    it('should request permissions and return true if granted', async () => {
      const result = await requestNotificationPermissions();
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('scheduleTaskReminder', () => {
    it('should return null if reminder is disabled', async () => {
      const task: Task = {
        id: '1',
        title: 'Test',
        description: '',
        dueDate: '2026-05-20',
        startTime: null,
        endTime: null,
        priority: Priority.LOW,
        completed: false,
        completedAt: null,
        recurrence: Recurrence.NONE,
        parentTaskId: null,
        reminder: { enabled: false, minutesBefore: 15, repeating: false },
        createdAt: '',
        notificationId: null,
      };

      const result = await scheduleTaskReminder(task);
      expect(result).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('should schedule a notification for a future task', async () => {
      // Set a date in the future for the test
      const futureDate = '2026-12-31';
      const task: Task = {
        id: '1',
        title: 'Future Task',
        description: 'Details',
        dueDate: futureDate,
        startTime: '10:00',
        endTime: null,
        priority: Priority.HIGH,
        completed: false,
        completedAt: null,
        recurrence: Recurrence.NONE,
        parentTaskId: null,
        reminder: { enabled: true, minutesBefore: 15, repeating: false },
        createdAt: '',
        notificationId: null,
      };

      const result = await scheduleTaskReminder(task);
      expect(result).toBe('mock-notif-id');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.objectContaining({
          title: '📋 Task Reminder',
          body: 'Future Task',
        }),
      }));
    });

    it('should not schedule a notification for a past time', async () => {
      const task: Task = {
        id: '1',
        title: 'Past Task',
        description: '',
        dueDate: '2020-01-01',
        startTime: '08:00',
        endTime: null,
        priority: Priority.LOW,
        completed: false,
        completedAt: null,
        recurrence: Recurrence.NONE,
        parentTaskId: null,
        reminder: { enabled: true, minutesBefore: 15, repeating: false },
        createdAt: '',
        notificationId: null,
      };

      const result = await scheduleTaskReminder(task);
      expect(result).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('should not include subtitle if description is empty', async () => {
      const task: Task = {
        id: '1',
        title: 'No Description Task',
        description: '',
        dueDate: '2026-12-31',
        startTime: '10:00',
        endTime: null,
        priority: Priority.MEDIUM,
        completed: false,
        completedAt: null,
        recurrence: Recurrence.NONE,
        parentTaskId: null,
        reminder: { enabled: true, minutesBefore: 15, repeating: false },
        createdAt: '',
        notificationId: null,
      };

      await scheduleTaskReminder(task);
      
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.content.subtitle).toBeUndefined();
    });
  });

  describe('cancelTaskReminder', () => {
    it('should call cancelScheduledNotificationAsync if id is provided', async () => {
      await cancelTaskReminder('some-id');
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('some-id');
    });

    it('should not call cancelScheduledNotificationAsync if id is null', async () => {
      await cancelTaskReminder(null);
      expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });
  });
});
