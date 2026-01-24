# Start Bytepad MCP Server with Docker (PowerShell)

$ErrorActionPreference = "Stop"

# Check for env vars
if (-not $env:GITHUB_TOKEN) {
    Write-Host "Warning: GITHUB_TOKEN not set. Gist sync will not work." -ForegroundColor Yellow
}

if (-not $env:GIST_ID) {
    Write-Host "Warning: GIST_ID not set. You can create one using the gist_create tool." -ForegroundColor Yellow
}

Write-Host "Starting Bytepad MCP Server..." -ForegroundColor Cyan

$GithubToken = if ($env:GITHUB_TOKEN) { $env:GITHUB_TOKEN } else { "" }
$GistId = if ($env:GIST_ID) { $env:GIST_ID } else { "" }
$LogLevel = if ($env:LOG_LEVEL) { $env:LOG_LEVEL } else { "info" }

docker run -i --rm `
    -v bytepad-data:/app/data `
    -e "GITHUB_TOKEN=$GithubToken" `
    -e "GIST_ID=$GistId" `
    -e "LOG_LEVEL=$LogLevel" `
    bytepad-mcp-server:latest
