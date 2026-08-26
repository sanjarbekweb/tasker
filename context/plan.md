Your current plan is already strong, but there are several architectural problems that will become visible once the app has real data, background timers, migrations, sync, and long-term usage.

The main changes I would make are:


1. **Remove the “0ms database” claim** — UI updates can be effectively immediate, but SQLite I/O is still I/O.
2. **Separate UI state from persistent/domain state.**
3. **Do not use `user_preferences` as an analytics cache.** Add proper derived/aggregate handling.
4. **Make the database layer transactional and migration-safe.**
5. **Add soft-delete/sync metadata now**, even if cloud sync is implemented later.
6. **Make the Focus Engine timestamp-driven and crash/background resistant.**
7. **Use SQLCipher optionally for local DB encryption.** OP-SQLite supports SQLCipher. ([GitHub][1])
8. **Use FlashList v2 with the New Architecture**, rather than treating FlashList merely as a faster FlatList. FlashList v2 requires the New Architecture. ([shopify.github.io][2])
9. **Do not blindly memoize everything**; profile release builds and optimize based on measurements. ([shopify.github.io][3])
10. **Use the current Expo Router architecture rather than locking the design to Router v3.** Current Expo documentation recommends the current Expo Router APIs and file-based architecture. ([Expo Documentation][4])

Below is the version I would actually use as the engineering specification.

---

# Numo — Refined Architecture & Technical Blueprint

## 0. Engineering Goals

### Primary goals

* Offline-first
* Instant-feeling interactions
* Deterministic state
* Crash-safe persistence
* Background-safe focus timer
* Zero network dependency for core functionality
* Efficient rendering on low/mid-range Android devices
* Secure local storage
* Future cloud synchronization without redesigning the database
* Strict TypeScript
* Testable domain logic
* Minimal unnecessary dependencies

### Performance targets

These are **engineering targets**, not guarantees:

| Metric                         |                           Target |
| ------------------------------ | -------------------------------: |
| Cold launch → interactive      |        < 1.5 s on modern devices |
| Warm launch → interactive      |                         < 500 ms |
| Checkbox visual response       |                          < 16 ms |
| Normal task mutation           |                < 50 ms perceived |
| Tab switch                     |                         < 100 ms |
| Focus timer visual update      |                           60 FPS |
| Scroll                         |    ≥ 55 FPS on mid-range devices |
| Database query for daily tasks |                   < 10 ms target |
| App memory                     | Keep stable during long sessions |
| Crash-free sessions            |                   > 99.5% target |

The important distinction is:

> **UI responsiveness ≠ database latency.**

The UI should update optimistically immediately, while persistence happens independently.

---

# 1. Technology Stack

## Core

```text
React Native
Expo
Expo Router
TypeScript
Hermes
React Native New Architecture
```

Use the current Expo SDK rather than hard-coding an old `expo-router v3+` requirement. Current Expo Router is file-based and supports native, JavaScript, and custom tab architectures. ([Expo Documentation][4])

### Recommended

```text
Expo Router
React Native New Architecture
Hermes
TypeScript strict mode
```

---

# 2. Database Layer

## Primary database

```text
OP-SQLite
        ↓
Drizzle ORM
        ↓
SQLite
```

Drizzle officially supports OP-SQLite, including migrations through Drizzle's migration system. ([Drizzle ORM][5])

### Important correction

Do **not** describe the architecture as:

```text
Zustand
 ↓
background SQLite thread
```

as if every write is guaranteed to happen on a separate background thread.

Instead:

```text
UI
 ↓
Domain command
 ↓
Zustand optimistic state
 ↓
Repository
 ↓
Drizzle
 ↓
OP-SQLite
 ↓
SQLite
```

The UI never waits for persistence unless the operation logically requires confirmation.

---

# 3. Architecture

Use a layered architecture:

```text
┌─────────────────────────────────────────────┐
│                 UI / Screens                │
│ React Native + Expo Router + NativeWind     │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│              Presentation State             │
│                    Zustand                  │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│                 Domain Layer                │
│ Tasks / Events / Focus / Scheduling         │
│ Validation / Parsing / Business Rules       │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│               Repository Layer              │
│ taskRepository / eventRepository / etc.     │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│                 Data Layer                  │
│ Drizzle ORM + OP-SQLite                    │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│                   SQLite                    │
└─────────────────────────────────────────────┘
```

This is considerably safer than allowing screens to directly execute SQL.

---

# 4. Project Structure

I recommend:

```text
src/
│
├── app/
│   ├── _layout.tsx
│   │
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── tasks.tsx
│   │   ├── events.tsx
│   │   ├── focus.tsx
│   │   └── profile.tsx
│   │
│   ├── task/
│   │   ├── [id].tsx
│   │   └── create.tsx
│   │
│   ├── event/
│   │   ├── create.tsx
│   │   └── [id].tsx
│   │
│   ├── courses/
│   │   └── index.tsx
│   │
│   ├── settings/
│   │   ├── index.tsx
│   │   ├── appearance.tsx
│   │   ├── focus.tsx
│   │   └── backup.tsx
│   │
│   └── modal/
│       ├── quick-add.tsx
│       └── reschedule.tsx
│
├── components/
│   ├── ui/
│   ├── task/
│   ├── event/
│   ├── focus/
│   ├── profile/
│   └── navigation/
│
├── db/
│   ├── client.ts
│   ├── schema/
│   │   ├── courses.ts
│   │   ├── tasks.ts
│   │   ├── subtasks.ts
│   │   ├── events.ts
│   │   ├── focus-sessions.ts
│   │   ├── preferences.ts
│   │   └── sync.ts
│   ├── migrations/
│   └── repositories/
│
├── domain/
│   ├── tasks/
│   ├── events/
│   ├── focus/
│   ├── scheduling/
│   ├── quick-add/
│   └── statistics/
│
├── stores/
│   ├── task-store.ts
│   ├── focus-store.ts
│   ├── filter-store.ts
│   └── ui-store.ts
│
├── hooks/
│
├── services/
│   ├── notifications/
│   ├── backup/
│   ├── sync/
│   └── security/
│
├── utils/
│
├── constants/
│
└── types/
```

Important Expo Router rule:

> `src/app` should contain routes; reusable components, hooks, utilities, etc. should live outside it. ([Expo Documentation][6])

---

# 5. Database Schema — Improved

Your original schema is good, but I would change several things.

## Courses

```text
courses
──────────────
id
name
code
color
created_at
updated_at
deleted_at
```

### Constraints

```text
id PRIMARY KEY
code UNIQUE
name NOT NULL
color NOT NULL
```

---

# 6. Tasks

```text
tasks
────────────────────────
id
course_id
title
description
priority
is_completed
due_date
time_block_start
time_block_end
estimated_pomodoros
completed_pomodoros
completed_at
order_index
created_at
updated_at
deleted_at
```

### Add

```text
deleted_at
```

This is important for future synchronization.

Instead of:

```text
DELETE FROM tasks
```

you can use:

```text
deleted_at = timestamp
```

That means cloud synchronization can later detect deleted records.

---

# 7. Subtasks

```text
subtasks
────────────────
id
task_id
title
is_completed
order_index
created_at
updated_at
deleted_at
```

Add:

```text
updated_at
deleted_at
```

---

# 8. Events

Your current model is missing an important distinction.

A recurring event should have a **series identity**.

Use:

```text
events
────────────────────────
id
series_id
course_id
title
event_type
start_time
end_time
is_recurring
recurrence_rule
created_at
updated_at
deleted_at
```

Example:

```text
series_id = "math-monday"
recurrence_rule =
RRULE:FREQ=WEEKLY;BYDAY=MO
```

This allows future support for:

* editing one occurrence
* editing the entire series
* deleting one occurrence
* deleting the series

---

# 9. Focus Sessions

Change:

```text
timestamp
```

to:

```text
started_at
completed_at
```

Full:

```text
focus_sessions
────────────────────────
id
task_id
duration_minutes
session_type
started_at
completed_at
was_completed
created_at
```

Why?

Because:

```text
started_at
+
completed_at
```

gives you much better analytics.

You can distinguish:

```text
25-minute session completed
25-minute session abandoned after 11 minutes
```

---

# 10. Focus Timer State

Do **not** persist the live timer every second.

Bad:

```text
UPDATE timer
SET remaining = remaining - 1
```

every second.

Instead store:

```text
focus_state
────────────────────
id
task_id
mode
started_at
target_at
paused_at
status
```

For example:

```text
mode = work
started_at = 10:00
target_at = 10:25
status = running
```

Then:

```text
remaining = target_at - currentTime
```

This is the correct architecture for backgrounding, app suspension and timer recovery.

---

# 11. Preferences

Your key/value table is acceptable for simple settings:

```text
user_preferences
────────────────────
key
value
updated_at
```

But **do not put analytics caches here**.

Don't do:

```text
streak_count
total_focus
completed_tasks
```

as authoritative data.

Those values can become stale.

Instead calculate them from source-of-truth tables.

For expensive analytics:

```text
statistics_cache
────────────────
key
value
calculated_at
```

or calculate them on demand.

---

# 12. Index Strategy

Your existing indexes are good, but add:

```sql
tasks(due_date, is_completed, order_index)

tasks(course_id, is_completed)

tasks(time_block_start)

events(start_time)

events(end_time)

events(course_id, start_time)

focus_sessions(task_id)

focus_sessions(completed_at)

subtasks(task_id, order_index)
```

Avoid excessive indexes.

Every index improves reads but makes inserts/updates more expensive and increases storage.

---

# 13. Database Pragmas

At initialization:

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
```

WAL is particularly useful for concurrent read/write behavior.

But make the actual pragma configuration conditional on what OP-SQLite exposes/configures on the target platform rather than blindly executing every pragma.

---

# 14. Transactions

Every multi-step mutation must use a transaction.

Example:

```text
Complete Task
    ↓
UPDATE tasks
    ↓
UPDATE subtasks
    ↓
INSERT focus/session statistics
    ↓
COMMIT
```

If any operation fails:

```text
ROLLBACK
```

Never allow:

```text
task = completed
subtasks = partially updated
statistics = old
```

---

# 15. Zustand Architecture

Do not put your entire database into Zustand.

Bad:

```text
Zustand
 └── every task
 └── every event
 └── every session
 └── every course
```

This causes unnecessary memory usage and re-renders.

Instead:

```text
SQLite = source of truth

Zustand =
    UI state
    temporary state
    optimistic state
    active filters
    selected date
    active timer
    modal state
```

Example:

```text
taskStore

activeDate
activeFilter
selectedTaskId
optimisticUpdates
isQuickAddOpen
```

Then query the database for the actual task collection.

---

# 16. Reactive Database Queries

Use reactive queries where appropriate.

For example:

```text
Today screen
      ↓
query:
WHERE due_date = today
AND deleted_at IS NULL
ORDER BY order_index
```

Do not:

```text
SELECT * FROM tasks
```

and filter 10,000 tasks in JavaScript.

Filtering belongs in SQLite.

---

# 17. FlashList

Use **FlashList v2**.

It requires React Native's New Architecture. ([shopify.github.io][2])

For the task list:

```text
FlashList
    ↓
memo(TaskRow)
    ↓
small leaf components
```

Important rules:

* stable `keyExtractor`
* avoid unnecessary local state inside recycled cells
* avoid inline object creation where it matters
* memoize expensive row props
* use `getItemType` for heterogeneous rows
* do not put explicit `key` props inside recycled row hierarchies

FlashList's current documentation specifically emphasizes memoized props and avoiding unnecessary keys inside item trees. ([shopify.github.io][3])

And test performance in **release mode**, not development mode. ([shopify.github.io][3])

---

# 18. Rendering Architecture

The task screen should look conceptually like:

```text
TasksScreen
│
├── Header
│
├── FilterBar
│
└── TaskList
     │
     ├── TimeGapRow
     ├── TaskRow
     ├── TaskRow
     ├── TimeGapRow
     └── TaskRow
```

Each row should be isolated.

A checkbox changing:

```text
Task #31
```

should **not** cause:

```text
Task #1
Task #2
...
Task #30
Task #32
...
```

to re-render.

---

# 19. Optimistic Mutation System

Use:

```text
User action
      ↓
Optimistic UI update
      ↓
Persist mutation
      ↓
Success → finalize
Failure → rollback
```

Example:

```text
Swipe right
    ↓
task.isCompleted = true
    ↓
animation
    ↓
SQLite transaction
    ↓
success
```

If SQLite fails:

```text
rollback
+
error feedback
```

This gives the user instant interaction without sacrificing consistency.

---

# 20. Mutation Queue

Add a mutation queue.

```text
MutationQueue

[
  UPDATE_TASK
  COMPLETE_TASK
  CREATE_TASK
  DELETE_TASK
]
```

Each mutation has:

```text
id
type
entity_id
payload
created_at
status
retry_count
```

This becomes extremely valuable when you later introduce cloud sync.

---

# 21. Crash Recovery

At app launch:

```text
1. Open DB
2. Run migrations
3. Validate schema
4. Recover pending mutations
5. Recover focus timer
6. Load preferences
7. Render UI
```

If the app crashes during:

```text
task update
```

the SQLite transaction guarantees atomicity.

---

# 22. Security Architecture

This needs to be stronger than the original specification.

## Local database

If the data is considered sensitive:

```text
OP-SQLite
+
SQLCipher
```

OP-SQLite supports SQLCipher as a compilation target. ([GitHub][1])

SQLCipher provides database-file encryption and authenticated encryption mechanisms. ([GitHub][7])

### Key storage

Never store the database encryption key in:

```text
AsyncStorage
SQLite
.env
source code
Zustand
```

Use:

```text
expo-secure-store
```

to keep the encryption key in the platform secure storage.

Architecture:

```text
SecureStore
    ↓
Database Encryption Key
    ↓
OP-SQLite / SQLCipher
    ↓
Encrypted SQLite
```

---

# 23. Secrets

Never put:

```text
API_SECRET
DATABASE_PASSWORD
PRIVATE_KEY
JWT_SECRET
```

inside the mobile application.

Anything shipped inside an APK/IPA should be assumed extractable.

Client applications may contain:

```text
public API key
client identifier
public configuration
```

but not server secrets.

---

# 24. Authentication

If cloud sync is eventually added:

```text
Mobile App
    ↓
Authentication provider
    ↓
short-lived access token
    ↓
API
    ↓
PostgreSQL
```

Do not let the mobile app connect directly to PostgreSQL.

Bad:

```text
React Native → PostgreSQL
```

Correct:

```text
React Native
      ↓
API / BaaS
      ↓
PostgreSQL
```

---

# 25. Cloud Sync Architecture

Design for it now but **do not implement it in MVP**.

Later:

```text
             ┌──────────────┐
             │ Local SQLite │
             └──────┬───────┘
                    │
              Sync Engine
                    │
             ┌──────▼───────┐
             │ Remote API   │
             └──────┬───────┘
                    │
             ┌──────▼───────┐
             │ PostgreSQL    │
             └──────────────┘
```

Every syncable entity gets:

```text
id
created_at
updated_at
deleted_at
```

Optionally:

```text
version
device_id
```

---

# 26. Conflict Resolution

Use:

```text
updated_at
```

initially.

For example:

```text
Device A
Task title = "Math HW"
updated_at = 10:01

Device B
Task title = "Math Homework"
updated_at = 10:03
```

Server chooses:

```text
10:03
```

Later, if the product becomes collaborative, introduce stronger conflict resolution.

Do not prematurely implement CRDTs.

---

# 27. Focus Engine

This should be one of the most carefully engineered modules.

State:

```text
idle
running
paused
completed
```

Timer:

```text
duration = 25min

startedAt = T1
targetAt = T1 + duration

remaining =
max(0, targetAt - Date.now())
```

Never:

```text
remaining--
```

as the source of truth.

---

# 28. Background Timer Recovery

On:

```text
AppState → background
```

store:

```text
targetAt
```

When returning:

```text
remaining = targetAt - Date.now()
```

If:

```text
remaining <= 0
```

transition:

```text
WORK → BREAK
```

This prevents timer drift.

---

# 29. Timer Notifications

Add local notifications:

```text
25:00
   ↓
background
   ↓
OS notification
   ↓
"Focus session complete"
```

The notification should be scheduled from the target timestamp rather than relying on JavaScript running continuously.

---

# 30. Focus Session Integrity

When the session finishes:

```text
BEGIN TRANSACTION

INSERT focus_session

UPDATE task
SET completed_pomodoros =
    completed_pomodoros + 1

COMMIT
```

Then:

```text
timer → break
```

This prevents analytics from being updated twice.

---

# 31. Scheduling Engine

Move scheduling logic into:

```text
domain/scheduling/
```

Functions:

```text
getFreeGaps()
detectCollision()
calculateDuration()
validateTimeRange()
generateRecurringEvents()
rescheduleTask()
```

Do not put these calculations inside React components.

---

# 32. Collision Detection

For intervals:

```text
A.start < B.end
AND
A.end > B.start
```

means:

```text
A overlaps B
```

Use this for:

* events
* tasks
* study blocks

---

# 33. Free Gap Calculation

Given:

```text
10:00–11:00 Math
12:00–13:30 CS
```

generate:

```text
11:00–12:00 FREE
```

Then:

```text
+ 60m Free Gap
```

becomes an actionable scheduling object.

---

# 34. Quick Add Parser

Don't implement this as a giant regex.

Use a tokenizer/parser pipeline:

```text
raw string
   ↓
tokenizer
   ↓
date parser
   ↓
time parser
   ↓
priority parser
   ↓
course/tag parser
   ↓
title reconstruction
   ↓
TaskDraft
```

Input:

```text
HW 3 tomorrow 5pm p1 #math
```

Output:

```ts
{
  title: "HW 3",
  dueDate: "...",
  time: "17:00",
  priority: "p1",
  course: "math"
}
```

Use a deterministic parser first.

AI parsing should be optional, not the primary parser.

---

# 35. Error Handling

Every repository operation should return controlled errors.

Example categories:

```text
DatabaseError
ValidationError
ConflictError
NotFoundError
MigrationError
SyncError
PermissionError
```

Avoid:

```ts
catch (e) {
  console.log(e);
}
```

without recovery.

---

# 36. Global Error Boundaries

Use:

```text
Root Error Boundary
        ↓
Screen Error Boundary
        ↓
Component fallback
```

A broken profile screen should not destroy the entire app.

Expo Router supports route-level error boundaries, so this fits naturally into the current architecture. ([Expo Documentation][4])

---

# 37. Database Migration Safety

Migration flow:

```text
App starts
    ↓
Check DB version
    ↓
Run pending migrations
    ↓
Validate
    ↓
Open application
```

Never modify production schema manually.

All schema changes go through:

```text
Drizzle migration
```

Example:

```text
0001_initial
0002_add_deleted_at
0003_add_series_id
0004_add_focus_state
```

Drizzle's OP-SQLite integration supports generated migrations and migration execution. ([Drizzle ORM][8])

---

# 38. Backup System

Profile:

```text
Export / Backup Local Data
```

should create:

```text
numo-backup-2026-08-26.json
```

with:

```text
schemaVersion
appVersion
exportedAt

courses[]
tasks[]
subtasks[]
events[]
focusSessions[]
preferences[]
```

Do **not** export encryption keys.

---

# 39. Import Validation

Never blindly import JSON.

Pipeline:

```text
File
 ↓
Parse
 ↓
Schema validation
 ↓
Version validation
 ↓
Sanitize
 ↓
Transaction
 ↓
Import
```

Use a schema validator such as:

```text
Zod
```

---

# 40. Data Validation

All external input should be validated.

Examples:

```text
task title
course code
priority
event type
date
time
recurrence rule
backup JSON
```

Domain objects should never assume UI input is valid.

---

# 41. UI Design System

Keep your monochrome shell.

Your functional color separation is good:

```text
Shell → monochrome

Priority → semantic color

Event type → semantic color
```

One change:

### Course colors

Don't allow arbitrary user-selected colors to become visually dominant.

Course colors should be:

```text
semantic accent
10% background tint
```

while the shell remains monochrome.

---

# 42. Typography

Define tokens instead of scattering:

```text
fontSize: 13
fontSize: 16
fontSize: 20
fontSize: 26
```

throughout the application.

Use:

```text
display
heading
body
caption
mono
```

Example:

```text
text-display
text-heading
text-body
text-caption
text-mono
```

This makes the design system maintainable.

---

# 43. Animation Architecture

Use Reanimated for:

```text
gesture-driven animations
layout transitions
opacity
scale
translation
timer visual transitions
```

Use ordinary React state for:

```text
business state
database state
navigation state
```

Do not animate by repeatedly calling React `setState`.

---

# 44. Gesture Architecture

Swipe:

```text
Gesture Handler
      ↓
Reanimated shared value
      ↓
UI-thread animation
      ↓
threshold detection
      ↓
JS mutation only after action
```

This keeps the gesture responsive.

---

# 45. Task Completion Animation

Recommended:

```text
0 ms
↓
scale 0.85
↓
spring → 1.0
↓
checkmark
↓
strikethrough 120ms
↓
row collapse 180ms
↓
database mutation
```

But don't immediately destroy the row before persistence has a chance to fail.

Use:

```text
optimistic state
```

and rollback if required.

---

# 46. Haptics

Don't trigger haptics continuously.

Use them only for:

```text
checkbox completion
swipe threshold
slider snap
timer completion
important confirmation
```

Avoid:

```text
every animation frame
every slider pixel
```

---

# 47. Navigation

For four primary sections:

```text
Tasks
Events
Focus
Profile
```

Use Expo Router's tab architecture.

If you require a highly customized tab bar, use the custom tab API. Expo currently provides JavaScript tabs, native tabs, and custom tabs as distinct approaches. ([Expo Documentation][9])

For a custom Numo-style bar, I would use:

```text
expo-router/ui
```

rather than fighting the native tab bar.

---

# 48. Screen Architecture

## Tasks

```text
Tasks
├── Header
├── DateSelector
├── FilterStrip
├── TaskList
├── FreeGapRow
├── SecondaryFAB
└── PrimaryFAB
```

---

## Events

```text
Events
├── Header
├── DateRangeSummary
├── CalendarGrid
├── StartTimeSlider
├── EndTimeSlider
└── SaveButton
```

---

## Focus

```text
Focus
├── TaskContext
├── Timer
├── ModeSelector
├── Reset
├── StartPause
└── AmbientSound
```

---

## Profile

```text
Profile
├── Hero
├── Metrics
├── SemesterStatus
├── DailyGoal
└── Settings
```

---

# 49. Performance Architecture

The biggest performance rule:

> **Move work away from the render path.**

Bad:

```text
render
 ↓
calculate statistics
 ↓
filter 5,000 tasks
 ↓
sort
 ↓
render
```

Good:

```text
SQLite
 ↓
filtered query
 ↓
small result
 ↓
render
```

---

# 50. Derived Data

Don't calculate this inside React:

```text
completedTasks
totalFocus
streak
dailyProgress
```

Create dedicated queries:

```sql
SELECT COUNT(*)
FROM tasks
WHERE is_completed = 1;
```

and:

```sql
SELECT SUM(duration_minutes)
FROM focus_sessions
WHERE session_type = 'work';
```

For expensive statistics, cache them with explicit invalidation rather than treating the cache as source-of-truth.

---

# 51. Startup Optimization

Critical startup path:

```text
Splash
 ↓
initialize database
 ↓
migrations
 ↓
load minimal preferences
 ↓
render Tasks
```

Do **not** wait for:

```text
analytics
backup discovery
cloud sync
non-critical assets
profile statistics
```

before showing the main screen.

Load those asynchronously.

---

# 52. Lazy Loading

Lazy-load:

```text
Profile analytics
Backup screen
Course management
Settings
Event editor
Advanced statistics
```

The Tasks screen is the highest-priority route.

---

# 53. Memory Management

Avoid:

```text
global task arrays
duplicated database + Zustand copies
large image caches
unbounded logs
```

Prefer:

```text
SQLite
+
small reactive query result
+
small Zustand state
```

---

# 54. Logging

Create:

```text
logger.ts
```

with levels:

```text
debug
info
warn
error
```

Production:

```text
debug → disabled
```

Never log:

```text
authentication tokens
database encryption keys
personal data
backup contents
```

---

# 55. Observability

Track performance metrics such as:

```text
cold_start_ms
warm_start_ms
task_query_ms
database_write_ms
screen_render_ms
focus_recovery_ms
crash_rate
```

For FlashList specifically, current documentation exposes load/performance measurement mechanisms, and recommends profiling release builds. ([shopify.github.io][10])

---

# 56. Testing Architecture

Use four levels.

## Unit

Test:

```text
quick-add parser
date parser
priority parser
collision detection
free-gap calculation
timer calculations
streak calculations
```

---

## Repository tests

Test:

```text
create task
update task
delete task
complete task
transaction rollback
migration
foreign keys
```

---

## Component tests

Test:

```text
TaskRow
Timer
DateSelector
TimeSlider
QuickAdd
```

---

## E2E

Critical flows:

```text
Create task
Complete task
Swipe task
Create event
Start focus
Background app
Resume timer
Export backup
Import backup
```

---

# 57. Stability Rules

Implement these from day one:

### Database

* Foreign keys
* WAL
* Transactions
* Migrations
* Schema validation
* Corruption handling
* Backup/export

### UI

* Error boundaries
* Loading states
* Empty states
* Retry states
* Optimistic rollback

### Timer

* Timestamp-based state
* Background recovery
* Notification fallback
* Duplicate-completion prevention

### Sync

* Idempotent mutations
* Retry with exponential backoff
* Conflict handling
* Tombstones (`deleted_at`)

---

# 58. Security Rules

```text
No secrets in app bundle
No direct PostgreSQL access
SecureStore for credentials
SQLCipher for sensitive local DB
Validate all external data
Sanitize imported backups
Do not log sensitive information
Short-lived auth tokens
HTTPS only
Server-side authorization
```

---

# 59. Dependency Philosophy

Don't install a library for every feature.

Core:

```text
Expo
React Native
Expo Router
TypeScript
Zustand
Drizzle
OP-SQLite
FlashList
Reanimated
Gesture Handler
NativeWind
Lucide
Expo Haptics
Expo Secure Store
Expo Notifications
Zod
```

Everything else should have a concrete justification.

---

# 60. Final Architecture

The final system should look like this:

```text
                         Numo
                           │
            ┌──────────────┴──────────────┐
            │                             │
        UI Layer                     Navigation
            │                        Expo Router
            │
      ┌─────▼─────┐
      │ Components │
      └─────┬─────┘
            │
      ┌─────▼─────┐
      │  Zustand  │
      │ UI State  │
      └─────┬─────┘
            │
      ┌─────▼─────────────┐
      │   Domain Layer    │
      │                   │
      │ Tasks             │
      │ Events            │
      │ Focus             │
      │ Scheduling        │
      │ Quick Add         │
      │ Statistics        │
      └─────┬─────────────┘
            │
      ┌─────▼─────────────┐
      │ Repository Layer  │
      └─────┬─────────────┘
            │
      ┌─────▼─────────────┐
      │ Drizzle ORM       │
      └─────┬─────────────┘
            │
      ┌─────▼─────────────┐
      │    OP-SQLite      │
      └─────┬─────────────┘
            │
      ┌─────▼─────────────┐
      │ SQLite / SQLCipher│
      └───────────────────┘


          Future Cloud Layer
                 │
          ┌──────▼───────┐
          │ Sync Engine  │
          └──────┬───────┘
                 │
             HTTPS API
                 │
          ┌──────▼───────┐
          │ PostgreSQL   │
          └──────────────┘
```

## The most important architectural decision

I would make this the core principle of the entire application:

> **SQLite is the source of truth. Zustand is the interaction/state acceleration layer, not the database.**

That gives you:

```text
Offline-first
        +
fast UI
        +
crash recovery
        +
consistent data
        +
future synchronization
```

without creating a second database inside your React state.

Also, don't optimize based on theoretical FPS numbers alone. FlashList's current guidance explicitly recommends measuring real performance in release builds and optimizing the actual bottleneck. ([shopify.github.io][3])

This version is substantially more production-oriented than the original plan: it preserves your UI/UX concept while adding **transactional integrity, migration safety, timer recovery, encryption, validation, rollback, observability, sync readiness, and a much cleaner separation of concerns**.

[1]: https://github.com/OP-Engineering/op-sqlite?utm_source=chatgpt.com "GitHub - OP-Engineering/op-sqlite: Fastest SQLite library for react-native by @ospfranco · GitHub"
[2]: https://shopify.github.io/flash-list/docs/v2-migration/?utm_source=chatgpt.com "Migrating to v2 | FlashList"
[3]: https://shopify.github.io/flash-list/docs/fundamentals/performance/?utm_source=chatgpt.com "Performance | FlashList"
[4]: https://docs.expo.dev/versions/latest/sdk/router/?utm_source=chatgpt.com "Router - Expo Documentation"
[5]: https://orm.drizzle.team/docs/get-started/op-sqlite-new?utm_source=chatgpt.com "Drizzle ORM - Native SQLite"
[6]: https://docs.expo.dev/router/basics/core-concepts/?utm_source=chatgpt.com "Core concepts of file-based routing in Expo Router - Expo Documentation"
[7]: https://github.com/sqlcipher/sqlcipher?utm_source=chatgpt.com "GitHub - sqlcipher/sqlcipher: SQLCipher is a standalone fork of SQLite that adds 256 bit AES encryption of database files and other security features. · GitHub"
[8]: https://orm.drizzle.team/docs/sqlite/connect-op-sqlite?utm_source=chatgpt.com "Drizzle ORM - OP SQLite"
[9]: https://docs.expo.dev/router/advanced/tabs/?utm_source=chatgpt.com "JavaScript tabs - Expo Documentation"
[10]: https://shopify.github.io/flash-list/docs/guides/list-profiling/?utm_source=chatgpt.com "List Profiling with useBenchmark | FlashList"
