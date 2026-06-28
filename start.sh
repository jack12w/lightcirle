#!/bin/sh
# lightcirle — startup script for Fly.io
# Creates symlinks to the persistent volume so data survives restarts

set -e

echo "startup: initializing (fly deploy $(date -u +%Y-%m-%dT%H:%M:%SZ))"

VOLUME_DIR="/app/volume"

# Check if volume is mounted
if [ ! -d "$VOLUME_DIR" ]; then
  echo "startup: FATAL — volume not mounted at $VOLUME_DIR"
  exit 1
fi
echo "startup: volume mounted at $VOLUME_DIR"

# Ensure volume subdirectories exist
mkdir -p "$VOLUME_DIR/data" "$VOLUME_DIR/uploads"
echo "startup: volume subdirs ready"

# Inspect what's on the volume
DB_FILE="$VOLUME_DIR/data/lightcirle.db"
if [ -f "$DB_FILE" ]; then
  DB_SIZE=$(stat -c%s "$DB_FILE" 2>/dev/null || echo "unknown")
  echo "startup: found existing DB on volume ($DB_SIZE bytes)"
else
  echo "startup: no existing DB on volume — will create fresh"
fi

# Ensure /app/data points to volume
if [ ! -L /app/data ]; then
  echo "startup: /app/data is not a symlink — fixing..."
  rm -rf /app/data 2>/dev/null || true
  ln -s "$VOLUME_DIR/data" /app/data
  echo "startup: symlinked /app/data -> $VOLUME_DIR/data"
else
  echo "startup: /app/data symlink already exists"
fi

# Ensure /app/uploads points to volume
if [ ! -L /app/uploads ]; then
  echo "startup: /app/uploads is not a symlink — fixing..."
  rm -rf /app/uploads 2>/dev/null || true
  ln -s "$VOLUME_DIR/uploads" /app/uploads
  echo "startup: symlinked /app/uploads -> $VOLUME_DIR/uploads"
else
  echo "startup: /app/uploads symlink already exists"
fi

echo "startup: all checks passed, launching application..."
exec node server.js
