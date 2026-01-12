# Contributing to BytePad

Thank you for your interest in contributing to BytePad! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
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
# Build for production
npm run build

# Build Electron app (Windows)
npm run package:win

# Build Electron app (macOS)
npm run package:mac

# Build Electron app (Linux)
npm run package:linux
```

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

### File Organization

```
src/
├── components/     # React components
│   ├── common/     # Shared components
│   └── [module]/   # Module-specific components
├── stores/         # Zustand stores
├── services/       # Business logic & API
├── hooks/          # Custom React hooks
├── types/          # TypeScript types
├── i18n/           # Translations
└── utils/          # Utility functions
```

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

Thank you for contributing! 🎉
