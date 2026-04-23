# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------------------------
FROM node:24-alpine AS deps

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
FROM node:24-alpine AS app

# Install nginx and supervisor to manage multiple processes
# shadow provides usermod/groupmod for runtime UID/GID changes
RUN apk add --no-cache nginx supervisor xdelta3 p7zip shadow

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Create a non-root user to run all processes.
# The entrypoint will adjust UID/GID at runtime via PUID/PGID env vars.
RUN addgroup -g 568 -S app && adduser -u 568 -G app -S app

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
# packages/shared has no dependencies so pnpm does not create a node_modules dir for it

# Copy source code
COPY . .

# Create directory for SQLite data files (mount a volume here at runtime)
RUN mkdir -p /app/sqlite-data

# Point drizzle configs at the container's SQLite data directory
ENV OTCGS_DATABASE_PATH=/app/sqlite-data
ENV TCG_DATA_DATABASE_PATH=/app/sqlite-data

# PUID/PGID default to 568 (TrueNAS Scale "apps" user). Override at runtime
# to match your host volume owner:
#   docker run -e PUID=1000 -e PGID=1000 ...
ENV PUID=568
ENV PGID=568

# Create nginx runtime directories and set ownership so the app user can write them
RUN mkdir -p /var/log/nginx /var/lib/nginx/tmp /run/nginx \
    && chown -R app:app /var/log/nginx /var/lib/nginx /run/nginx /app

# Supervisor config
COPY docker/supervisord.conf /etc/supervisord.conf

# nginx production config (listens on port 8080 — no root required)
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Entrypoint adjusts the app user UID/GID to match PUID/PGID and fixes
# ownership of writable directories. Supervisord runs as root so it can
# open /dev/stdout and /dev/stderr for child log dispatchers; each child
# program drops to the app user via supervisord's user= directive.
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

VOLUME ["/app/sqlite-data"]

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/api/status || exit 1

ENTRYPOINT ["/entrypoint.sh"]

# Use supervisor to manage nginx + API server + UI server
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
