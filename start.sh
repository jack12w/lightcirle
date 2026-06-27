#!/bin/sh
# lightcirle — startup script for Fly.io
# Creates symlinks to the persistent volume so data survives restarts

set -e

VOLUME_DIR="/app/volume"

# Ensure volume subdirectories exist
mkdir -p "$VOLUME_DIR/data" "$VOLUME_DIR/uploads"

# Remove existing directories that Dockerfile created (they block symlinks)
rm -rf /app/data /app/uploads

# Create symlinks to volume
ln -s "$VOLUME_DIR/data" /app/data
ln -s "$VOLUME_DIR/uploads" /app/uploads

# Verify the symlinks work
ls -la /app/data /app/uploads > /dev/null 2>&1

echo "startup: volume symlinks created successfully"

# Start the application
exec node server.js
