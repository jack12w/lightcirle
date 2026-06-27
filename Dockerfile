# Use full Node.js image (includes all build tools)
FROM node:20

WORKDIR /app

# Install dependencies (better-sqlite3 compiles natively)
COPY package*.json ./
RUN npm install --production

# Copy application
COPY . .

# Create required directories (replaced by symlinks on start)
RUN mkdir -p uploads data

# Expose port
EXPOSE 3000

# Start script handles volume symlinks
RUN chmod +x start.sh
CMD ["/bin/sh", "start.sh"]
