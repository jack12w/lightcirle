# Use Debian-based Node.js (better-sqlite3 compatibility)
FROM node:20-slim

WORKDIR /app

# Install better-sqlite3 build dependencies (debian-based)
RUN apt-get update && apt-get install -y python3 make g++ build-essential && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application
COPY . .

# Create required directories (will be replaced by symlinks in start.sh)
RUN mkdir -p uploads data

# Expose port
EXPOSE 3000

# Start server (start.sh handles volume symlinks)
RUN chmod +x start.sh
CMD ["/bin/sh", "start.sh"]
