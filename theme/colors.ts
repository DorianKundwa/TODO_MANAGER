/**
 * Color palette for light and dark themes.
 * Uses curated HSL-based colors for a premium, modern look.
 */

export interface ColorPalette {
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Accent / Brand
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Priority colors
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;

  // Semantic
  success: string;
  warning: string;
  error: string;
  info: string;

  // UI elements
  border: string;
  divider: string;
  icon: string;
  iconMuted: string;
  overlay: string;

  // Tab bar
  tabBar: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;

  // Input
  inputBackground: string;
  inputBorder: string;
  placeholder: string;

  // Shadows
  shadow: string;
}

export const lightColors: ColorPalette = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',

  textPrimary: '#1A1A2E',
  textSecondary: '#4A4A6A',
  textMuted: '#9898B0',
  textInverse: '#FFFFFF',

  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4D45DB',

  priorityLow: '#2DD4BF',
  priorityMedium: '#FBBF24',
  priorityHigh: '#F43F5E',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  border: '#E5E5EA',
  divider: '#F0F0F5',
  icon: '#4A4A6A',
  iconMuted: '#C8C8D4',
  overlay: 'rgba(0, 0, 0, 0.4)',

  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E5EA',
  tabActive: '#6C63FF',
  tabInactive: '#9898B0',

  inputBackground: '#F5F5F7',
  inputBorder: '#E5E5EA',
  placeholder: '#9898B0',

  shadow: 'rgba(0, 0, 0, 0.08)',
};

export const darkColors: ColorPalette = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceElevated: '#252540',
  card: '#1E1E35',

  textPrimary: '#F0F0F5',
  textSecondary: '#B0B0C8',
  textMuted: '#6B6B85',
  textInverse: '#0F0F1A',

  primary: '#7C73FF',
  primaryLight: '#9B94FF',
  primaryDark: '#5B52E0',

  priorityLow: '#2DD4BF',
  priorityMedium: '#FBBF24',
  priorityHigh: '#FB7185',

  success: '#34D399',
  warning: '#FBBF24',
  error: '#FB7185',
  info: '#60A5FA',

  border: '#2A2A45',
  divider: '#252540',
  icon: '#B0B0C8',
  iconMuted: '#4A4A65',
  overlay: 'rgba(0, 0, 0, 0.6)',

  tabBar: '#1A1A2E',
  tabBarBorder: '#2A2A45',
  tabActive: '#7C73FF',
  tabInactive: '#6B6B85',

  inputBackground: '#252540',
  inputBorder: '#2A2A45',
  placeholder: '#6B6B85',

  shadow: 'rgba(0, 0, 0, 0.3)',
};

// Gradient presets for visual elements
export const gradients = {
  primary: ['#6C63FF', '#8B85FF'],
  primaryDark: ['#7C73FF', '#9B94FF'],
  success: ['#10B981', '#34D399'],
  danger: ['#F43F5E', '#FB7185'],
  warm: ['#F59E0B', '#FBBF24'],
  cool: ['#3B82F6', '#60A5FA'],
};
