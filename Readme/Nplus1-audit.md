# N+1 Query Audit

## Goal
Identify any place where related data is fetched inside a loop (one database call per item) and refactor to batch the fetch into a single request.

## Findings
After scanning the entire codebase (backend and frontend) for patterns such as:
- `for … await Model.findById(...)`
- `.map(async item => Model.findOne(...))`
- Loops that call a function performing a DB query per iteration

**No N+1 query patterns were detected.**

### Backend (`auth-backend/src`)
- Loops exist only for:
  - Validation of team members (no DB calls).
  - Filtering registrations using a pre‑built `eventsMap` (all events fetched in a single `$in` query).
- All repository/service calls (`findById`, `findOne`, `find`) occur **outside** loops or are singular fetches per request.
- Functions like `getMyRegistrations` and `getRegistrations` already batch‑fetch related events after gathering IDs.

### Frontend (`frontendCSS/JS/*.js`, `main.js`)
- All `fetch`/`axios` calls are made **once** per UI action (e.g., load events, submit form, login).
- No fetch calls are found inside `.map`, `for`, or `while` loops.
- Data rendering uses already‑fetched arrays (e.g., `data.registrations.map(...)`) without additional requests.

## Conclusion
The codebase already follows best practices for avoiding N+1 queries. No refactoring is required.

## Recommendations
- Keep an eye on any new features that introduce loops over IDs; ensure related data is fetched in a single query (`$in`, `populate`, or JOIN‑style) before the loop.
- Consider adding a lint rule (e.g., `eslint-plugin-unicorn` with `no-useless-catch` or custom) to flag `await` inside loops if desired for future safety.
