# Use official Node.js image
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application
COPY . .

# Create required directories
RUN mkdir -p uploads data

# Expose port
EXPOSE 3000

# Start server (start.sh handles volume symlinks)
RUN chmod +x start.sh
CMD ["/bin/sh", "start.sh"]
