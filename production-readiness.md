# Production Readiness – Minimal Additions

## What was added
To make the application suitable for a basic production deployment, the following lightweight artifacts were introduced:

### Frontend (`frontendCSS/package.json`)
- Added a `build` script that outputs a message indicating the frontend is served as static files (no build step required).
- Added a `start` script with guidance on serving the static files (typically via the backend’s `express.static` middleware).

This satisfies the ponytail principle: no extra tooling, just a placeholder so that `npm run build` exists and does nothing harmful.

### Backend (`auth-backend/Dockerfile`)
- A multi‑stage‑free Dockerfile based on `node:18-alpine`.
- Installs only production dependencies via `npm ci --only=production`.
- Copies the source, exposes port `5000`, and starts the server with `node src/server.js`.
- Includes a `.dockerignore` to avoid copying unnecessary files (node_modules, logs, git, env, etc.).

These files enable a straightforward `docker build` and `docker run` to launch the API server. The frontend static files are already copied into the repository and are served by the backend (see `src/app.js` lines that serve `../../frontendCSS`).

## How to use
```bash
# Build the Docker image (run from the auth-backend directory)
docker build -t acm-auth-backend .

# Run the container, mapping the host port 5000 to the container port
docker run -d -p 5000:5000 --name acm-auth acm-auth-backend
```

Ensure the required environment variables (MONGO_URI, JWT secrets, API keys, etc.) are supplied via `-e` flags or an `.env` file when running the container.

## Next steps (if further production hardening is desired)
- Add a non‑root user in the Dockerfile.
- Use a multi‑stage build to further reduce image size.
- Add healthchecks and restart policies.
- Set up a CI/CD pipeline (GitHub Actions, GitLab CI) that builds and pushes the image.
- Consider using a reverse proxy (NGINX, Traefik) for TLS termination and static file serving.
- Add logging rotation and monitoring.

For now, the above changes provide a minimal, production‑runnable baseline while keeping the codebase simple and avoiding over‑engineering.