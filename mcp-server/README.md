# Bytepad MCP Server

MCP (Model Context Protocol) server for Bytepad productivity app. Exposes all Bytepad tools and data for use with Claude Desktop and other MCP-compatible clients.

**Status:** Tested and ready for production use ✓

## Features

- **47 Tools** for managing tasks, habits, notes, journals, bookmarks, and more
- **Gist Sync** tools for cloud synchronization with GitHub Gists
- **Read-only Resources** for quick data access
- **Docker support** for easy deployment
- **Multi-arch images** (amd64 + arm64) for Intel/AMD and Apple Silicon

---

## Quick Start

### Option 1: Using Prebuilt Image (Recommended)

No build required - just pull and run:

```bash
# 1. Create environment file
cp .env.example .env
# Edit .env with your tokens (optional for basic usage)

# 2. Run with Docker Compose
docker compose up -d

# 3. Verify it's running
docker compose logs -f
```

**Or run directly with Docker:**

```bash
docker run -i --rm \
  -v bytepad-data:/app/data \
  -e GITHUB_TOKEN=ghp_your_token \
  -e GIST_ID=your_gist_id \
  ghcr.io/samitugal/bytepad-mcp-server:latest
```

### Option 2: Build Locally (Development)

```bash
# Using npm
cd mcp-server
npm install
npm run build
npm start

# Using Docker
docker build -t bytepad-mcp-server .
docker run -i --rm -v bytepad-data:/app/data bytepad-mcp-server
```

---

## Configure MCP Clients

### Claude Desktop

Add to your Claude Desktop configuration file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bytepad": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "bytepad-data:/app/data",
        "-e", "GITHUB_TOKEN",
        "-e", "GIST_ID",
        "ghcr.io/samitugal/bytepad-mcp-server:latest"
      ],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here",
        "GIST_ID": "your_gist_id_here"
      }
    }
  }
}
```

### Cursor

Add to Cursor settings (Settings → Features → MCP Servers):

```json
{
  "bytepad": {
    "command": "docker",
    "args": [
      "run", "-i", "--rm",
      "-v", "bytepad-data:/app/data",
      "ghcr.io/samitugal/bytepad-mcp-server:latest"
    ]
  }
}
```

---

## Available Image Tags

| Tag | Description |
|-----|-------------|
| `latest` | Latest stable release (from main branch) |
| `vX.Y.Z` | Specific version (e.g., `v1.0.0`) |
| `sha-xxxxx` | Specific commit (for debugging) |

**Registry:** `ghcr.io/samitugal/bytepad-mcp-server`

**Platforms:** `linux/amd64`, `linux/arm64`

---

## Available Tools

### Task Management (6 tools)
- `create_task` - Create new task
- `update_task` - Update existing task
- `toggle_task` - Complete/uncomplete task
- `delete_task` - Delete task
- `get_pending_tasks` - List pending tasks
- `get_tasks_by_priority` - Filter by priority

### Habit Tracking (4 tools)
- `create_habit` - Create new habit
- `toggle_habit_today` - Mark habit done
- `get_today_habits` - Today's habits
- `get_habit_streaks` - Streaks leaderboard

### Notes (5 tools)
- `create_note` - Create markdown note
- `update_note` - Update note
- `search_notes` - Search notes
- `get_note` - Get specific note
- `delete_note` - Delete note

### Journal (4 tools)
- `create_journal_entry` - Daily entry with mood/energy
- `get_journal_entry` - Get by date
- `get_recent_journal` - Recent entries
- `get_mood_trend` - Mood/energy trends

### Bookmarks (5 tools)
- `create_bookmark` - Save URL
- `search_bookmarks` - Search bookmarks
- `list_bookmarks` - List with filters
- `update_bookmark` - Update metadata
- `delete_bookmark` - Delete bookmark

### Summary & Stats (3 tools)
- `get_daily_summary` - Today's overview
- `get_weekly_summary` - Weekly stats
- `get_productivity_stats` - Overall stats

### Gist Sync (8 tools)
- `gist_configure` - Set up sync
- `gist_status` - Check sync status
- `gist_validate` - Validate credentials
- `gist_create` - Create new Gist
- `gist_pull` - Pull from Gist
- `gist_push` - Push to Gist
- `gist_sync` - Smart sync
- `gist_export` - Export data

---

## Available Resources

Resources provide read-only access to data:

- `bytepad://tasks` - All tasks
- `bytepad://tasks/pending` - Pending tasks
- `bytepad://tasks/today` - Today's tasks
- `bytepad://habits` - All habits
- `bytepad://habits/today` - Today's habits
- `bytepad://notes` - All notes
- `bytepad://journal` - All journal entries
- `bytepad://journal/today` - Today's entry
- `bytepad://bookmarks` - All bookmarks
- `bytepad://summary/daily` - Daily summary
- `bytepad://gamification` - XP, levels, achievements

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATA_DIR` | No | `/app/data` | Data storage path |
| `LOG_LEVEL` | No | `info` | Log level (debug/info/warn/error) |
| `GITHUB_TOKEN` | No | - | GitHub PAT for Gist sync |
| `GIST_ID` | No | - | Gist ID for sync |
| `TAVILY_API_KEY` | No | - | API key for web search tools |

---

## Data Persistence

Data is stored in `/app/data/bytepad-data.json`. Use Docker volumes to persist:

```bash
# Named volume (recommended)
docker run -v bytepad-data:/app/data ...

# Bind mount (for backup access)
docker run -v /path/on/host:/app/data ...
```

---

## Troubleshooting

### Image pull fails

```bash
# Ensure you're logged in to GHCR (for private repos)
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Or pull anonymously (public repos)
docker pull ghcr.io/samitugal/bytepad-mcp-server:latest
```

### Port already in use

MCP uses stdio transport (not HTTP), so no ports are exposed. If you see port conflicts, check for other services.

### Container won't start

```bash
# Check logs
docker compose logs -f

# Run interactively for debugging
docker run -it --rm ghcr.io/samitugal/bytepad-mcp-server:latest
```

### Permission denied on data volume

```bash
# Fix volume permissions
docker run --rm -v bytepad-data:/app/data alpine chown -R 1001:1001 /app/data
```

### Apple Silicon (arm64) issues

The image supports arm64 natively. If you encounter issues:

```bash
# Force platform
docker run --platform linux/arm64 ...

# Or use Rosetta (slower)
docker run --platform linux/amd64 ...
```

### Claude Desktop doesn't connect

1. Restart Claude Desktop after config changes
2. Check the config file path is correct
3. Ensure Docker is running
4. Verify the image exists: `docker images | grep bytepad`

### Missing environment variables

```bash
# Pass variables directly
docker run -e GITHUB_TOKEN=xxx -e GIST_ID=yyy ...

# Or use env file
docker run --env-file .env ...
```

---

## Security

- **Never commit** `.env` files with real tokens
- Use **minimal token scopes** (only `gist` for GitHub)
- Container runs as **non-root user** (UID 1001)
- See [SECURITY.md](../docs/SECURITY.md) for more details

---

## License

MIT
