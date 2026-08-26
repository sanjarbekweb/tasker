# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Stage 3 — Focus Engine + Scheduling [x] Completed

## Current Goal

- Prepare for Stage 4: UI, Rendering & Security (FlashList v2 screens, monochrome design tokens, Reanimated gestures, SecureStore/SQLCipher encryption)

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
  - Idempotent atomic session completion with status check-and-set (`running` -> `completed`) transaction and in-flight promise deduplication to prevent double-increment under background notification / foreground resume race conditions.
  - Timeline schedule builder (`buildDailySchedule`) combining calendar events and time-blocked tasks, interval collision detection, and actionable free gaps.
  - `draftToCreateTaskInput` integrating quick-add tokenizer directly into task creation with course tag mapping.
  - 18 test suites with 90 tests passing cleanly with zero warnings or errors and strict TypeScript compilation.

## In Progress

- None (Stage 3 completed).

## Next Up

- Stage 4: UI, Rendering & Security (FlashList v2 screens, monochrome design tokens, Reanimated gestures, SecureStore/SQLCipher encryption).

## Open Questions

- None.

## Architecture Decisions

- Configured database client with dual platform capability: `@op-engineering/op-sqlite` for native runtime and LibSQL for Node/CI/testing.
- Focus timer persistence uses timestamp-driven state (`started_at`, `target_at`, `paused_at`, `status`, `mode`) rather than tick-decrementing counters.
- Enforced check-and-set status guard in `FocusStateRepository.completeSessionAtomic` and in-flight deduplication in `FocusEngine` to guarantee idempotent focus completion under background/foreground races.
- Multi-table mutations (task completion with subtask cascading, reordering) wrapped in strict Drizzle transactions.
- State architecture strictly decouples SQLite (source of truth) from Zustand (transient/UI presentation state & optimistic acceleration).
- Streak and analytics metrics computed on demand via SQL queries and pure domain functions, preventing stale cache drift.

## Session Notes

- Stage 3 is fully implemented and tested. All 90 tests across 18 test suites pass with zero warnings or errors. Ready for Stage 4.

