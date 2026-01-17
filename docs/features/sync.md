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

## Data Recovery

This section covers how to recover your data after accidental sync operations.

### Accidental Pull (Overwrote Local Data)

If you accidentally pulled remote data and lost your local changes:

**Option 1: Use Browser History (Immediate)**
1. If you haven't closed the browser tab, press `Ctrl+Z` repeatedly
2. This may restore recent in-memory changes

**Option 2: Restore from Local Export**
1. If you had previously exported your data: Settings → Import Data
2. Select your backup JSON file
3. Confirm import to restore

**Option 3: Check Browser IndexedDB**
1. Open DevTools (`F12`) → Application → IndexedDB
2. Look for BytePad data stores
3. Data may still be cached locally

### Accidental Push (Overwrote Remote Data)

If you accidentally pushed local data and lost remote changes:

**Step-by-Step Recovery via Gist Revisions:**

1. **Find Your Gist**
   - Go to https://gist.github.com
   - Log in with your GitHub account
   - Find your BytePad Gist (named `bytepad-data.json`)

2. **View Revision History**
   - Click on the Gist to open it
   - Click the "Revisions" tab (top right)
   - You'll see a list of all previous versions with timestamps

3. **Compare Revisions**
   - Click on any revision to see the diff
   - Find the revision with the data you want to recover

4. **Recover Data**
   - Click "View file" on the desired revision
   - Click "Raw" to get the raw JSON
   - Copy all the content
   - Create a new file and save as `backup.json`
   - In BytePad: Settings → Import Data → Select `backup.json`

5. **After Recovery**
   - Verify your data is restored correctly
   - Do a manual Push to update the Gist with correct data

### Recovery Best Practices

1. **Regular Exports** - Export data weekly to local JSON
2. **Before Major Changes** - Always export before sync operations
3. **Check Before Pull** - Review Gist content on GitHub before pulling
4. **One Device Rule** - Avoid syncing from multiple devices simultaneously

### Emergency Recovery Contacts

If you cannot recover using the above methods:
1. Check GitHub Gist revision history (kept indefinitely)
2. Review browser local storage and IndexedDB
3. Check for any `.json` backup files on your system

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+,` | Open Settings |

## Local File Storage (TXT Format)

BytePad stores data in the browser's local storage by default. For additional backup security, you can export your data in human-readable formats.

### Why Keep Local Files?

1. **Offline Access** - Access your notes without internet
2. **Portability** - Move data between systems easily
3. **Version Control** - Track changes with git or other tools
4. **Independence** - Not reliant on cloud services
5. **Plain Text** - Editable in any text editor

### Export to TXT/Markdown

**Manual Export Process:**

1. Go to Settings (`Ctrl+,`) → Export section
2. Click "Export Data" to get JSON format
3. For individual notes as TXT:
   - Open the note you want to export
   - Select all content (`Ctrl+A`)
   - Copy (`Ctrl+C`) and paste into any text editor
   - Save as `.txt` or `.md` file

**Recommended File Naming:**
```
notes/
├── 2024-01-15-project-ideas.md
├── 2024-01-16-meeting-notes.md
└── 2024-01-17-todo-list.md
```

### TXT File Best Practices

1. **Use Markdown** - Keep formatting portable
2. **Consistent Naming** - Date prefix for easy sorting
3. **Regular Exports** - Weekly backup to local folder
4. **Separate Folders** - Organize by type (notes, tasks, journal)

### Recommended Backup Folder Structure

```
bytepad-backup/
├── exports/
│   ├── bytepad-data-2024-01-15.json    # Full export
│   └── bytepad-data-2024-01-22.json
├── notes/
│   ├── project-alpha.md
│   └── research-notes.md
├── tasks/
│   └── monthly-goals.txt
└── journal/
    ├── 2024-01.md
    └── 2024-02.md
```

### Import from TXT

To import text content back into BytePad:
1. Create a new note in BytePad
2. Open your TXT file in a text editor
3. Copy the content and paste into BytePad
4. Save the note

**Note:** For bulk import, use the JSON import feature with properly formatted data.

## Tips

1. **Sync before sleep** - Manual sync at end of day
2. **Check status** - Verify sync completed
3. **Test recovery** - Try restore occasionally
4. **Keep token safe** - Treat like password
5. **Local backups** - Export to TXT/JSON weekly
