Looking at this spec, two things in the doc as written will actually cause bugs later — worth fixing before you build the phases around them:

Problem 1 — Conflict resolution relies on client clocks. Section 26 picks the winner by comparing updated_at from Device A vs Device B. Mobile device clocks drift and users manually change device time, so "last write wins by client timestamp" can silently lose newer data to an older write with a fast/incorrect clock. Fix: stamp updated_at server-side at ingestion time (or add a monotonically increasing server_seq/version column that the API assigns), and use that for conflict resolution — not the value the client sent.

Problem 2 — Focus session completion isn't idempotent. Section 30's transaction does INSERT focus_session + UPDATE completed_pomodoros = completed_pomodoros + 1 with no guard. If both the background notification handler and the app's foreground resume logic fire the "session complete" path (a realistic race on Android), you'll double-increment. Fix: add a status check to the transaction — UPDATE focus_state SET status='completed' WHERE status='running' first, and only run the insert/increment if that update affected a row.

I've folded both fixes into the phases below.

Stage 1 — Foundation (project + data layer skeleton)

Goal: nothing renders yet, but the ground truth is unshakeable.

Stack setup: Expo, Expo Router (current file-based API, not pinned to v3), TypeScript strict, Hermes, New Architecture (§1)
Project structure scaffolding (§4)
DB stack: OP‑SQLite + Drizzle, pragmas (WAL, foreign_keys, busy_timeout) applied conditionally per platform (§2, §13)
Schema v1: courses, tasks, subtasks, events, focus_sessions, focus_state, user_preferences — including deleted_at/updated_at from the start, not bolted on later (§5–11)
Indexes (§12)
Migration pipeline via Drizzle, versioned (0001_initial, etc.) (§37)
Repository layer (one per entity) sitting between Drizzle and everything else (§3)
Stage 2 — Core domain + state architecture

Goal: correct behavior with no UI polish.

Layered architecture wired: UI → Zustand (UI state only) → Domain → Repository → Drizzle (§3, §15)
Domain modules: tasks, events, scheduling, quick-add, statistics as pure functions, not embedded in components (§31–35)
Transactions for every multi-step mutation (complete task → update subtasks → write stats) (§14)
Optimistic mutation system + mutation queue with rollback on failure (§19–20)
Derived stats (streaks, totals) computed via SQL queries, never cached in user_preferences (§11, §50)
Error taxonomy (DatabaseError, ValidationError, etc.) at the repository boundary (§35)
Zod validation for all external input (§40)
Stage 3 — Focus Engine + Scheduling (the two hardest correctness problems)

Goal: timer and scheduling survive backgrounding, crashes, and races.

Timestamp-driven timer: started_at/target_at, never a decrementing counter (§10, §27)
Background/foreground recovery: recompute remaining = target_at - now() on resume; auto-transition if already elapsed (§28)
Local notification scheduled from target_at, not from a running JS timer (§29)
Idempotent session completion (the fix above) wrapped in a transaction (§30)
Collision detection + free-gap calculation for events/tasks (§32–33)
Quick-add parser as a tokenizer pipeline (date → time → priority → course → title), AI parsing optional/secondary (§34)
Stage 4 — UI, Rendering & Security

Goal: it's fast, doesn't leak data, and doesn't jank on a mid-range Android device.

FlashList v2 (requires New Architecture) with memoized rows, stable keys, getItemType, profiled in release builds only (§17–18, §49, §55)
Screen composition for Tasks/Events/Focus/Profile (§48)
Reanimated for gesture/animation, plain React state for business/nav state (§43–46)
Design tokens for typography, semantic (not dominant) course colors (§41–42)
Security: SecureStore for the DB encryption key, optional SQLCipher via OP‑SQLite, no secrets in the bundle (§22–23)
Error boundaries per route (root → screen → component) (§36)
Logging with levels, sensitive data never logged (§54)
Stage 5 — Sync-readiness, Backup, Testing & Launch hardening

Goal: ship-ready, and cloud sync is a config flip, not a rewrite.

Auth/API boundary designed (mobile never talks to Postgres directly) even if unused in MVP (§24–25)
Sync metadata (deleted_at, version/device_id) already present from Stage 1; add the server-timestamp fix for conflict resolution here before any real sync ships (§26)
Backup export/import with schema+version validation, no encryption keys in the export (§38–39)
Full test pyramid: unit (parsers, collision, timer math) → repository (transactions, rollback, migrations) → component → E2E critical flows (§56)
Observability: cold/warm start, query latency, crash-free session rate (§55)
Startup path trimmed to DB init → migrations → minimal prefs → render Tasks; everything else (analytics, backup discovery, cloud sync) deferred (§51–52)

One structural note across all five stages: keep re-reading the core principle stated at the end of the doc — SQLite is source of truth, Zustand is acceleration only — every time a stage tempts you to cache something "for speed" in Zustand or user_preferences. Most of the failure modes in this spec (stale analytics, double-counted sessions, sync conflicts) come from that rule being violated somewhere.