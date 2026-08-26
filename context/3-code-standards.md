# Code Standards — Numo

## General

- **Single Responsibility:** Keep components, domain functions, repositories, and stores focused on one specific job. A screen component renders; a domain function computes; a repository persists.
- **Root Cause Resolution:** Fix schema, type, and transaction issues at the source (migration, Zod schema, repository) rather than patching around them in UI code or adding ad-hoc null checks.
- **Separation of Concerns:** Presentation (screens/components), UI state (Zustand), domain logic (`domain/`), and persistence (`db/repositories/`) are strictly segregated — never call Drizzle directly from a component or store.
- **SQLite is the source of truth. Zustand is the interaction/state-acceleration layer, not a second database.** Never mirror full entity collections into Zustand; query SQLite and keep Zustand to UI/transient state (active filters, selected date, active timer, modal state).
- **Naming Conventions:** `kebab-case` for filenames, `PascalCase` for React components/types, `camelCase` for functions, variables, hooks, and database fields.

## TypeScript

- **Strict Mode:** `strict: true` in `tsconfig.json` with zero compiler exceptions.
- **Banned `any`:** Prohibited everywhere. Use `unknown` with narrowing, or derive types from Zod schemas via `z.infer<typeof schema>`.
- **Discriminated Unions:** Prefer discriminated unions over boolean flag soup (e.g., `FocusStatus: 'idle' | 'running' | 'paused' | 'completed'` rather than `isRunning: boolean; isPaused: boolean`).
- **Boundary Validation:** Every external input — quick-add raw text, backup JSON, deep-link params, settings form input — is parsed through a Zod schema before it reaches domain logic.

## Expo / React Native / Navigation

- **File-based Routing Only:** `src/app/` contains routes only. Components, hooks, utilities, and domain logic live outside it, under `components/`, `hooks/`, `domain/`, etc.
- **Current Expo Router APIs:** Build against the current Expo Router (JS tabs / native tabs / custom tabs via `expo-router/ui`) — never pin architecture decisions to a specific past major version.
- **New Architecture Required:** The app targets React Native's New Architecture (required for FlashList v2 and assumed throughout).
- **Server/client boundary equivalent — Domain vs. UI:** Screens and components must not contain business rules (collision detection, scheduling math, streak calculation, parsing). Those live in `domain/` as pure, testable functions.
- **Route-Level Error Boundaries:** Every route segment gets its own error boundary so a broken screen (e.g., Profile) never crashes the whole app.

## State & Data Flow

- **Mutation Pattern:** User actions flow `UI → optimistic Zustand update → repository → Drizzle → OP-SQLite`. The UI never blocks on persistence unless the action logically requires confirmation.
- **Rollback on Failure:** Every optimistic mutation must define a rollback path if the underlying transaction fails.
- **Transactional Writes:** Any multi-step mutation (complete task + update subtask + write stats) executes inside a single Drizzle transaction — partial writes are not acceptable.
- **No Client-Trusted Timestamps for Conflicts:** Sync/conflict resolution must use a server-assigned `updated_at`/`version`, never a raw client clock value, since device clocks drift.
- **Idempotent Session Completion:** State-transition writes (e.g., focus session complete) must guard against double execution — check-and-set the status column before inserting/incrementing, don't assume single-fire.
- **Derived Data Is Never Cached as Truth:** Streaks, totals, and other aggregates are computed via SQL queries (or an explicitly invalidated `statistics_cache`), never stored as authoritative fields in `user_preferences`.

## Styling

- **Utility Merging:** Use a `cn()` utility (`clsx` + `tailwind-merge` equivalent for NativeWind) for all conditional class composition. Never string-concatenate class names.
- **Token Consistency:** Use design tokens (`text-display`, `text-heading`, `text-body`, `text-caption`, `text-mono`, semantic color tokens) instead of hardcoded font sizes or hex values.
- **Shell Stays Monochrome:** Course colors and priority/event-type colors are semantic accents (e.g., ~10% background tint) — they must never dominate the monochrome shell.
- **Zero-CLS Skeletons:** Loading skeletons must match the exact dimensions/margins/padding of the real content to prevent layout shift.

## Lists & Rendering

- **FlashList v2, Not FlatList-with-a-Speed-Boost:** Requires New Architecture; treat it as its own API, not a drop-in FlatList replacement.
- **Row Isolation:** `memo()` leaf row components, stable `keyExtractor`, `getItemType` for heterogeneous rows, no inline object creation in hot paths, no `key` props inside recycled item trees.
- **Measure, Don't Guess:** Profile list and animation performance in release builds only — never optimize against theoretical FPS numbers from development mode.
- **Animation Ownership:** Reanimated + Gesture Handler own gesture-driven/layout/timer-visual animations on the UI thread. Plain React state owns business, database, and navigation state — never drive animations via repeated `setState`.

## Data and Storage

- **Database Authority:** SQLite (via OP-SQLite + Drizzle) is the single source of truth for all domain records. No entity's full collection is duplicated in app state.
- **Soft Deletes Only:** Syncable tables always carry `deleted_at`; never hard-delete a row that could be relevant to future sync.
- **Migrations Only Through Drizzle:** No manual production schema edits. Every schema change is a numbered Drizzle migration, validated at app startup.
- **Encryption Boundary:** If SQLCipher is enabled, the encryption key lives only in `expo-secure-store` — never in AsyncStorage, SQLite, `.env`, source code, or Zustand.
- **No Direct Postgres Access:** If/when cloud sync ships, the mobile app talks to an API/BaaS layer only — never connects directly to PostgreSQL.
- **Backups Exclude Secrets:** Exported backup JSON contains domain data and schema/app version metadata only — never encryption keys or tokens.

## Error Handling

- **Typed Errors:** Repository and domain operations throw/return typed errors (`DatabaseError`, `ValidationError`, `ConflictError`, `NotFoundError`, `MigrationError`, `SyncError`, `PermissionError`) — never a bare `Error` or a silently swallowed `catch (e) { console.log(e) }`.
- **Recoverable by Design:** Every error type maps to a defined UI recovery state (retry, rollback, empty state) — errors are not just logged, they're handled.

## Package Management & Dependencies

- **Core Approved Set:** `expo`, `expo-router`, `typescript`, `zustand`, `drizzle-orm`, `op-sqlite`, `@shopify/flash-list` (v2), `react-native-reanimated`, `react-native-gesture-handler`, `nativewind`, `lucide-react-native`, `expo-haptics`, `expo-secure-store`, `expo-notifications`, `zod`.
- **Justify Everything Else:** No dependency is added without a concrete justification tied to a requirement in the architecture doc.
- **No Parallel State Containers:** Do not introduce a second client-side database or cache layer (e.g., MMKV-as-source-of-truth, Redux) alongside SQLite + Zustand without an explicit architectural decision.

## Testing Discipline

- **Unit:** Quick-add parser, date/time/priority parsers, collision detection, free-gap calculation, timer math, streak calculations — all pure functions in `domain/`, tested without a UI.
- **Repository:** Create/update/delete/complete flows, transaction rollback, migrations, foreign key enforcement.
- **Component:** `TaskRow`, `Timer`, `DateSelector`, `TimeSlider`, `QuickAdd`.
- **E2E — Critical Flows:** Create task, complete task, swipe task, create event, start focus session, background the app, resume timer, export backup, import backup.
- **Focus/Timer Specifically:** Every timer-related change must include a background/foreground recovery test — timer correctness after backgrounding is a release-blocking concern, not a nice-to-have.

## File Organization

- `app/` — Expo Router routes, layouts, and modals only.
- `components/` — Reusable UI, split by feature (`ui/`, `task/`, `event/`, `focus/`, `profile/`, `navigation/`).
- `domain/` — Pure business logic (tasks, events, focus, scheduling, quick-add, statistics). No React, no SQL.
- `db/` — `client.ts`, `schema/`, `migrations/`, `repositories/`. The only layer allowed to import Drizzle/OP-SQLite.
- `stores/` — Zustand stores holding UI/transient state only.
- `services/` — Notifications, backup, sync, security (SecureStore, key management).
- `hooks/`, `utils/`, `constants/`, `types/` — as needed, kept thin.
