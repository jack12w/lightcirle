# Use official Node.js image
FROM node:20-alpine

WORKDIR /app

# Install build tools needed for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

# Install dependencies (including dev deps for Tailwind build)
COPY package*.json ./
RUN npm install

# Copy application
COPY . .

# Build Tailwind CSS (replaces cdn.tailwindcss.com in production)
RUN npx tailwindcss -c tailwind.config.js -i tailwind.input.css -o css/tailwind.css --minify

# Expose port
EXPOSE 3000

# Start server (start.sh handles volume symlinks)
RUN chmod +x start.sh
CMD ["/bin/sh", "start.sh"]
