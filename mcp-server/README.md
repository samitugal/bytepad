# Bytepad MCP Server

MCP (Model Context Protocol) server for Bytepad productivity app. Exposes all Bytepad tools and data for use with Claude Desktop and other MCP-compatible clients.

**Status:** Tested and ready for production use ✓

## Features

- **47 Tools** for managing tasks, habits, notes, journals, bookmarks, and more
- **Gist Sync** tools for cloud synchronization with GitHub Gists
- **Read-only Resources** for quick data access
- **Docker support** for easy deployment

## Quick Start

### Prerequisites

- Docker installed and running
- (Optional) GitHub Personal Access Token with `gist` scope for sync features

### Build

```bash
# Using npm
cd mcp-server
npm install
npm run build

# Using Docker
docker build -t bytepad-mcp-server .
```

### Run with Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

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
        "bytepad-mcp-server"
      ],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here",
        "GIST_ID": "your_gist_id_here"
      }
    }
  }
}
```

### Run Locally (Development)

```bash
npm run dev
```

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

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATA_DIR` | No | `/app/data` | Data storage path |
| `LOG_LEVEL` | No | `info` | Log level (debug/info/warn/error) |
| `GITHUB_TOKEN` | No | - | GitHub PAT for Gist sync |
| `GIST_ID` | No | - | Gist ID for sync |

## Data Persistence

Data is stored in `/app/data/bytepad-data.json`. Use Docker volumes to persist:

```bash
docker run -v bytepad-data:/app/data ...
```

## License

MIT
