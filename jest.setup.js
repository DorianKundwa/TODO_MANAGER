import 'react-native-gesture-handler/jestSetup';

// Mock react-native-get-random-values
jest.mock('react-native-get-random-values', () => ({}), { virtual: true });

// Mock uuid
let mockUuidCounter = 0;
jest.mock('uuid', () => ({
  v4: () => `mock-uuid-${mockUuidCounter++}`,
}), { virtual: true });

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));
