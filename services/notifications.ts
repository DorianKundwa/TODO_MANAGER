/**
 * Local notification service using expo-notifications.
 * Handles scheduling, cancelling, and permission requests for task reminders.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Task } from '../types/task';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user.
 * Returns true if permissions were granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('[Notifications] Must use physical device for push notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return false;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
    });
  }

  return true;
}

/**
 * Schedule a local notification for a task reminder.
 * Returns the notification identifier for later cancellation.
 */
export async function scheduleTaskReminder(task: Task): Promise<string | null> {
  if (!task.reminder.enabled || !task.dueDate) return null;

  try {
    // Calculate trigger date from due date and optional start time
    const [year, month, day] = task.dueDate.split('-').map(Number);
    let hours = 9; // Default to 9 AM if no time specified
    let minutes = 0;

    if (task.startTime) {
      const [h, m] = task.startTime.split(':').map(Number);
      hours = h;
      minutes = m;
    }

    const triggerDate = new Date(year, month - 1, day, hours, minutes);

    // Subtract the reminder offset
    triggerDate.setMinutes(triggerDate.getMinutes() - task.reminder.minutesBefore);

    // Don't schedule if the trigger time has already passed
    if (triggerDate.getTime() <= Date.now()) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Task Reminder',
        body: task.title,
        ...(task.description?.trim() ? { subtitle: task.description } : {}),
        data: { taskId: task.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('[Notifications] Error scheduling reminder:', error);
    return null;
  }
}

/**
 * Cancel a previously scheduled notification.
 */
export async function cancelTaskReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('[Notifications] Error cancelling reminder:', error);
  }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('[Notifications] Error cancelling all reminders:', error);
  }
}
