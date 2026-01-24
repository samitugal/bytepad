#!/bin/bash
# Start Bytepad MCP Server with Docker

set -e

# Check for required env vars
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Warning: GITHUB_TOKEN not set. Gist sync will not work."
fi

if [ -z "$GIST_ID" ]; then
    echo "Warning: GIST_ID not set. You can create one using the gist_create tool."
fi

echo "Starting Bytepad MCP Server..."

docker run -i --rm \
    -v bytepad-data:/app/data \
    -e GITHUB_TOKEN="${GITHUB_TOKEN:-}" \
    -e GIST_ID="${GIST_ID:-}" \
    -e LOG_LEVEL="${LOG_LEVEL:-info}" \
    bytepad-mcp-server:latest
