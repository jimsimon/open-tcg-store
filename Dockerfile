# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# Copy manifests and lockfile first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/ui/package.json ./packages/ui/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including devDependencies — needed for tsx)
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2: Production image
# ---------------------------------------------------------------------------
FROM node:22-alpine AS app

# Install nginx and supervisor to manage multiple processes
RUN apk add --no-cache nginx supervisor

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Create a non-root user to run all processes
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source code
COPY . .

# Create directory for SQLite data files (mount a volume here at runtime)
RUN mkdir -p /app/sqlite-data

# Create nginx runtime directories and set ownership so the app user can write them
RUN mkdir -p /var/log/nginx /var/lib/nginx/tmp /run/nginx \
    && chown -R app:app /var/log/nginx /var/lib/nginx /run/nginx /app

# Supervisor config
COPY docker/supervisord.conf /etc/supervisord.conf

# nginx production config (listens on port 8080 — no root required)
COPY docker/nginx.conf /etc/nginx/nginx.conf

VOLUME ["/app/sqlite-data"]

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/api/status || exit 1

# Use supervisor to manage nginx + API server + UI server
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
