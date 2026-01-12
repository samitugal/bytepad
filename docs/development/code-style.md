# Code Style Guide

## TypeScript

- Use strict mode
- Avoid `any` - use proper types
- Define interfaces in `src/types/`

## React

- Functional components only
- Use hooks for state/effects
- Keep components under 300 lines

## Naming

- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `PascalCase.tsx` for components

## Styling

- Use Tailwind CSS classes
- Use `np-*` color classes for theme
- Mobile-first responsive design

## Imports

```typescript
// 1. React
import { useState, useEffect } from 'react'

// 2. External libraries
import { useTranslation } from '../../i18n'

// 3. Internal imports
import { useTaskStore } from '../../stores/taskStore'
import type { Task } from '../../types'
```
