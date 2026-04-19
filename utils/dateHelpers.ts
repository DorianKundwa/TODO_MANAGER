/**
 * Date formatting and utility functions.
 * All dates are stored as ISO strings; these helpers format for display.
 */

/**
 * Format a date string (YYYY-MM-DD) into a readable format.
 * Example: "2026-04-19" → "Apr 19, 2026"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Format a time string (HH:mm) into 12-hour format.
 * Example: "14:30" → "2:30 PM"
 */
export function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get today's date in YYYY-MM-DD format.
 */
export function getToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Check if a date string is today.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getToday();
}

/**
 * Check if a date string is in the future (after today).
 */
export function isFuture(dateStr: string): boolean {
  return dateStr > getToday();
}

/**
 * Check if a date string is past (before today).
 */
export function isPast(dateStr: string): boolean {
  return dateStr < getToday();
}

/**
 * Check if a date is today or in the future.
 */
export function isTodayOrFuture(dateStr: string): boolean {
  return dateStr >= getToday();
}

/**
 * Get a human-readable relative date label.
 * "Today", "Tomorrow", "Yesterday", or the formatted date.
 */
export function getRelativeDate(dateStr: string): string {
  const today = getToday();
  if (dateStr === today) return 'Today';

  const todayDate = new Date(today + 'T00:00:00');
  const targetDate = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return formatDate(dateStr);
}

/**
 * Add days/weeks/months to a date string and return new YYYY-MM-DD.
 * Used by recurrence engine.
 */
export function addToDate(
  dateStr: string,
  amount: number,
  unit: 'days' | 'weeks' | 'months'
): string {
  const date = new Date(dateStr + 'T00:00:00');
  switch (unit) {
    case 'days':
      date.setDate(date.getDate() + amount);
      break;
    case 'weeks':
      date.setDate(date.getDate() + amount * 7);
      break;
    case 'months':
      date.setMonth(date.getMonth() + amount);
      break;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Get the day-of-week name for a date string.
 */
export function getDayOfWeek(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(dateStr + 'T00:00:00');
  return days[date.getDay()];
}

/**
 * Get a greeting based on time of day.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
