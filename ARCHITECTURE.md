# TaskFlow Architecture Guide 📚

This document covers the architectural decisions and implementation details for the Background Reminders and Offline-First Sync system.

## 1. Data Layer (Offline-First)

### Database Service (`DatabaseService.ts`)
We use `expo-sqlite` as the primary data store.
- **Persistence**: Data survives app restarts and device reboots.
- **Encryption**: A unique encryption key is generated and stored in `expo-secure-store`.
- **Sync Tracking**: Each task has a `syncStatus` ('synced', 'pending_create', 'pending_update', 'pending_delete').
- **Soft Deletes**: Deleting a task marks it as `pending_delete` first to ensure the deletion can be synced to the server.

### Sync Queue
All offline mutations (Create, Update, Delete) are added to a `sync_queue` table.
- **Action**: The type of mutation.
- **Payload**: The data needed for the mutation.
- **Retry Logic**: Items include a `retryCount` (max 5 retries).

## 2. Sync Engine (`SyncEngine.ts`)

The sync engine handles bi-directional data synchronization.
- **Outbound**: Processes the `sync_queue` and sends local changes to the server.
- **Inbound**: Fetches server changes and merges them into the local database.
- **Conflict Resolution**: Currently uses a "Server Wins" strategy (can be extended to "Last Write Wins" or manual resolution).

## 3. Background Services (`BackgroundService.ts`)

Leverages `expo-task-manager` and `expo-background-fetch`.
- **Reminder Check**: Periodically (every 15 min) checks for upcoming tasks that need notifications.
- **Background Sync**: Periodically (every 1 hour) attempts to sync the `sync_queue` even if the app is closed.
- **Boot Support**: Tasks are registered with `startOnBoot: true`.

## 4. UI Patterns

### Optimistic Updates
The Zustand store (`useTaskStore.ts`) implements optimistic updates:
1. UI state is updated immediately.
2. Async database/sync operations start.
3. If an operation fails, the UI state is rolled back to the previous version.

### Sync Indicators
- **Global**: A spinner appears in the header during sync.
- **Per-Task**: Tasks in a non-synced state show a small activity indicator.
- **Errors**: Failed sync operations trigger a toast notification.

## 5. Troubleshooting

- **Sync Issues**: Check `app_logs` table in SQLite for detailed error contexts.
- **Background Tasks**: On iOS, background fetch is managed by the OS and might be throttled if battery is low.
- **Permissions**: Ensure both Notification and Background App Refresh permissions are granted.
