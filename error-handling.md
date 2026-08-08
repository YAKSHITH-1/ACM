# Error Handling Improvements

## Goal
Ensure that clients never see stack traces, internal file paths, or raw database/error details, while still logging full information server‑side for debugging.

## Changes Made

### 1. Central Error Middleware (`src/middlewares/error.middleware.js`)
- **Logging**: All errors are logged with `console.error`, including the full error object (stack trace, etc.).
- **Client Response**:
  - For errors that are instances of `ApiError` (used for intentional operational errors), the original message is sent (these messages are predefined and safe).
  - For known operational errors, generic messages are returned:
    - **Mongoose duplicate key (code 11000)** → `"Resource already exists"` (status 409).
    - **Mongoose validation error** → `"Invalid input data"` (status 400).
    - **Mongoose cast error (invalid ObjectId)** → `"Invalid resource identifier"` (status 400).
    - **JWT errors** (`JsonWebTokenError`, `TokenExpiredError`) → `"Invalid token"` or `"Token expired"` (status 401).
  - In **production**, any other 500 error yields `"Internal Server Error"`.
  - In **development**, non‑500 errors keep their original message (useful for debugging) but never include stack trace.
  - The response never includes `err.stack` or file paths.

### 2. Async Handler (`src/utils/asyncHandler.js`)
- Captures rejected promises from route handlers and forwards them to `next(err)`, ensuring they hit the central error middleware.

### 3. External Service Wrappers
- **SendEmail (`src/utils/sendEmail.js`)**:
  - Previously threw `new Error(data.message || 'Brevo API error')`, which could leak third‑party API details.
  - Now throws a generic `'Failed to send email'` error after logging the full response server‑side.
  - Both HTTP errors and unexpected exceptions result in the same generic client‑facing message.

### 4. Validation Errors
- Handled by `express-validator` middleware (`src/middlewares/validate.middleware.js`), which returns a 400 with the validation message (e.g., `"Full name is required"`). These messages are intentionally user‑facing and do not expose internals.

### 5. CORS Mis‑configuration
- The custom CORS callback returns `new Error("Not allowed by CORS")` when the origin is not allowed. This message is safe and does not contain internal info.

## What Is No Longer Exposed
- Stack traces in HTTP responses.
- Mongoose error details (e.g., `E11000 duplicate key`, `CastError`, validation error objects).
- JWT library error specifics beyond generic messages.
- Third‑party API error bodies (Brevo, etc.).
- File system paths or module names.

## Verification
- Manual testing with malformed requests (invalid IDs, duplicate registrations, missing fields) shows generic messages.
- Server logs (`console.error`) contain full error objects for debugging.
- No changes to public API contract; status codes remain semantically correct.

## Future Considerations
- If additional third‑party services are added, wrap their errors similarly.
- Consider integrating a dedicated logging service (e.g., Winston, Pino) for structured logs.
- Periodically review error mapping as new error types emerge.
