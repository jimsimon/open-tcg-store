#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# Runtime UID/GID adjustment (LinuxServer.io PUID/PGID convention)
#
# Adjusts the "app" user/group to match the PUID/PGID env vars so the
# container can write to host-mounted volumes regardless of ownership.
# Defaults are set in the Dockerfile (568 for TrueNAS Scale "apps" user).
# ---------------------------------------------------------------------------

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

# Fix ownership of writable directories after UID/GID change
chown app:app /app/sqlite-data
chown -R app:app /var/log/nginx /var/lib/nginx /run/nginx

# Drop privileges and exec the main command (supervisord by default)
exec su-exec app "$@"
