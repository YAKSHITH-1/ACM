# Rate Limiting Implementation (auth-backend)

## Overview
Added request rate limiting to protect the API from abuse while keeping thresholds configurable.

## Changes Made

### 1. Custom middleware (`src/middleware/rateLimiter.js`)
- **`authRateLimiter`** – for authentication routes (register, login, password‑reset, etc.)
  - Uses a combined key of **IP address + account identifier (email)**.
  - Tracks attempts in‑memory (Map) and responds with `429 Too Many Requests`.
  - Implements **exponential backoff**: after exceeding `MAX_ATTEMPTS`, the `Retry-After` header grows as `BASE_RETRY_MS * 2^(excess)`.
  - All limits are configurable via environment variables:
    - `AUTH_RATE_LIMIT_WINDOW_MS` (default: 900000 ms = 15 min)
    - `AUTH_RATE_LIMIT_MAX` (default: 5 attempts)
    - `AUTH_BASE_RETRY_MS` (default: 60000 ms = 1 min)
- **`apiLimiter`** – moderate, IP‑based limiter for public endpoints (e.g., `GET /api/events`).
  - Configurable via `API_RATE_LIMIT_WINDOW_MS` and `API_RATE_LIMIT_MAX` (defaults: 15 min, 100 requests).
- **`authUserLimiter`** – looser IP‑based limiter for authenticated user actions.
  - Configurable via `AUTH_USER_RATE_LIMIT_WINDOW_MS` and `AUTH_USER_RATE_LIMIT_MAX` (defaults: 15 min, 300 requests).

### 2. Auth routes (`src/routes/auth.routes.js`)
- Replaced the previous global `express-rate-limit` with `authRateLimiter()` on:
  - `/register`
  - `/login`
  - `/forgot-password`
  - `/verify-reset-token/:token`
  - `/reset-password/:token`
  - `/verify-email`
- Other auth endpoints (logout, refresh‑token, protected profile, admin) remain un‑rate‑limited here (they receive limits from the route‑specific middleware applied elsewhere).

### 3. Event routes (`src/routes/event.routes.js`)
- **Public endpoint** `GET /` (getEvents) → `apiLimiter`.
- **All protected routes** (event CRUD, user registrations, admin registrations) → `authUserLimiter` placed after the `protect` middleware.

### 4. Proxy trust
- `app.set("trust proxy", 1);` already present in `src/app.js` ensures the visitor IP is correctly extracted when behind a reverse proxy (e.g., Render, Vercel).

## Configuration
Add the following to `.env` (or your hosting env) to tune limits:

```env
# Auth (stricter) – IP+account with exponential backoff
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=5
AUTH_BASE_RETRY_MS=60000

# Public endpoints – moderate
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX=100

# Authenticated user actions – looser
AUTH_USER_RATE_LIMIT_WINDOW_MS=900000
AUTH_USER_RATE_LIMIT_MAX=300
```

## Why this satisfies the request
- **Stricter limits on authentication routes** – `authRateLimiter` limits per IP+account and backs off exponentially instead of a hard lockout.
- **Moderate limits on public endpoints** – `apiLimiter` applies a reasonable request ceiling.
- **Looser limits on authenticated user actions** – `authUserLimiter` gives a higher ceiling for logged‑in users.
- **All thresholds configurable** – via environment variables, no hardcoded values.
- Uses only existing dependency (`express-rate-limit`) plus a tiny in‑memory tracking map; no new packages required.

## Notes
- The in‑memory store is suitable for single‑instance deployments. For horizontal scaling, replace the `Map` with a Redis‑backed store (future work).
- Exponential backoff is applied via the `Retry-After` header; clients should respect it and retry later.