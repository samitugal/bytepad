# Architecture

## Overview

BytePad is a keyboard-first productivity app built with React, TypeScript, and Zustand.

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand (persisted to localStorage)
- **Desktop:** Electron
- **Sync:** GitHub Gist
- **AI:** OpenAI, Anthropic, Google AI

## Project Structure

```
src/
├── components/     # React components by module
├── stores/         # Zustand state stores
├── services/       # Business logic & APIs
├── hooks/          # Custom React hooks
├── types/          # TypeScript interfaces
├── i18n/           # Translations (en, tr)
└── utils/          # Utility functions
```

## Data Flow

1. User interacts with UI
2. Component calls store action
3. Store updates state
4. State persists to localStorage
5. Optional: Sync to Gist

## Key Stores

- `noteStore` - Notes with markdown, tags, wikilinks
- `taskStore` - Tasks with subtasks, priorities
- `habitStore` - Habits with streaks
- `journalStore` - Daily journal entries
- `bookmarkStore` - Bookmarks with tags
- `uiStore` - UI state (active module, theme)
