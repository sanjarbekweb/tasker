# UI Context

## Theme

Numo's shell is a **monochrome, precision-tool interface** — the surface stays neutral so that meaning (priority, event type, course identity) is carried entirely by deliberate, sparing color, never by the chrome itself. Supports Light and Dark themes:
- **Light Theme:** Neutral off-white canvas and card surfaces, near-black high-contrast typography, crisp hairline borders. Color appears only as semantic accents — never as decorative background fill.
- **Dark Theme:** Deep near-black canvas, elevated dark-gray cards, low-opacity white hairline borders, the same semantic accents at slightly reduced saturation to avoid glare.

The one rule that overrides all others: **the shell is monochrome; color is meaning.** A course color or priority color may tint 10% of a surface as an accent — it must never become the dominant color of a screen.

## Colors

All UI components must use these design tokens — hardcoded arbitrary hex values are prohibited in component code.

| Role | Token | Notes |
| :--- | :--- | :--- |
| Canvas Background (Light) | `--bg-canvas` | Neutral off-white |
| Canvas Background (Dark) | `--bg-canvas-dark` | Near-black |
| Card Surface (Light) | `--bg-surface-card` | White |
| Card Surface (Dark) | `--bg-surface-dark` | Elevated dark gray |
| Primary Text (Light) | `--text-primary` | Near-black |
| Primary Text (Dark) | `--text-primary-dark` | Near-white |
| Muted Text | `--text-muted` | Secondary labels, timestamps, captions |
| Hairline Border (Light) | `--border-default` | Card/list dividers |
| Hairline Border (Dark) | `--border-dark` | Card/list dividers |
| Priority — High | `--priority-high` | Semantic accent, task priority only |
| Priority — Medium | `--priority-medium` | Semantic accent, task priority only |
| Priority — Low | `--priority-low` | Semantic accent, task priority only |
| Event Type — Class | `--event-class` | Semantic accent for course/class events |
| Event Type — Personal | `--event-personal` | Semantic accent for personal events |
| Focus / Timer Accent | `--focus-accent` | Active timer ring, running-state indicators |
| Streak Indicator | `--gamify-streak` | Profile streak/flame indicator only |
| Success / Completion | `--state-success` | Task/session completion confirmation |
| Course Accent (per-course) | `--course-accent-{n}` | Assigned per course; rendered as ~10% background tint, never a solid fill |

## Typography

| Role | Token | Usage |
| :--- | :--- | :--- |
| Display | `text-display` | Screen titles, hero numbers (e.g. streak count) |
| Heading | `text-heading` | Section headers, card titles |
| Body | `text-body` | Standard UI text, task/event titles |
| Caption | `text-caption` | Metadata, timestamps, muted labels |
| Mono | `text-mono` | Timer countdown, durations, numeric telemetry |

No raw `fontSize` values in component code — always reference a token.

## Border Radius

| Context | Class | Notes |
| :--- | :--- | :--- |
| Badges, priority pills, status tags | `rounded-full` | |
| Task rows, event cards, metric widgets | `rounded-2xl` | |
| Modals, bottom sheets (quick-add, reschedule) | `rounded-3xl` | |
| Compact controls, timer mode selector | `rounded-xl` | |
| Inline tags, tooltips | `rounded-lg` | |

## Component Library

- **Primitives:** Live in `components/ui/`; shared cross-feature widgets live in `components/shared/`; feature-specific views live in `components/{task,event,focus,profile,navigation}/`.
- **List Rendering:** All scrollable collections (Tasks, Events) use FlashList v2 with memoized row components (`TaskRow`, event rows), stable `keyExtractor`, and `getItemType` for heterogeneous rows (e.g. `TimeGapRow` interleaved with `TaskRow`).
- **Zero-CLS Skeletons:** A dedicated `Skeleton` primitive matches the target layout's exact dimensions/margins/padding to prevent layout shift while data loads.
- **Timer Display:** A dedicated `Timer` component renders elapsed/remaining time from `target_at - now()`, using `text-mono` for the numeric readout and `--focus-accent` for the active-state ring — never a raw countdown state variable.

## Layout Patterns

- **Tasks Screen:** `Header → DateSelector → FilterStrip → TaskList (TaskRow / TimeGapRow interleaved) → SecondaryFAB → PrimaryFAB`.
- **Events Screen:** `Header → DateRangeSummary → CalendarGrid → StartTimeSlider → EndTimeSlider → SaveButton`.
- **Focus Screen:** `TaskContext → Timer → ModeSelector → Reset → StartPause → AmbientSound`, laid out to keep the timer as the single visual anchor of the screen.
- **Profile Screen:** `Hero → Metrics → SemesterStatus → DailyGoal → Settings`, with all metric values sourced from live queries, never hardcoded or stale-cached.
- **Modals & Bottom Sheets:** Quick-add and reschedule use slide-up sheets with a blurred backdrop; both are dismissible without losing in-progress input.
- **Row Isolation:** A single row's state change (e.g. one checkbox) must not trigger neighboring rows to re-render — enforced via memoization at the row level.

## Icons

- **Library:** `lucide-react-native` (stroke-based vector icons).
- **Sizing Scale:**
  - `16x16`: Inline metadata (due-date tags, duration labels, small pill badges).
  - `20x20`: Standard button icons, filter icons, navigation/tab icons.
  - `32x32`–`40x40`: Empty-state illustrations and large profile metric icons.
