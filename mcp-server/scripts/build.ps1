# Build Bytepad MCP Server Docker image (PowerShell)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

Write-Host "Building Bytepad MCP Server..." -ForegroundColor Cyan

Set-Location $ProjectDir

# Build Docker image
docker build -t bytepad-mcp-server:latest .

Write-Host ""
Write-Host "Build complete! Image: bytepad-mcp-server:latest" -ForegroundColor Green
Write-Host ""
Write-Host "To run with Claude Desktop, add this to your config:" -ForegroundColor Yellow
Write-Host ""
Write-Host @'
{
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
}
'@
