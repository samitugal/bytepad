# Notes Module

The Notes module is a powerful Markdown editor with bidirectional linking support, designed for building a personal knowledge base.

## Features

- Full Markdown support
- Wikilink syntax `[[Note Title]]`
- Backlinks (see which notes link to current note)
- Tags for organization
- Image URL embedding
- Quick search and filtering

## Creating Notes

### New Note

1. Press `Ctrl+1` to open Notes
2. Click "+ New Note" or use Command Palette (`Ctrl+K` → "New Note")
3. Enter a title
4. Start writing

### Note Properties

| Property | Description |
|----------|-------------|
| Title | Note name (used for wikilinks) |
| Content | Markdown content |
| Tags | Categorization tags |
| Created | Creation timestamp |
| Updated | Last modification timestamp |

## Markdown Support

### Basic Formatting

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
~~Strikethrough~~

> Blockquote
```

### Lists

```markdown
- Unordered item
- Another item
  - Nested item

1. Ordered item
2. Second item
   1. Nested ordered
```

### Code

````markdown
Inline `code` here

```javascript
// Code block with syntax highlighting
function hello() {
  console.log("Hello, BytePad!");
}
```
````

### Links and Images

```markdown
[Link text](https://example.com)

![Image alt](https://example.com/image.png)
```

## Wikilinks

Connect notes using double-bracket syntax:

```markdown
This concept relates to [[Another Note]].
```

### Autocomplete

When you type `[[`, BytePad shows suggestions:

1. Type `[[`
2. Start typing note name
3. Select from suggestions
4. Press Tab or Enter to complete

### Backlinks

At the bottom of each note, you can see which other notes link to it:

```
Backlinks:
• Project Ideas (links here)
• Meeting Notes (links here)
```

**Note**: Maximum 3 backlinks are shown per note to keep the interface clean.

## Tags

Organize notes with tags:

1. Click "Add tag" below the editor
2. Type tag name (auto-formatted to lowercase)
3. Press Enter

### Tag Format

- Lowercase only
- Spaces converted to hyphens
- Example: "Project Ideas" → `project-ideas`

### Filtering by Tag

1. Click any tag in the note list
2. Or use the filter dropdown
3. Click tag again to clear filter

## Search

Search through all notes:

1. Use the search bar in Notes module
2. Or use Global Search (`Ctrl+G`)
3. Searches titles and content

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` | Open Notes module |
| `Ctrl+N` | New note (when in Notes) |
| `Ctrl+S` | Save current note |
| `Ctrl+F` | Search notes |
| `[[` | Trigger wikilink autocomplete |

## Best Practices

1. **Use descriptive titles** - Makes wikilinks more intuitive
2. **Link liberally** - Build connections between concepts
3. **Use tags consistently** - Create a tagging system
4. **Write atomic notes** - One idea per note
5. **Review backlinks** - Discover unexpected connections

## Integration

Notes integrate with other BytePad features:

- **Knowledge Graph** - Visualize note connections
- **FlowBot** - AI can search and create notes
- **Tasks** - Link notes in task descriptions
