/**
 * Add/Edit Task Screen — Form for creating or editing tasks.
 * Includes fields for title, description, date, time, priority, recurrence, and reminders.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../store/useTaskStore';
import { lightColors, darkColors } from '../theme/colors';
import { Priority, Recurrence } from '../types/task';
import { getToday, formatDate, formatTime } from '../utils/dateHelpers';
import { REMINDER_OPTIONS, PRIORITY_CONFIG, RECURRENCE_CONFIG } from '../constants';

export default function AddTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string }>();
  const insets = useSafeAreaInsets();
  const { addTask, updateTask, getTaskById, darkMode } = useTaskStore();
  const colors = darkMode ? darkColors : lightColors;

  // Check if we're editing an existing task
  const editingTask = params.editId ? getTaskById(params.editId) : null;
  const isEditing = !!editingTask;

  // ── Form state ─────────────────────────────────────────
  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [dueDate, setDueDate] = useState(editingTask?.dueDate || getToday());
  const [startTime, setStartTime] = useState<string | null>(editingTask?.startTime || null);
  const [endTime, setEndTime] = useState<string | null>(editingTask?.endTime || null);
  const [priority, setPriority] = useState<Priority>(editingTask?.priority || Priority.MEDIUM);
  const [recurrence, setRecurrence] = useState<Recurrence>(editingTask?.recurrence || Recurrence.NONE);
  const [reminderEnabled, setReminderEnabled] = useState(editingTask?.reminder.enabled || false);
  const [reminderMinutes, setReminderMinutes] = useState(editingTask?.reminder.minutesBefore || 15);

  // Date/time picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // ── Handlers ───────────────────────────────────────────

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a task title');
      return;
    }

    // Validate time range
    if (startTime && endTime) {
      if (endTime <= startTime) {
        Alert.alert('Invalid Time', 'End time must be later than start time');
        return;
      }
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      dueDate,
      startTime,
      endTime,
      priority,
      recurrence,
      reminder: {
        enabled: reminderEnabled,
        minutesBefore: reminderMinutes,
        repeating: recurrence !== Recurrence.NONE,
      },
    };

    if (isEditing && editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }

    router.back();
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      setDueDate(`${y}-${m}-${d}`);
    }
  };

  const handleStartTimeChange = (_event: any, selectedDate?: Date) => {
    setShowStartTimePicker(false);
    if (selectedDate) {
      const h = String(selectedDate.getHours()).padStart(2, '0');
      const m = String(selectedDate.getMinutes()).padStart(2, '0');
      setStartTime(`${h}:${m}`);
    }
  };

  const handleEndTimeChange = (_event: any, selectedDate?: Date) => {
    setShowEndTimePicker(false);
    if (selectedDate) {
      const h = String(selectedDate.getHours()).padStart(2, '0');
      const m = String(selectedDate.getMinutes()).padStart(2, '0');
      setEndTime(`${h}:${m}`);
    }
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {isEditing ? 'Edit Task' : 'New Task'}
        </Text>
        <TouchableOpacity onPress={handleSave} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Update' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.textPrimary,
              },
            ]}
            placeholder="What needs to be done?"
            placeholderTextColor={colors.placeholder}
            value={title}
            onChangeText={setTitle}
            autoFocus={!isEditing}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
          <TextInput
            style={[
              styles.textInput,
              styles.textArea,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Add details (optional)"
            placeholderTextColor={colors.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Due Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.pickerButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.pickerText, { color: colors.textPrimary }]}>
              {formatDate(dueDate)}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(dueDate + 'T00:00:00')}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
              themeVariant={darkMode ? 'dark' : 'light'}
            />
          )}
        </View>

        {/* Time Range */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Time (optional)</Text>
          <View style={styles.timeRow}>
            <TouchableOpacity
              onPress={() => setShowStartTimePicker(true)}
              style={[styles.pickerButton, styles.timeButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
            >
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={[styles.pickerText, { color: startTime ? colors.textPrimary : colors.placeholder }]}>
                {startTime ? formatTime(startTime) : 'Start'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.timeSeparator, { color: colors.textMuted }]}>→</Text>

            <TouchableOpacity
              onPress={() => setShowEndTimePicker(true)}
              style={[styles.pickerButton, styles.timeButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
            >
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={[styles.pickerText, { color: endTime ? colors.textPrimary : colors.placeholder }]}>
                {endTime ? formatTime(endTime) : 'End'}
              </Text>
            </TouchableOpacity>

            {/* Clear time button */}
            {(startTime || endTime) && (
              <TouchableOpacity
                onPress={() => { setStartTime(null); setEndTime(null); }}
                style={styles.clearTimeButton}
              >
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          {showStartTimePicker && (
            <DateTimePicker
              value={startTime ? new Date(`2000-01-01T${startTime}:00`) : new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartTimeChange}
              themeVariant={darkMode ? 'dark' : 'light'}
            />
          )}
          {showEndTimePicker && (
            <DateTimePicker
              value={endTime ? new Date(`2000-01-01T${endTime}:00`) : new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndTimeChange}
              themeVariant={darkMode ? 'dark' : 'light'}
            />
          )}
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
          <View style={styles.optionRow}>
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
              const isActive = priority === key;
              const pColor = {
                low: colors.priorityLow,
                medium: colors.priorityMedium,
                high: colors.priorityHigh,
              }[key]!;

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setPriority(key as Priority)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: isActive ? pColor + '20' : colors.surfaceElevated,
                      borderColor: isActive ? pColor : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.optionEmoji}>{config.emoji}</Text>
                  <Text
                    style={[
                      styles.optionText,
                      { color: isActive ? pColor : colors.textSecondary },
                    ]}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recurrence */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Repeat</Text>
          <View style={styles.optionRow}>
            {Object.entries(RECURRENCE_CONFIG).map(([key, config]) => {
              const isActive = recurrence === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setRecurrence(key as Recurrence)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: isActive ? colors.primary + '20' : colors.surfaceElevated,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {config.emoji ? <Text style={styles.optionEmoji}>{config.emoji}</Text> : null}
                  <Text
                    style={[
                      styles.optionText,
                      { color: isActive ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reminder */}
        <View style={styles.section}>
          <View style={styles.reminderHeader}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Reminder</Text>
            <TouchableOpacity
              onPress={() => setReminderEnabled(!reminderEnabled)}
              style={[
                styles.toggle,
                {
                  backgroundColor: reminderEnabled ? colors.primary : colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  {
                    transform: [{ translateX: reminderEnabled ? 18 : 2 }],
                  },
                ]}
              />
            </TouchableOpacity>
          </View>

          {reminderEnabled && (
            <View style={styles.reminderOptions}>
              {REMINDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setReminderMinutes(option.value)}
                  style={[
                    styles.reminderChip,
                    {
                      backgroundColor:
                        reminderMinutes === option.value
                          ? colors.primary + '20'
                          : colors.surfaceElevated,
                      borderColor:
                        reminderMinutes === option.value
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.reminderChipText,
                      {
                        color:
                          reminderMinutes === option.value
                            ? colors.primary
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  section: {
    marginBottom: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  pickerText: {
    fontSize: 15,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeButton: {
    flex: 1,
  },
  timeSeparator: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearTimeButton: {
    padding: 4,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  optionEmoji: {
    fontSize: 14,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  reminderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  reminderChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
