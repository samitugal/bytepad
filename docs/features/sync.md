# Gist Sync

BytePad can synchronize your data to a GitHub Gist, enabling backup and cross-device sync.

## Features

- Automatic cloud backup
- Cross-device synchronization
- Version history (Gist revisions)
- Secure token-based auth
- Selective sync

## How It Works

1. BytePad encrypts and compresses your data
2. Data is uploaded to a private GitHub Gist
3. Other devices can pull from the same Gist
4. Changes sync at configurable intervals

## Setup

### 1. Create GitHub Token

1. Go to [GitHub Token Settings](https://github.com/settings/tokens)
2. Click "Generate new token" (classic)
3. Give it a name (e.g., "BytePad Sync")
4. Select only the `gist` scope
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

### 2. Configure BytePad

1. Open Settings (`Ctrl+,`)
2. Go to "Sync" section
3. Paste your GitHub token
4. Click "Create New Gist" (or enter existing Gist ID)
5. Enable auto-sync if desired

### 3. Verify Connection

After setup:
- Status should show "Connected"
- Last sync time should update
- Test with manual "Sync Now"

## Sync Operations

### Manual Sync

Click "Sync Now" to immediately:
1. Push local changes to Gist
2. Pull remote changes to local

### Auto-Sync

When enabled:
- Syncs automatically at set intervals
- Default: Every 5 minutes
- Configurable: 1-60 minutes

### Conflict Resolution

If conflicts occur:
1. BytePad shows conflict notification
2. Choose "Keep Local" or "Keep Remote"
3. Or merge manually

## Sync Settings

| Setting | Description | Default |
|---------|-------------|---------|
| GitHub Token | Your personal access token | - |
| Gist ID | Target Gist for sync | Auto-created |
| Auto-sync | Enable automatic sync | Off |
| Sync Interval | Minutes between syncs | 5 |

## What Syncs

| Data | Synced |
|------|--------|
| Notes | Yes |
| Tasks | Yes |
| Habits | Yes |
| Journal | Yes |
| Bookmarks | Yes |
| Settings | Yes |
| Focus stats | Yes |
| XP/Levels | Yes |

## Multi-Device Sync

### Setup Second Device

1. Install BytePad on new device
2. Open Settings → Sync
3. Enter **same** GitHub token
4. Enter **same** Gist ID
5. Click "Pull" to load data

### Sync Best Practices

1. **Sync before closing** - Manual sync before switching devices
2. **Check sync status** - Verify last sync time
3. **One device at a time** - Avoid simultaneous edits
4. **Regular intervals** - Use auto-sync

## Security

### Token Security

- Tokens are stored locally only
- Never shared with BytePad servers
- Minimal scope (gist only)
- Can be revoked anytime

### Data Privacy

- Gist is created as private by default
- Only you have access via token
- Data is compressed before upload

### Token Management

To revoke access:
1. Go to GitHub → Settings → Tokens
2. Find your BytePad token
3. Click "Delete"
4. BytePad will lose sync access

## Troubleshooting

### "Invalid Token"

- Verify token is copied correctly
- Check token hasn't expired
- Ensure token has `gist` scope
- Try generating new token

### "Sync Failed"

- Check internet connection
- Verify Gist ID is correct
- Try manual sync
- Check GitHub status

### "Conflict Detected"

- Choose which version to keep
- Review changes before deciding
- Consider manual merge

### Data Not Appearing

- Wait for sync to complete
- Try manual "Pull" operation
- Verify same Gist ID on both devices
- Check for sync errors in console

## Backup & Restore

### Manual Backup

1. Click "Export Data" in Settings
2. Save the JSON file
3. Store securely

### Restore from Backup

1. Click "Import Data" in Settings
2. Select backup JSON file
3. Confirm import

### Gist Revisions

GitHub Gists maintain revision history:
1. Go to your Gist on GitHub
2. Click "Revisions"
3. View/restore previous versions

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+,` | Open Settings |

## Tips

1. **Sync before sleep** - Manual sync at end of day
2. **Check status** - Verify sync completed
3. **Test recovery** - Try restore occasionally
4. **Keep token safe** - Treat like password
