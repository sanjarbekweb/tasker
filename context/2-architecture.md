# Architecture Context

## Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| Framework | Expo + Expo Router + TypeScript (strict) | Core app shell, file-based routing, native/JS/custom tab navigation |
| Runtime | Hermes + React Native New Architecture | JS engine and native runtime; required by FlashList v2 |
| UI & Styling | NativeWind (Tailwind) + design tokens | Utility styling, monochrome shell with semantic accent tokens |
| Presentation State | Zustand | UI/transient state only — filters, selected date, active timer, modal state |
| Domain Logic | Plain TypeScript (`domain/`) | Scheduling, quick-add parsing, collision detection, statistics — no React, no SQL |
| Database & ORM | OP-SQLite + Drizzle ORM | System of record for courses, tasks, subtasks, events, focus sessions/state, preferences |
| Local Encryption | SQLCipher (via OP-SQLite), optional | At-rest encryption of the local database file |
| Key Storage | expo-secure-store | Holds the database encryption key; never touches AsyncStorage, SQLite, or source |
| Lists | FlashList v2 | High-performance recycled list rendering (requires New Architecture) |
| Animation & Gesture | Reanimated + Gesture Handler | UI-thread gesture-driven and layout animations |
| Notifications | expo-notifications | Locally scheduled focus-timer completion alerts |
| Validation | Zod | Runtime validation for quick-add input, backup import, and settings forms |
| Icons | lucide-react-native | Stroke-based icon set |
| Future Cloud Layer | HTTPS API + PostgreSQL (not in MVP) | Planned sync backend; mobile never connects to Postgres directly |

## System Boundaries

- `app/` — Expo Router routes, layouts, and modals only. No business logic, no direct database calls.
- `components/` — Presentation layer, split into `ui/` primitives and feature modules (`task/`, `event/`, `focus/`, `profile/`, `navigation/`). Communicates with the rest of the app only through Zustand stores and domain function calls — never imports Drizzle/OP-SQLite directly.
- `stores/` — Zustand stores holding UI/transient state (`task-store.ts`, `focus-store.ts`, `filter-store.ts`, `ui-store.ts`). Never a full mirror of database tables.
- `domain/` — Pure, testable business logic (tasks, events, focus, scheduling, quick-add, statistics). No React imports, no direct SQL; operates on plain data passed in.
- `db/` — The only layer authorized to import Drizzle/OP-SQLite. Contains `client.ts`, `schema/`, `migrations/`, and `repositories/`. All multi-step mutations are orchestrated here inside transactions.
- `services/` — Cross-cutting concerns: `notifications/` (local scheduling), `backup/` (export/import + validation), `sync/` (future, currently a stub boundary), `security/` (SecureStore key management, SQLCipher wiring).

## Storage Model

- **Local Relational Database (SQLite via OP-SQLite + Drizzle):** The single source of truth for all domain data — `courses`, `tasks`, `subtasks`, `events`, `focus_sessions`, `focus_state`, `user_preferences`. No entity's full collection is duplicated into Zustand.
- **Optional Encrypted Storage (SQLCipher):** When enabled, the same SQLite file is encrypted at rest; the encryption key is generated and held exclusively in `expo-secure-store`, and is never exported in backups.
- **Derived/Cache Data (`statistics_cache`, optional):** Expensive aggregate statistics may be cached with an explicit `calculated_at` and explicit invalidation — never treated as authoritative, and never stored inside `user_preferences`.
- **Backup Files (local JSON):** User-triggered export containing `schemaVersion`, `appVersion`, `exportedAt`, and all domain tables. Never includes the encryption key or any secret.
- **Future Remote Store (PostgreSQL, post-MVP):** Will become the sync system of record behind an API layer; out of scope until cloud sync ships.

## Access Model

Numo ships as a single-user, on-device app with no accounts or roles in the MVP — there is no auth boundary to enforce today. The following applies once cloud sync/accounts are introduced, and the schema is already shaped to support it without migration surgery:

| Capability | MVP (local, single device) | Post-Sync (planned) |
| :--- | :---: | :---: |
| Create/edit/complete tasks, events, focus sessions | ✅ | ✅ |
| Local backup export/import | ✅ | ✅ |
| Cross-device sync of the same data | — | ✅ (via HTTPS API, never direct Postgres access) |
| Multi-user collaboration on shared data | — | Not planned |
| Server-side authentication | — | ✅ (short-lived access tokens only; no secrets shipped in the app bundle) |

## Invariants

1. **SQLite Is Source of Truth:** Zustand never holds a full mirror of a database table. It holds only UI/transient state (active filters, selected date, active timer, modal open/closed, optimistic in-flight mutations).
2. **Repository Isolation:** Only `db/repositories/*` may import Drizzle or OP-SQLite. Domain logic, stores, and components must go through the repository layer.
3. **Atomic Multi-Table Mutations:** Any mutation touching more than one table (e.g., completing a task and its subtasks, finalizing a focus session and incrementing `completed_pomodoros`) executes inside a single Drizzle transaction — partial writes are never acceptable, and a failure rolls back entirely.
4. **Idempotent Focus Completion:** Finalizing a focus session must check-and-set `focus_state.status` from `running` to `completed` before inserting the `focus_session` row and incrementing statistics. A retry or a background/foreground race must never double-write.
5. **Timestamp-Driven Timer, Never a Counter:** The focus timer's source of truth is `started_at`/`target_at` (or `paused_at`), with remaining time always derived as `target_at - now()`. The app must never persist a decrementing counter as the timer's state.
6. **Soft Delete Only:** Every syncable table carries `deleted_at`. Deletion is always `UPDATE ... SET deleted_at = now()`, never a hard `DELETE`, so future sync can detect tombstones.
7. **Migrations Only Through Drizzle:** No manual schema edits. Every schema change is a new, numbered Drizzle migration, run and validated at app startup before the UI renders.
8. **No Client-Trusted Clocks for Conflict Resolution:** If/when sync ships, conflict resolution must use a server-assigned `updated_at`/`version`, never a raw client-device timestamp, since device clocks drift or can be user-modified.
9. **No Direct Remote Database Access:** The mobile app never connects directly to PostgreSQL. All future remote access goes through an HTTPS API using short-lived tokens.
10. **Encryption Key Isolation:** If SQLCipher is enabled, the database encryption key lives only in `expo-secure-store` — never in AsyncStorage, SQLite itself, `.env`, source code, or Zustand — and is never included in a backup export.
11. **Derived Data Is Never Authoritative:** Streaks, totals, and other aggregates are computed via queries against source tables (or an explicitly invalidated cache), never stored as long-lived truth inside `user_preferences`.
12. **Render Path Stays Thin:** Filtering, sorting, and aggregation happen in SQL queries or `domain/` functions — never by pulling a full table into JavaScript and filtering inside a component render.
