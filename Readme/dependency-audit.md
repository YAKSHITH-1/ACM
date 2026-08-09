# Dependency Audit Summary

## auth-backend
- Ran `npm audit` (initial scan) found:
  - **body-parser** (low) – Denial of service via invalid limit value. Fixed by updating to `1.20.6`.
  - **brace-expansion** (high) – Multiple DoS vulnerabilities via exponential expansion. Fixed by updating to `5.0.9`.
  - **mongoose** (moderate) – Prototype pollution in update casting. Fixed by updating from `8.3.2` to `8.24.2`.
- After applying `npm audit fix`, all vulnerabilities were resolved.
- Current installed versions (as of audit): 
  - body-parser: 1.20.6
  - brace-expansion: 5.0.9
  - mongoose: 8.24.2
- `package.json` retains caret ranges (e.g., `mongoose": "^8.3.2"`) allowing future non‑breaking updates.
- No further action required.

## frontendCSS
- Only devDependencies (`@types/react`, `@types/react-dom`, `typescript`) present.
- `npm audit` reported **zero vulnerabilities**.

## Recommendations
- Keep dependencies up to date; consider scheduling regular `npm audit` (or `npm audit fix`) in CI.
- For production, lock exact versions via `package-lock.json` (already committed) and test updates in a staging environment.
- Review any future advisories for the above packages.
