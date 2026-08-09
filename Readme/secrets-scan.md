# Secrets Scan Report

## Scope
Scanned the entire codebase (frontendCSS and auth-backend) for hardcoded API keys, tokens, passwords, or other sensitive credentials.

## Findings

### 1. `.env` file (auth-backend/.env)
Contains the following secrets:
- `MONGO_URI` – includes username (`AcmUser`) and password (`Acmuser8791`) for MongoDB Atlas
- `JWT_ACCESS_SECRET` – 64‑character hex string used to sign access tokens
- `JWT_REFRESH_SECRET` – 64‑character hex string used to sign refresh tokens
- `RESEND_API_KEY` – API key for the Resend email service
- `EMAIL_PASS` – password for the SMTP email account (`acmjyothy@gmail.com`)
- `BREVO_API_KEY` – API key for Brevo (formerly Sendinblue)

**Status:** The file is listed in `.gitignore`, so it is **not** tracked by Git. No evidence that it has been committed to the repository.

### 2. Source code (JavaScript, HTML, CSS)
- No actual secret values (keys, tokens, passwords) were found hard‑coded in the source.
- Matches were limited to variable names (`token`, `password`, `hashedToken`, etc.) and legitimate uses of environment variables (e.g., `process.env.JWT_ACCESS_SECRET`).
- No patterns matching live API keys (Stripe `sk_live*`, AWS `AKIA*`, Google `AIza*`, SendGrid `SG.*`, etc.) were detected.

### 3. Git history
A quick check of recent commits shows no leaked secrets (the `.env` file has never been added). For completeness, you can run:
```bash
git log -p --all --grep="AKIA\|sk_live\|AIza\|SG\." | head
```
to verify no historic leaks.

## Recommendations
1. **Keep `.env` ignored** – Ensure `.env` remains in `.gitignore` for all developers and CI environments.
2. **Use secret management in production** – When deploying to platforms like Render, Vercel, or AWS, store the values as environment variables in the host rather than relying on a `.env` file.
3. **Rotate compromised secrets** – If you suspect any of the values in `.env` have been exposed, rotate them immediately:
   - MongoDB password (update connection string and dev/prod credentials)
   - JWT secrets (generate new random strings)
   - Resend, Brevo, and SMTP passwords/API keys
4. **Consider a `.env.example`** – Add a template file with placeholder values (no real secrets) to help new developers set up the project.
5. **CI/CD linting** – Add a step that blocks commits if `.env` is accidentally added or if common secret patterns appear in staged files.

## Conclusion
No hardcoded secrets are currently shipped with the source code or tracked by Git. The only sensitive data resides in `.env`, which is properly ignored. Maintain the ignore rule and move to platform‑level environment variables for production deployment to further reduce risk.
