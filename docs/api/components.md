# Components API

## Common Components

### DateTimePicker
```tsx
<DateTimePicker
  type="date" | "time"
  value={string}
  onChange={(value: string) => void}
  placeholder={string}
/>
```

### ConfirmModal
```tsx
<ConfirmModal
  isOpen={boolean}
  title={string}
  message={string}
  onConfirm={() => void}
  onCancel={() => void}
/>
```

### EntityLinkInput
```tsx
<EntityLinkInput
  value={string}
  onChange={(value: string) => void}
  placeholder={string}
/>
```

Textarea with `[[entity]]` autocomplete support.

### LinkedResourcesEditor
```tsx
<LinkedResourcesEditor
  linkedBookmarkIds={string[]}
  onChange={(ids: string[]) => void}
  searchQuery={string}
  onSearchChange={(query: string) => void}
/>
```

## Module Components

Each module has its own component folder:
- `src/components/notes/`
- `src/components/tasks/`
- `src/components/habits/`
- `src/components/graph/`
- `src/components/focus/`
