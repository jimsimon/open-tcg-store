#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# Runtime UID/GID adjustment (LinuxServer.io PUID/PGID convention)
#
# Adjusts the "app" user/group to match the PUID/PGID env vars so the
# container can write to host-mounted volumes regardless of ownership.
# Defaults are set in the Dockerfile (568 for TrueNAS Scale "apps" user).
# ---------------------------------------------------------------------------

# Prevent accidentally running the app as root
if [ "$PUID" = "0" ] || [ "$PGID" = "0" ]; then
  echo "[entrypoint] ERROR: PUID/PGID must not be 0 (root)" >&2
  exit 1
fi

CURRENT_UID=$(id -u app)
CURRENT_GID=$(id -g app)

if [ "$PGID" != "$CURRENT_GID" ]; then
  echo "[entrypoint] Changing app group GID from $CURRENT_GID to $PGID"
  groupmod -o -g "$PGID" app
fi

if [ "$PUID" != "$CURRENT_UID" ]; then
  echo "[entrypoint] Changing app user UID from $CURRENT_UID to $PUID"
  usermod -o -u "$PUID" app
fi

# Fix ownership of writable directories after UID/GID change.
# Only needed when PUID/PGID differ from the build-time defaults — skipping
# the recursive chown avoids 10-30s+ startup delay on tens of thousands of files.
if [ "$PUID" != "$CURRENT_UID" ] || [ "$PGID" != "$CURRENT_GID" ]; then
  chown -R app:app /app
  chown -R app:app /var/log/nginx /var/lib/nginx /run/nginx
fi

# Always fix the mounted data directory — host volume ownership may differ
# even when PUID/PGID match the build-time defaults.
chown -R app:app /app/sqlite-data

# Exec the main command (supervisord by default) as root.
# Supervisord needs root to open /dev/stdout and /dev/stderr for child log
# dispatchers. Each child program drops to the app user via supervisord's
# user= directive in supervisord.conf.
exec "$@"
