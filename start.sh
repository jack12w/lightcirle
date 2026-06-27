#!/bin/sh
# lightcirle — startup script for Fly.io
# Creates symlinks to the persistent volume so data survives restarts

VOLUME_DIR="/app/volume"

echo "startup: initializing..."

# Ensure volume subdirectories exist
mkdir -p "$VOLUME_DIR/data" 2>/dev/null || true
mkdir -p "$VOLUME_DIR/uploads" 2>/dev/null || true

# Remove existing directories that block symlinks (ignore errors)
rm -rf /app/data 2>/dev/null || true
rm -rf /app/uploads 2>/dev/null || true

# Create symlinks to volume
ln -s "$VOLUME_DIR/data" /app/data 2>/dev/null || {
  echo "startup: WARNING: could not create data symlink, using volume directly"
}
ln -s "$VOLUME_DIR/uploads" /app/uploads 2>/dev/null || {
  echo "startup: WARNING: could not create uploads symlink, using volume directly"
}

echo "startup: volume initialized, starting Node.js..."

# Start the application
exec node server.js
