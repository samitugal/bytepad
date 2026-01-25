# Bytepad MCP Server
# Multi-stage build for smaller image

# Build arguments for metadata
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

# Re-declare ARGs for this stage (ARGs don't persist across stages)
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0

# Image metadata
LABEL org.opencontainers.image.title="Bytepad MCP Server" \
      org.opencontainers.image.description="MCP server for Bytepad productivity app with 47+ tools" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/samitugal/bytepad" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.vendor="Bytepad"

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S bytepad && \
    adduser -S bytepad -u 1001

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built files
COPY --from=builder /app/dist ./dist

# Create data directory
RUN mkdir -p /app/data && \
    chown -R bytepad:bytepad /app

# Switch to non-root user
USER bytepad

# Environment variables
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV LOG_LEVEL=info

# Data volume
VOLUME ["/app/data"]

# Health check - verify Node.js is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Entry point
ENTRYPOINT ["node", "dist/index.js"]
