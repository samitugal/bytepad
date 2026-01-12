# Testing Guide

## Setup

BytePad uses Vitest for unit tests and Playwright for E2E tests.

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e
```

## Unit Tests

Located in `src/__tests__/`

```typescript
import { describe, it, expect } from 'vitest'

describe('MyComponent', () => {
  it('should render correctly', () => {
    // test code
  })
})
```

## E2E Tests

Located in `e2e/`

```typescript
import { test, expect } from '@playwright/test'

test('homepage loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/BytePad/)
})
```

## What to Test

- Store actions and selectors
- Utility functions
- Critical user flows
