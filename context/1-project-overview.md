# Numo (Offline-First Student Productivity App)

## Overview

Numo is a local-first task, schedule, and focus companion for students, built to feel instant and remain fully usable with zero network connectivity. It unifies daily task management, course-linked events, and a background-safe Pomodoro-style focus timer into a single monochrome, low-friction interface. All domain data lives in an on-device SQLite database; the app is designed so cloud sync can be added later without a schema rewrite, but ships in the MVP as a single-device, offline-first experience.

## Goals

1. **Instant-Feeling Interactions:** UI mutations (completing a task, opening a sheet, switching tabs) must feel immediate regardless of database write latency.
2. **Zero-Network Core Functionality:** Every primary flow — creating/completing tasks, scheduling events, running a focus session — works fully offline.
3. **Crash- and Background-Safe Focus Timer:** A running focus session must survive app backgrounding, OS suspension, and crashes without losing correctness or double-counting completions.
4. **Deterministic, Recoverable State:** All persistence is transactional; a failed or interrupted write must never leave tasks, subtasks, or focus statistics in a partially-updated state.
5. **Sync-Ready Without Premature Complexity:** The data model carries the metadata (`deleted_at`, `updated_at`, future `version`/`device_id`) needed for cloud sync later, without implementing sync, conflict resolution, or a backend in the MVP.

## Core User Flow

1. **Quick Capture:** Student opens the app (or a quick-add sheet) and types a task in natural language (e.g. `"HW 3 tomorrow 5pm p1 #math"`); the quick-add parser extracts title, due date, time, priority, and course.
2. **Daily Planning:** Student views the Tasks screen filtered to today, sees free time gaps between scheduled course events, and reorders or reschedules tasks.
3. **Course Events:** Student adds recurring class events (with an `RRULE`-based recurrence) and one-off events, and the app detects scheduling collisions.
4. **Focus Session:** Student attaches a task to a Pomodoro-style focus session, starts the timer, and the timer continues correctly through backgrounding; a local notification fires at completion even if the app was killed.
5. **Completion & Stats:** Completing a task or finishing a focus session updates task/subtask state and focus statistics atomically; Profile shows streaks and totals computed from source tables, never from a stale cache.
6. **Backup:** Student can export all local data to a JSON backup file and re-import it (with schema/version validation) — e.g. when moving to a new device, ahead of cloud sync existing.

## Features

### Tasks & Scheduling

- Natural-language quick-add with a deterministic tokenizer/parser pipeline (AI parsing optional, never primary).
- Course-linked tasks and subtasks with priority, due date, and time-block fields.
- Free-gap calculation and collision detection across tasks and course events.
- Recurring events via series identity + `RRULE`, with future support for editing/deleting a single occurrence vs. the whole series.

### Focus Engine

- Timestamp-driven timer (`started_at` / `target_at`), never a decrementing per-second counter.
- Background/foreground recovery that recomputes remaining time from timestamps and auto-transitions work↔break if time has already elapsed.
- Locally scheduled OS notification for session completion, independent of JS execution continuing in the background.
- Idempotent session-completion write: a session can only be finalized once, even under a background/foreground race.

### Data, Backup & Security

- Local SQLite (OP-SQLite + Drizzle) as the single source of truth; optional SQLCipher encryption with the key held only in secure device storage.
- Soft-delete (`deleted_at`) on all syncable entities from day one.
- JSON export/import with schema and version validation (no encryption keys ever included in an export).

### Profile & Insights

- Streaks, total focus time, and daily/semester progress computed live from source tables (or an explicitly invalidated cache) — never stored as authoritative preference values.

## Scope

### In Scope

- Fully offline, single-device task, subtask, course, and event management.
- Focus timer with background recovery and local notifications.
- Quick-add natural-language parsing (deterministic parser; AI-assisted parsing as an optional enhancement).
- Local backup export/import.
- Optional local database encryption (SQLCipher) with SecureStore-held keys.
- Data model and metadata designed for future cloud sync (soft deletes, timestamps), without implementing sync itself.

### Out of Scope (MVP)

- Cloud sync, multi-device state, and any server-side conflict resolution.
- User accounts, authentication, or multi-user collaboration.
- Push notifications requiring a backend (only local, on-device notifications are in scope).
- CRDT-based or collaborative editing conflict resolution.
- Payments, subscriptions, or any monetization surface.
- Non-mobile platforms (web/desktop) in the initial release.

## Success Criteria

1. **Perceived Latency:** Checkbox and task-mutation interactions render in well under the targets in `2-architecture.md` (checkbox <16ms visual response, task mutation <50ms perceived) regardless of actual SQLite write time.
2. **Timer Correctness:** A focus session started, backgrounded for an arbitrary duration, and resumed reports the correct remaining/elapsed time with zero drift and zero duplicate completion records.
3. **Transactional Integrity:** 100% of multi-table mutations (task completion, focus session finalize) either fully commit or fully roll back — no partially-updated rows are observable.
4. **Offline Completeness:** Every core flow (capture, plan, schedule, focus, review) is fully functional with the device in airplane mode.
5. **List Performance:** The Tasks list scrolls at ≥55 FPS on mid-range Android devices in a release build, verified via profiling rather than assumed from theoretical numbers.
