# bytepad MCP Server - Standalone Docker Image

# ---- Stage 1: builder ----------------------------------------------------
# Compiles TypeScript -> dist/ inside the image, so the build is
# reproducible from a clean checkout with no host-side build step.
FROM node:20-alpine AS builder

WORKDIR /app

# Install full dependency set (dev deps needed for `tsc`)
COPY package*.json ./
RUN npm ci

# Compile
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ---- Stage 2: runtime ------------------------------------------------------
FROM node:20-alpine

LABEL maintainer="Sami Tugal <tugalsami@gmail.com>"
LABEL version="0.25.0"
LABEL description="bytepad MCP Server for AI tool integration"

WORKDIR /app

# Install dependencies
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install only production dependencies (no devDependencies, no TypeScript)
RUN npm ci --only=production

# Copy compiled server output from the builder stage - no sources, no
# builder node_modules end up in this layer.
COPY --from=builder /app/dist ./dist/

# Create data directory for persistence (populated at runtime, not build time)
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
