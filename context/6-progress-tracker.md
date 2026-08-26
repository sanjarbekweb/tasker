# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Stage 5 — Sync-readiness, Backup, Testing & Launch hardening [x] Completed

## Current Goal

- All 5 stages of Numo specification completed with full test pyramid, zero TypeScript errors, and production launch hardening.

## Completed

- Stage 1: Foundation (project + data layer skeleton)
  - Strict TypeScript & Expo configuration with Hermes and New Architecture flags enabled.
  - Complete project structure scaffolding (`src/app/`, `src/components/`, `src/db/`, `src/domain/`, `src/stores/`, `src/services/`, `src/types/`, `src/utils/`).
  - Drizzle ORM Schema v1 (`courses`, `tasks`, `subtasks`, `events`, `focus_sessions`, `focus_state`, `user_preferences`, `statistics_cache`) with relations, indexes, and `deleted_at` soft deletes.
  - Versioned migration pipeline (`0001_initial.sql`, `journal.json`, and runtime migrator).
  - Typed error taxonomy (`DatabaseError`, `ValidationError`, `ConflictError`, `NotFoundError`, `MigrationError`, `SyncError`, `PermissionError`).
  - Zod validation schemas for all entities and mutation operations.
  - Repository layer (`CourseRepository`, `TaskRepository`, `SubtaskRepository`, `EventRepository`, `FocusSessionRepository`, `FocusStateRepository`, `PreferenceRepository`, `StatisticsCacheRepository`) with atomic transactions, soft-deletes, and idempotency guards.
  - Vitest test suite with 23 unit and integration tests passing cleanly.
- Stage 2: Core domain + state architecture
  - Pure domain modules (`src/domain/scheduling/`, `src/domain/quick-add/`, `src/domain/focus/`, `src/domain/statistics/`, `src/domain/tasks/`, `src/domain/events/`).
  - Interval collision detection ($A_{start} < B_{end} \land A_{end} > B_{start}$) and free-gap calculation with merged contiguous intervals and minimum threshold filtering.
  - Deterministic Quick-Add tokenizer pipeline extracting dates, times, durations, priorities, course tags, and pomodoro estimates into a validated `TaskDraft`.
  - Timestamp-driven focus timer calculations (`calculateRemainingSeconds`, `calculateSessionProgress`, background-suspension recovery math, and Pomodoro mode transitions).
  - Derived statistics computations (unbroken active streak, historical longest streak, session minutes by mode, task completion and overdue rates) calculated on demand from SQLite source records without caching as truth in preferences.
  - Optimistic mutation queue (`MutationQueue`) supporting optimistic UI updates, background persistence, and automatic rollback on repository failures.
  - Zustand presentation stores (`useTaskStore`, `useFocusStore`, `useFilterStore`, `useUIStore`, `useMutationStore`) holding only UI/transient state.
  - Expanded test suite to 15 test files with 76 tests passing with 0 errors and strict TypeScript compilation.
- Stage 3: Focus Engine + Scheduling
  - `NotificationService` (`src/services/notifications/index.ts`) managing OS local alerts scheduled from exact target timestamps (`DateTriggerInput`), high-priority Android channel configuration, permission requests, and timer cancellation.
  - `FocusEngine` (`src/services/focus/focus-engine.ts`) coordinating SQLite persistence (`FocusStateRepository`), Zustand presentation (`useFocusStore`), OS notifications (`NotificationService`), and React Native `AppState` lifecycle transitions.
  - Crash-safe and background-resilient timer recovery calculating remaining time as `target_at - now()`, auto-transitioning and completing sessions when elapsed while backgrounded/suspended.
  - Idempotent atomic session completion with status check-and-set (`running` -> `completed`) transaction and in-flight promise deduplication to prevent double-increment under background notification / foreground race conditions.
  - Timeline schedule builder (`buildDailySchedule`) combining calendar events and time-blocked tasks, interval collision detection, and actionable free gaps.
  - `draftToCreateTaskInput` integrating quick-add tokenizer directly into task creation with course tag mapping.
  - 18 test suites with 90 tests passing cleanly with zero warnings or errors and strict TypeScript compilation.
- Stage 4: UI, Rendering & Security
  - Design Tokens & Monochrome Shell (`src/constants/theme.ts` & `src/constants/index.ts`): Strict light & dark theme palettes, semantic color tokens (`--priority-high/med/low`, `--event-class/personal`, `--focus-accent`, `--gamify-streak`), ~10-12% course background tint calculations, and strict typography scale (`display`, `heading`, `body`, `caption`, `mono`, `timerLarge`).
  - Security Architecture (`src/services/security/index.ts`): `SecureStore` key management isolating 256-bit database encryption keys from source code, .env, Zustand, and backup payloads.
  - Structured Logging (`src/utils/logger.ts`): Leveled logger (`debug`, `info`, `warn`, `error`) disabling debug in production and automatically redacting sensitive tokens, passwords, and encryption keys.
  - Error Boundaries (`src/components/ui/error-boundary.tsx`): Route and component level error boundaries with recovery and logging.
  - UI Primitives (`src/components/ui/`): Pre-styled typography components, haptic-enabled `Button`, `Card`, `Badge` (Priority, CoursePill, Tag), zero-CLS `Skeleton`, slide-up `Modal`/BottomSheet, and `ToastContainer` connected to `useUIStore`.
  - Feature Components & FlashList v2:
    - Task components (`src/components/task/`): Memoized `TaskRow` with completion animation (scale -> spring -> checkmark -> strikethrough -> fade), `TimeGapRow`, `DateSelector` horizontal strip, `FilterStrip`, `QuickAddModal` with tokenizer live preview chips, and `RescheduleModal`.
    - Event components (`src/components/event/`): `EventCard`, `TimelineSchedule` showing collisions and free gaps, `TimeSlider` with stepper haptics, and `EventModal`.
    - Focus components (`src/components/focus/`): `Timer` visual anchor with monospace readout and focus accent ring, `ModeSelector`, `TaskContext` active task banner, and `FocusControls` (Start, Pause, Resume, Reset, Skip).
    - Profile components (`src/components/profile/`): `Hero` with live streak flame, `MetricsGrid` sourcing live SQL stats, `SemesterStatus`, `DailyGoalCard`, and `SettingsList` with preference toggles & backup actions.
    - Navigation (`src/components/navigation/`): `BottomTabBar` custom 4-tab bar with active state and quick-add trigger.
  - Expo Router Routes (`src/app/`):
    - `_layout.tsx`: Root layout initializing SQLite database & migrations on startup, wrapped in root `ErrorBoundary`, `SafeAreaProvider`, `GestureHandlerRootView`, and `ToastContainer`.
    - `(tabs)/_layout.tsx`: Tab navigator hosting the 4 primary tabs with custom bottom bar.
    - `(tabs)/index.tsx`: Tasks screen.
    - `(tabs)/events.tsx`: Events screen.
    - `(tabs)/focus.tsx`: Focus screen.
    - `(tabs)/profile.tsx`: Profile screen.
  - Backup & Restore Service (`src/services/backup/index.ts`): Schema-validated export and atomic transactional import excluding encryption keys.
- Stage 5: Sync-readiness, Backup, Testing & Launch hardening
  - Cloud Sync Architecture & API Boundary (`src/services/sync/`):
    - Problem 1 Fix: Conflict resolution (`resolveConflict`) strictly relies on server-assigned ingestion sequence (`serverSeq`) and server timestamp (`serverUpdatedAt`), eliminating vulnerabilities to client clock drift and user time modifications.
    - `SyncEngine`: Extracts local modifications, generates sync payloads, interacts with remote API boundary, and applies remote changes inside atomic transactions.
    - Tombstone synchronization via soft-delete `deletedAt` metadata with deletion precedence rules.
  - Observability & Telemetry (`src/services/observability/`):
    - Performance monitor tracking `coldStartMs`, `warmStartMs`, `taskQueryMs`, `dbWriteMs`, `screenRenderMs`, `focusRecoveryMs`, and `crashRate`.
    - Session tracking with crash-free session rate calculation and recursive redaction of sensitive credentials.
  - Trimmed Startup Path & Launch Hardening (`src/services/startup/index.ts`, `src/app/_layout.tsx`):
    - Critical launch sequence strictly constrained to SQLite init -> migration execution -> minimal preference read -> immediate Tasks paint.
    - Deferred non-critical background jobs scheduled asynchronously.
  - Full Test Pyramid:
    - 26 test suites with 120 tests passing cleanly across unit, repository, component, and E2E critical flows.
    - Comprehensive E2E tests validating task cascades, schedule collisions, focus drift recovery, disaster backup recovery, and sync conflict resolution.

## In Progress

- None (All 5 stages completed).

## Next Up

- Ready for app build and deployment.

## Open Questions

- None.

## Architecture Decisions

- Configured database client with dual platform capability: `@op-engineering/op-sqlite` for native runtime and LibSQL for Node/CI/testing.
- Focus timer persistence uses timestamp-driven state (`started_at`, `target_at`, `paused_at`, `status`, `mode`) rather than tick-decrementing counters.
- Enforced check-and-set status guard in `FocusStateRepository.completeSessionAtomic` and in-flight deduplication in `FocusEngine` to guarantee idempotent focus completion under background/foreground races.
- Multi-table mutations (task completion with subtask cascading, reordering) wrapped in strict Drizzle transactions.
- State architecture strictly decouples SQLite (source of truth) from Zustand (transient/UI presentation state & optimistic acceleration).
- Streak and analytics metrics computed on demand via SQL queries and pure domain functions, preventing stale cache drift.
- UI styling follows a strict monochrome shell with semantic color accents and ~10-12% course background tint.
- Database encryption key isolated exclusively in `expo-secure-store`.
- FlashList v2 utilized for all scrollable collections with row-level memoization.
- Conflict resolution uses server-assigned ingestion timestamps and sequence numbers (Problem 1 fix), never client device clocks.
- Mobile app connects only via HTTPS API boundary, never directly to remote PostgreSQL.
- Startup path optimized to render initial tasks view immediately before running non-critical background tasks.

## Session Notes

- Stage 5 is fully implemented and tested. All 120 tests across 26 test suites pass with zero warnings or errors, and `npx tsc --noEmit` compiles cleanly.
