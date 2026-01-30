# bytepad MCP Server - Standalone Docker Image
FROM node:20-alpine

LABEL maintainer="Sami Tugal <tugalsami@gmail.com>"
LABEL version="0.24.1"
LABEL description="bytepad MCP Server for AI tool integration"

WORKDIR /app

# Install dependencies
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy server files
COPY dist/ ./dist/
COPY data/ ./data/

# Create data directory for persistence
RUN mkdir -p /app/data

# Environment variables
ENV NODE_ENV=production
ENV MCP_PORT=3847
ENV MCP_HOST=0.0.0.0
ENV LOG_LEVEL=info

# Expose port
EXPOSE 3847

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3847/api/health || exit 1

# Start server
CMD ["node", "dist/server.js"]
