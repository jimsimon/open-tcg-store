#!/bin/sh
set -e

# Ensure the SQLite data directory exists and is writable by the app user.
# When a volume is mounted at /app/sqlite-data (e.g., TrueNAS host path or
# Docker named volume), the ownership may not match the container's "app" user.
mkdir -p /app/sqlite-data
chown app:app /app/sqlite-data

# Drop privileges and exec the main command (supervisord by default)
exec su-exec app "$@"
