# Configuration

BytePad can be customized through the Settings panel. Access it via `Ctrl+,` or through the command palette (`Ctrl+K`).

## General Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Language | Interface language (English, Turkish) | English |
| Theme | Color theme | Dark |
| Username | Display name for the app | User |

## Gist Sync

BytePad can sync your data to a GitHub Gist for backup and cross-device sync.

### Setup

1. Generate a GitHub Personal Access Token:
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Generate new token with `gist` scope

2. In BytePad Settings → Sync:
   - Paste your GitHub token
   - Click "Create New Gist" or enter existing Gist ID
   - Enable auto-sync

### Sync Options

| Option | Description |
|--------|-------------|
| Auto-sync | Automatically sync at intervals |
| Sync Interval | Time between syncs (minutes) |
| Gist ID | Your data storage Gist ID |

## AI Configuration

FlowBot requires an AI API key to function.

### Supported Providers

- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic** (Claude)
- **OpenRouter** (Multiple models)

### Setup

1. Get an API key from your provider
2. In Settings → AI:
   - Select your provider
   - Enter your API key
   - Choose your preferred model

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Command Palette |
| `Ctrl+1-9` | Switch modules |
| `Ctrl+/` | Open FlowBot |
| `Ctrl+Shift+F` | Focus Mode |
| `Ctrl+Shift+N` | Notification Center |
| `Escape` | Close modals |

### Electron-only Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+T` | Quick add task (global) |
| `Ctrl+Shift+P` | Start Pomodoro (global) |

## Environment Variables

For development and self-hosting, you can configure BytePad via environment variables:

```bash
# .env file
VITE_DEFAULT_LANGUAGE=en
VITE_APP_NAME=BytePad
```

See `.env.example` for all available options.

## Data Storage

BytePad stores data locally using IndexedDB in the browser. When using Electron, data is stored in:

- **Windows**: `%APPDATA%/bytepad`
- **macOS**: `~/Library/Application Support/bytepad`
- **Linux**: `~/.config/bytepad`

## Reset Settings

To reset all settings to defaults:

1. Open Command Palette (`Ctrl+K`)
2. Type "Reset Settings"
3. Confirm the action

**Note**: This does not delete your notes, tasks, or other data - only settings.
