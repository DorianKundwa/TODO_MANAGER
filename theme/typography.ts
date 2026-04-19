/**
 * Typography definitions for consistent text styling.
 * Uses system fonts with fallback — Inter loads via expo-font in _layout.
 */

import { Platform } from 'react-native';

// Font families — uses system defaults that look modern on each platform
export const fonts = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }) as string,
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }) as string,
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }) as string,
};

// Font size scale
export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

// Font weight definitions
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Pre-built text style presets
export const textStyles = {
  h1: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: 18,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.5,
  },
  button: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.3,
  },
};
