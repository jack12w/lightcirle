#!/bin/sh
# lightcirle — startup script for Fly.io
# Creates symlinks to the persistent volume so data survives restarts

set -e

echo "startup: initializing..."

VOLUME_DIR="/app/volume"

# Ensure volume subdirectories exist
mkdir -p "$VOLUME_DIR/data" "$VOLUME_DIR/uploads"
echo "startup: volume dirs ready"

# Dockerfile no longer creates /app/data or /app/uploads,
# so we can directly create symlinks without rm -rf
if [ ! -L /app/data ]; then
  ln -s "$VOLUME_DIR/data" /app/data
  echo "startup: symlinked /app/data -> volume"
fi

if [ ! -L /app/uploads ]; then
  ln -s "$VOLUME_DIR/uploads" /app/uploads
  echo "startup: symlinked /app/uploads -> volume"
fi

echo "startup: volume symlinks OK"
echo "startup: launching node server.js..."

# Start the application
exec node server.js
