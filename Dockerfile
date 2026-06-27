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

# Start server
CMD ["node", "server.js"]
