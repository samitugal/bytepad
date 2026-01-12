# Contributing to bytepad

Thank you for your interest in contributing to bytepad! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/bytepad.git`
3. Add upstream remote: `git remote add upstream https://github.com/samitugal/bytepad.git`

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Installation

```bash
# Install dependencies
npm install

# Start development server (web)
npm run dev

# Start development server (Electron)
npm run dev:electron
```

### Building

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
│   ├── i18n/             # Internationalization (en, tr)
│   ├── services/         # Business logic & API
│   ├── stores/           # Zustand state stores
│   ├── types/            # TypeScript definitions
│   └── utils/            # Utility functions
├── electron/             # Electron main process
├── public/               # Static assets
└── docs/                 # Documentation
```

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

### Data Storage

All data is stored locally in JSON format:

- **Web (PWA)**: Browser's IndexedDB/LocalStorage
- **Desktop**:
  - Windows: `%APPDATA%/bytepad/`
  - macOS: `~/Library/Application Support/bytepad/`
  - Linux: `~/.config/bytepad/`

### Sync Architecture

Optional GitHub Gist synchronization:

1. Local changes are saved immediately
2. Background sync uploads to Gist at configured interval
3. On startup, pulls latest from Gist
4. Conflict resolution favors most recent timestamp

## Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our [code style guidelines](#code-style)

3. Test your changes:
   ```bash
   npm run build
   npm run dev
   ```

4. Commit your changes using [conventional commits](#commit-messages)

## Pull Request Process

1. Update documentation if needed
2. Ensure the build passes: `npm run build`
3. Push your branch and create a Pull Request
4. Fill out the PR template completely
5. Wait for review and address any feedback

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-reviewed the code
- [ ] Added/updated documentation as needed
- [ ] No new warnings or errors
- [ ] Tested the changes locally

## Code Style

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types - use proper typing
- Use interfaces for object shapes
- Export types from `src/types/index.ts`

### React Components

- Functional components with hooks
- Keep components under 300 lines
- Use meaningful component names
- Props interfaces should be defined

### Styling

- Use Tailwind CSS classes
- Follow the existing color scheme (np-* classes)
- Mobile-first responsive design

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```
feat(tasks): add drag and drop reordering
fix(notes): resolve wikilink parsing issue
docs: update README with new features
refactor(graph): extract node rendering logic
```

## Questions?

Feel free to open an issue for any questions or concerns.

Thank you for contributing!
