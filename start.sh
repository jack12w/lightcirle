#!/bin/sh
# lightcirle — startup script for Fly.io
# Creates symlinks to the persistent volume so data survives restarts

set -e

VOLUME_DIR="/app/volume"

# Ensure volume subdirectories exist
mkdir -p "$VOLUME_DIR/data" "$VOLUME_DIR/uploads"

# Create symlinks (force in case they exist from a previous run)
ln -sfn "$VOLUME_DIR/data" /app/data
ln -sfn "$VOLUME_DIR/uploads" /app/uploads

# Start the application
exec node server.js
