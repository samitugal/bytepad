# bytepad

<!-- LOGO_PLACEHOLDER: Add your logo here (recommended: 200x200px) -->
<!-- ![bytepad Logo](assets/logo.png) -->

A modern, privacy-first productivity application for personal knowledge management, habit tracking, and task organization. Built with a keyboard-first philosophy and inspired by the clean aesthetics of code editors.

[![License](https://img.shields.io/badge/license-Personal%20Use-blue)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](#download)
[![Version](https://img.shields.io/badge/version-0.20.0-green)](https://github.com/samitugal/bytepad/releases)

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Features](#features)
- [Download](#download)
- [Development](#development)
- [Configuration](#configuration)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [AI Integration](#ai-integration)
- [Data Storage](#data-storage)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Overview

bytepad is designed for productivity enthusiasts who prefer a distraction-free, keyboard-driven workflow. All data is stored locally on your device, ensuring complete privacy and control over your personal information.

### Key Highlights

- **Privacy-First**: All data stored locally - no cloud dependency required
- **Keyboard-Driven**: Full keyboard navigation with customizable shortcuts
- **Unified Workspace**: Notes, tasks, habits, and journal in one place
- **Knowledge Graph**: Visualize connections between your thoughts
- **AI-Powered**: Built-in AI assistant for productivity insights
- **Cross-Platform**: Available for Windows, macOS, and Linux

---

## Screenshots

<!-- SCREENSHOT_PLACEHOLDER: Main Dashboard -->
<!-- ![Dashboard](assets/screenshots/dashboard.png) -->
*Main dashboard showing the unified workspace*

<!-- SCREENSHOT_PLACEHOLDER: Notes Module with Wikilinks -->
<!-- ![Notes](assets/screenshots/notes.png) -->
*Notes module with markdown support and wikilink navigation*

<!-- SCREENSHOT_PLACEHOLDER: Knowledge Graph -->
<!-- ![Knowledge Graph](assets/screenshots/graph.png) -->
*Interactive knowledge graph visualizing connections*

<!-- SCREENSHOT_PLACEHOLDER: Task Management -->
<!-- ![Tasks](assets/screenshots/tasks.png) -->
*Task management with priority levels and subtasks*

<!-- SCREENSHOT_PLACEHOLDER: Focus Mode -->
<!-- ![Focus Mode](assets/screenshots/focus.png) -->
*Focus mode with Pomodoro timer*

<!-- SCREENSHOT_PLACEHOLDER: AI Chat (FlowBot) -->
<!-- ![FlowBot](assets/screenshots/flowbot.png) -->
*FlowBot AI assistant providing productivity insights*

---

## Features

### Notes

A powerful markdown-based note-taking system with advanced linking capabilities.

- Full markdown support with live preview
- **Wikilinks**: Link notes using `[[Note Title]]` syntax
- **Backlinks**: Automatically track which notes reference the current note
- Tag organization with `#tag` syntax
- Code syntax highlighting
- Quick search across all notes

### Tasks

Comprehensive task management designed for getting things done.

- Priority levels (Critical, High, Medium, Low)
- Subtask support with progress tracking
- Due dates with calendar integration
- Tag-based organization
- Recurring task templates
- Link tasks to notes, bookmarks, and other entities

### Habits

Build and maintain positive habits with streak tracking.

- Daily habit check-ins
- Streak tracking with visual indicators
- Weekly and monthly statistics
- Habit completion history
- Customizable habit schedules

### Journal

Daily journaling with mood and energy tracking.

- One entry per day format
- Mood tracking (1-5 scale)
- Energy level tracking
- Markdown support for entries
- Historical view and search

### Bookmarks

Organize and manage web links efficiently.

- Quick bookmark saving
- Tag-based organization
- Link bookmarks to notes and tasks
- Search across all bookmarks

### Calendar

Visual calendar view for planning and review.

- Monthly, weekly, and daily views
- Task due dates visualization
- Journal entry indicators
- Habit completion overlay

### Knowledge Graph

Visualize the connections between all your content.

- Interactive node-based visualization
- Filter by content type (notes, tasks, habits, tags)
- Drag and drop node positioning
- Zoom and pan navigation
- Click to navigate to linked content
- Connection strength indicators

### Analysis

Gain insights into your productivity patterns.

- Weekly productivity statistics
- Task completion rates
- Habit streak analysis
- Time-based activity patterns
- AI-generated insights

### Productivity Reports

Detailed AI-powered productivity analysis.

- Daily and weekly report generation
- Strengths and areas for improvement
- ADHD-friendly insights and recommendations
- Historical report archive
- Personalized advice based on your patterns

### Gamification

Stay motivated with XP, levels, and achievements.

- Earn XP for completing tasks and habits
- Level progression system
- Achievement badges for milestones
- Streak multipliers for bonus XP
- Daily challenges

### Focus Mode

Dedicated distraction-free mode with Pomodoro timer.

- Customizable work/break intervals
- Task selection for focused work
- Session statistics
- Mini timer widget
- Break reminders
- Background audio options

### FlowBot AI

Built-in AI assistant for productivity coaching.

- Context-aware responses
- Task and habit recommendations
- Productivity tips and insights
- Natural language interaction
- Multiple AI provider support

### Localization

Full internationalization support.

- English (default)
- Turkish
- Easy to add new languages

---

## Download

Download the latest release from the [Releases](https://github.com/samitugal/bytepad/releases) page.

| Platform | File | Architecture |
|----------|------|--------------|
| Windows | `bytepad-x.x.x-win-x64.exe` | 64-bit |
| macOS | `bytepad-x.x.x-mac-x64.dmg` | Intel |
| macOS | `bytepad-x.x.x-mac-arm64.dmg` | Apple Silicon |
| Linux | `bytepad-x.x.x-linux-x86_64.AppImage` | 64-bit |

### Windows Installation

The Windows installer is code-signed. If you encounter a SmartScreen warning:

1. Click **"More info"**
2. Click **"Run anyway"**

This is normal for applications building reputation with Microsoft SmartScreen.

### macOS Installation

1. Open the `.dmg` file
2. Drag bytepad to your Applications folder
3. On first launch, right-click and select "Open" if prompted about unidentified developer

### Linux Installation

For AppImage:
```bash
chmod +x bytepad-x.x.x-linux-x86_64.AppImage
./bytepad-x.x.x-linux-x86_64.AppImage
```

---

## Development

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/samitugal/bytepad.git
cd bytepad

# Install dependencies
npm install

# Run in development mode (web)
npm run dev

# Run Electron app in development
npm run dev:electron
```

### Build Commands

```bash
# Build for production (web)
npm run build

# Build Electron app
npm run build:electron

# Package for distribution
npm run package

# Platform-specific packaging
npm run package:win     # Windows
npm run package:mac     # macOS
npm run package:linux   # Linux
npm run package:all     # Windows + macOS
```

### Project Structure

```
bytepad/
├── src/
│   ├── components/       # React components
│   │   ├── analysis/     # Productivity analysis
│   │   ├── bookmarks/    # Bookmark management
│   │   ├── calendar/     # Calendar views
│   │   ├── chat/         # FlowBot AI chat
│   │   ├── common/       # Shared components
│   │   ├── dailynotes/   # Daily notes
│   │   ├── focus/        # Focus mode & timer
│   │   ├── gamification/ # XP, levels, achievements
│   │   ├── graph/        # Knowledge graph
│   │   ├── habits/       # Habit tracking
│   │   ├── journal/      # Journal entries
│   │   ├── layout/       # App layout
│   │   ├── notes/        # Note management
│   │   └── tasks/        # Task management
│   ├── hooks/            # Custom React hooks
│   ├── i18n/             # Internationalization
│   ├── services/         # Business logic
│   ├── stores/           # Zustand state stores
│   ├── types/            # TypeScript definitions
│   └── utils/            # Utility functions
├── electron/             # Electron main process
├── public/               # Static assets
└── docs/                 # Documentation
```

---

## Configuration

### Settings

Access settings via the gear icon in the sidebar or `Ctrl+,`.

**General**
- Language selection (English/Turkish)
- Theme customization
- Date and time format

**Focus Mode**
- Work duration (default: 25 minutes)
- Short break duration (default: 5 minutes)
- Long break duration (default: 15 minutes)
- Sessions before long break

**AI Configuration**
- AI provider selection
- API key configuration
- Model selection

**Sync**
- GitHub Gist sync configuration
- Auto-sync interval
- Manual sync controls

### Data Location

All data is stored locally in JSON format:

- **Web (PWA)**: Browser's IndexedDB/LocalStorage
- **Desktop**:
  - Windows: `%APPDATA%/bytepad/`
  - macOS: `~/Library/Application Support/bytepad/`
  - Linux: `~/.config/bytepad/`

---

## Keyboard Shortcuts

bytepad is designed for keyboard-first navigation. Press `Ctrl+?` anytime to see all available shortcuts.

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open Command Palette |
| `Alt+U` | Global Search (search across all content) |
| `Ctrl+/` | Toggle FlowBot AI Chat |
| `Ctrl+?` | Show Keyboard Shortcuts Help |
| `Ctrl+Shift+O` | Toggle Focus Mode |
| `Ctrl+N` | Create new note |
| `Ctrl+1` to `Ctrl+9` | Navigate between modules |
| `Ctrl+Enter` | Save and close current item |
| `[[` | Trigger wikilink autocomplete |
| `Escape` | Close modal/panel |

---

## Tech Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Zustand** - State management

### Desktop

- **Electron** - Cross-platform desktop apps
- **electron-vite** - Build tooling
- **electron-builder** - Packaging and distribution
- **electron-store** - Persistent storage

### AI Integration

- **LangChain.js** - AI orchestration and tool calling
- **Multiple providers** - OpenAI, Anthropic, Google AI, Groq, Ollama

### Build Tools

- **Vite** - Fast development and building
- **PostCSS** - CSS processing
- **ESLint** - Code linting

---

## Architecture

### State Management

bytepad uses Zustand for state management with separate stores for each domain:

- `useAppStore` - Application-wide state
- `useNotesStore` - Notes management
- `useTasksStore` - Task management
- `useHabitsStore` - Habit tracking
- `useJournalStore` - Journal entries
- `useBookmarksStore` - Bookmark management
- `useFocusStore` - Focus mode state
- `useGamificationStore` - XP and achievements

### Data Flow

```
User Action → React Component → Zustand Store → LocalStorage
                    ↓
              AI Service (optional)
                    ↓
              Updated State → UI Re-render
```

### Sync Architecture

Optional GitHub Gist synchronization:

1. Local changes are saved immediately
2. Background sync uploads to Gist at configured interval
3. On startup, pulls latest from Gist
4. Conflict resolution favors most recent timestamp

---

## AI Integration

bytepad supports multiple AI providers for the FlowBot assistant and productivity reports.

### Supported Providers

| Provider | Models | Features |
|----------|--------|----------|
| OpenAI | GPT-4, GPT-3.5 | Full support |
| Anthropic | Claude 3 | Full support |
| Google AI | Gemini Pro | Full support |
| Groq | Llama, Mixtral | Full support |
| Ollama | Local models | Self-hosted |

### Configuration

1. Open Settings (`Ctrl+,`)
2. Navigate to AI section
3. Select your preferred provider
4. Enter your API key
5. Select the model

### FlowBot Capabilities

- Natural language task creation
- Productivity coaching
- Habit recommendations
- Daily planning assistance
- Contextual insights based on your data

---

## Data Storage

### Privacy

- All data is stored locally on your device
- No data is sent to external servers (except optional Gist sync)
- AI features only send necessary context to your chosen AI provider
- API keys are stored locally and never transmitted

### Backup

**Manual Export**
- Export all data as JSON from Settings

**GitHub Gist Sync**
- Automatic backup to private GitHub Gist
- Encrypted data transfer
- Version history maintained by GitHub

### Data Format

All data is stored in JSON format for easy portability and backup.

---

## Contributing

Contributions are welcome. Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run linting (`npm run lint`)
5. Commit your changes (`git commit -m 'feat: add your feature'`)
6. Push to the branch (`git push origin feature/your-feature`)
7. Open a Pull Request

### Commit Convention

We use conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Code Standards

- TypeScript strict mode
- Components should be under 150 lines
- All UI strings must use i18n
- Keyboard accessibility required

---

## License

**Personal Use License**

This software is licensed for personal, non-commercial use only.

You are free to:
- Use the software for personal productivity
- Modify the source code for personal use
- Share the software with others (non-commercially)

You may NOT:
- Use the software for commercial purposes
- Sell the software or derivative works
- Use the software in a commercial product or service

For commercial licensing inquiries, please contact the author.

See [LICENSE](LICENSE) for full details.

---

## Author

**Sami Tugal**

- GitHub: [@samitugal](https://github.com/samitugal)
- Email: tugalsami@gmail.com

---

## Acknowledgments

- Built with [React](https://react.dev/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Desktop powered by [Electron](https://www.electronjs.org/)
- AI integration via [LangChain.js](https://js.langchain.com/)

---

*bytepad - Your personal productivity companion*
