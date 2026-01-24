#!/bin/bash
# Build Bytepad MCP Server Docker image

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Building Bytepad MCP Server..."

cd "$PROJECT_DIR"

# Build Docker image
docker build -t bytepad-mcp-server:latest .

echo ""
echo "Build complete! Image: bytepad-mcp-server:latest"
echo ""
echo "To run with Claude Desktop, add this to your config:"
echo ""
echo '{
  "mcpServers": {
    "bytepad": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "bytepad-data:/app/data",
        "-e", "GITHUB_TOKEN",
        "-e", "GIST_ID",
        "bytepad-mcp-server"
      ]
    }
  }
}'
