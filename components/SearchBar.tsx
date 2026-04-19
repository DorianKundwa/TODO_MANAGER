/**
 * SearchBar — Expandable search input with filter chip row.
 */

import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../store/useTaskStore';
import { lightColors, darkColors } from '../theme/colors';
import { FilterType } from '../types/task';

const FILTERS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'list-outline' },
  { key: 'today', label: 'Today', icon: 'today-outline' },
  { key: 'upcoming', label: 'Upcoming', icon: 'arrow-forward-outline' },
  { key: 'completed', label: 'Done', icon: 'checkmark-done-outline' },
];

export default function SearchBar() {
  const { searchQuery, setSearchQuery, filter, setFilter, darkMode } = useTaskStore();
  const colors = darkMode ? darkColors : lightColors;

  return (
    <View style={styles.container}>
      {/* Search input */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
          },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={colors.placeholder} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Search tasks..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary : colors.surfaceElevated,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={f.icon as any}
                size={14}
                color={isActive ? '#FFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? '#FFF' : colors.textSecondary },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
