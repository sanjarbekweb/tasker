# AI Workflow Rules — Numo

## Approach

Build Numo incrementally using a strict, spec-driven workflow. The context files (`1-overview.md`, `2-architecture.md`, `3-code-standards.md`, `4-ui-context.md`, `5-ai-workflow-rules.md`, `6-progress-tracker.md`) and the assigned feature specs define what to build, the architectural invariants, the code standards, and the current state of progress. Always implement directly against these specifications — never infer or invent product behavior, database schemas, or timer/sync semantics from scratch.

## Unit Scoping Law

The AI assistant works strictly on the single feature spec assigned for the active session (e.g., `feature-specs/07-focus-timer-recovery.md`).
- Do not refactor, rename, or "improve" files outside the spec's defined boundary, even if optimization opportunities are observed.
- Out-of-scope observations, technical debt, or potential improvements go into `6-progress-tracker.md` under **Session Notes** — never into active code changes.

## Step-by-Step Execution Protocol

1. **Context Ingestion:** Read all context files and the assigned feature spec in full before generating any code.
2. **Plan Restatement:** State the implementation plan in 3–6 concise bullet points: files created/modified, and the specific System Invariants (`2-architecture.md`) that apply — e.g. "SQLite is source of truth," "soft delete only," "timestamp-driven timer."
3. **Status Update (Start):** Mark the unit as `[/] In Progress` in `6-progress-tracker.md`.
4. **Implementation:** Write production-ready code adhering strictly to `3-code-standards.md` and `4-ui-context.md` — no ad hoc styling, inline hex codes, untyped structures, or business logic inside components.
5. **Verification:** Run `npx tsc --noEmit` and the project's lint/test commands (e.g. `npm run lint`, `npm run test`). All must pass with zero warnings or errors.
6. **Transaction & Invariant Verification:** If the unit touches `tasks`, `subtasks`, `focus_sessions`, or `focus_state`:
   - Verify the mutation is wrapped in a single Drizzle transaction — no partial writes across tables.
   - If it can complete a focus session, manually verify the status check-and-set (`focus_state.status: 'running' → 'completed'`) is guarded so `completed_pomodoros` cannot be double-incremented by a retry or a background/foreground race.
   - If it deletes a syncable entity, verify it sets `deleted_at` rather than issuing a hard `DELETE`.
7. **Migration Check:** If the unit changes the schema, verify a new numbered Drizzle migration was generated (never a manual schema edit) and that it was exercised against the migration test suite.
8. **Status Update (Finish):** Mark the unit as `[x] Completed` in `6-progress-tracker.md` with concise session notes (features built, deviations justified, new env vars or dependencies added).

## Scoping & Splitting Rules

Prefer small, verifiable increments over large, speculative changes. Split an implementation step immediately if it combines:
- Database schema migrations and UI/screen components in the same unit.
- Multiple unrelated domains (e.g., scheduling logic and focus-timer recovery) in one pass.
- Background/notification-scheduling changes with unrelated CRUD logic (task/event/course editing).

If a change cannot be verified end-to-end within a single validation cycle, the unit is too large — split it into discrete sub-tasks.

## Handling Missing Requirements & Invariant Conflicts

- **No Speculative Features:** Do not invent behavior not documented in the spec or context files — including sync behavior, notification copy, or animation timing not specified.
- **Resolving Ambiguity:** If a requirement is ambiguous, state the working assumption explicitly and log it in `6-progress-tracker.md` before writing code.
- **Invariant Conflicts:** If a feature requirement conflicts with a System Invariant in `2-architecture.md` (e.g., a spec that asks for a live per-second timer write, or a hard delete), explicitly flag the conflict and propose an invariant-compliant alternative rather than proceeding with a violation.

## Error Escalation Protocol

When encountering a build error, TypeScript compilation failure, or runtime exception:
1. **Full Trace Inspection:** Read the complete error output and stack trace before formulating a fix — do not assume root causes from surface patterns.
2. **Root Cause Statement:** State the root cause in one sentence before proposing or executing code changes.
3. **Targeted Remediation:** Propose the minimal change required to resolve the issue. If a fix requires modifying more than 2 files outside the active unit's scope, stop and ask for guidance.
4. **Zero Type Suppressions:** Never suppress TypeScript errors using `@ts-ignore`, `@ts-nocheck`, or an `any` cast. Resolve the underlying schema/type mismatch (often in `db/schema/` or a Zod schema) cleanly.

## Protected Files

Do not modify the following unless explicitly directed by a designated spec:
- `components/ui/*` (base primitives — extend via wrapper components or design tokens instead).
- `db/migrations/*` (committed migration history — never hand-edited).
- Core library configuration (`tsconfig.json`, `tailwind.config.js`/NativeWind config, `app.json`/`expo` config) unless a new design token or global plugin is explicitly required.
- `services/security/*` key-handling code, unless the spec is specifically about SecureStore/encryption.

## Keeping Documentation in Sync

Update the relevant context files whenever an implementation step modifies:
- System boundaries, directory topology, or layer responsibilities (`2-architecture.md`).
- Shared Zod schemas, repository error types, or the Drizzle schema shape (`3-code-standards.md`).
- Design tokens, NativeWind config, or layout/animation patterns (`4-ui-context.md`).
- Completed deliverables, open questions, or logged assumptions (`6-progress-tracker.md`).

## Communication Style

- **Direct & Technical:** Skip conversational preambles and meta-announcements. State the plan, trade-offs, and implementation directly.
- **Transparent Invariant Tracking:** State which invariants apply to each action, and confirm them explicitly upon completion (e.g., "transaction wraps both writes," "soft delete used," "timer state is timestamp-based").
