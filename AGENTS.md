# AGENTS.md

## Project Identity
This project is SeasonScout, a production-style React travel climate planner.

The goal is to build a polished portfolio-quality web app with:
- React
- Vite
- Tailwind CSS
- Supabase
- live weather integration
- stored destination climate data

Always treat this as a real product, not a throwaway demo.

---

## Required Reading Before Work
Before making changes, always read:
1. PRD.md
2. TASKS.md
3. this AGENTS.md file

---

## Core Working Principle

### Thin Frontend, Smart Backend
The frontend should remain thin.

Frontend responsibilities:
- render UI
- manage routing
- handle local UI state
- trigger backend/service calls
- present loading, empty, and error states

Backend responsibilities:
- business logic
- climate scoring
- best-month calculations
- data normalization
- enrichment orchestration
- cache refresh strategy
- aggregation queries
- sensitive or secret-based operations

Do not push durable or reusable business logic into page components unless there is a strong reason.

---

## Working Rules

### 1. Plan Before Editing
Before making changes:
- briefly identify the task being worked on
- state what files need to change
- keep the plan short and concrete

### 2. Work in Small Steps
Do not attempt huge uncontrolled refactors.
Prefer small, scoped, high-confidence changes.

### 3. Update TASKS.md
When a task is completed:
- mark it as [x] in TASKS.md
- do not mark tasks complete unless they are truly complete

If a task needs to be split:
- add sub-tasks without deleting the original intent

### 4. Preserve Architecture Quality
Favor:
- reusable components
- clean separation of concerns
- service layers for APIs and Supabase
- maintainable file organization
- readable naming
- minimal duplication
- backend-first logic placement

Avoid:
- giant components
- deeply tangled logic
- duplicated fetch code
- hardcoded secrets
- unnecessary dependencies
- heavy business logic inside frontend views

### 5. Minimize Scope Creep
Do only what is needed for the current task.
Do not silently redesign unrelated parts of the app.

### 6. Explain File Changes Clearly
After changes:
- explain what files were modified
- explain why each file changed
- mention important follow-up work if relevant

### 7. Respect Existing Code
If the current code works, avoid rewriting it without a strong reason.
Improve incrementally.

### 8. Handle Errors Properly
When integrating APIs or Supabase:
- handle loading states
- handle empty states
- handle error states
- avoid crashing the UI

### 9. Keep UI Polished
The interface should feel:
- modern
- clean
- responsive
- premium
- travel-oriented

### 10. Validate Work
After meaningful changes:
- run the build when possible
- run lint when configured
- fix issues caused by the current task

---

## Backend Placement Guidance

### Use SQL / Postgres Functions / RPC for:
- comfort score calculations
- best month calculations
- aggregate reads
- filtering or ranking logic tied to stored data
- deduplication logic
- database-driven rules

### Use Edge Functions for:
- external API enrichment
- periodic refresh workflows
- secret-based integrations
- orchestrating multi-source imports
- server-side sync jobs

### Keep in Frontend only:
- presentation mapping
- small UI-only sorting/filtering
- temporary local state
- simple formatting for display

If logic is reusable, expensive, or important to data correctness, prefer backend placement.

---

## Code Style Preferences

### General
- Prefer simple, readable code
- Use consistent naming
- Keep components focused
- Extract repeated logic into hooks, services, or helpers when appropriate

### React
- Prefer functional components
- Prefer clear props and minimal prop drilling
- Keep page components readable
- Move data-fetching logic out of UI where reasonable

### Styling
- Use Tailwind consistently if Tailwind is configured
- Avoid messy inline style sprawl
- Keep spacing and typography consistent

### Data Access
- Use dedicated service files for:
  - destinations
  - climate
  - weather
  - auth
  - favorites

Do not place all external fetch logic directly inside page components unless there is a strong reason.

---

## Product Priorities
When tradeoffs exist, prioritize in this order:

1. Correctness
2. Maintainability
3. Clean architecture
4. Clean UX
5. Performance
6. Extra features

---

## Phase 1 Priorities
Phase 1 must support:
- destination search
- destination page
- live weather
- short forecast
- monthly climate display
- best months display
- auth
- favorites

Do not spend time on later-phase ideas before Phase 1 foundations are stable.

---

## If Something Is Unclear
If a detail is missing:
- choose the simplest scalable approach
- do not overengineer
- leave clean placeholders if necessary
- document assumptions in code comments or brief notes

---

## Definition of Done
A task is considered done only if:
- the implementation exists
- the UI or logic is wired correctly
- obvious edge cases are handled
- related TASKS.md checkbox is updated
- the project still builds if the task affects buildable code
- frontend is not carrying avoidable heavy business logic