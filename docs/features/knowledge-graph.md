# Knowledge Graph

The Knowledge Graph provides a visual representation of connections between your notes, tasks, habits, and bookmarks.

## Features

- Interactive graph visualization
- Drag and drop nodes
- Filter by entity type
- Click to navigate
- Zoom and pan

## Opening the Graph

Press `Ctrl+8` or click the Graph icon in the sidebar.

## Understanding the Graph

### Node Types

| Node | Color | Represents |
|------|-------|------------|
| Notes | Green | Your notes |
| Tasks | Orange | Your tasks |
| Habits | Purple | Your habits |
| Tags | Blue | Shared tags |
| Bookmarks | Cyan | Your bookmarks |

### Connections

Edges (lines) represent relationships:

- **Wikilinks**: `[[Note]]` in content
- **Shared tags**: Same tag on multiple items
- **Linked resources**: Bookmarks attached to tasks
- **Backlinks**: Notes linking to each other

## Interacting with the Graph

### Navigation

| Action | How |
|--------|-----|
| Pan | Click and drag background |
| Zoom | Scroll wheel |
| Select node | Click on node |
| Move node | Drag node |

### Node Actions

Click a node to:
- View node details
- Navigate to the item
- See connection count

### Drag and Drop

Nodes can be repositioned:
1. Click and hold a node
2. Drag to new position
3. Release to place
4. Graph physics will adjust connections

## Filtering

### Filter by Type

Toggle visibility of node types:
- Show/hide Notes
- Show/hide Tasks
- Show/hide Habits
- Show/hide Tags
- Show/hide Bookmarks

### Filter Persistence

Filter settings are saved to localStorage:
- Filters persist across sessions
- Reset by clicking "Reset Filters"

## Graph Insights

The graph reveals:

1. **Clusters** - Related concepts grouped together
2. **Hubs** - Highly connected nodes (important concepts)
3. **Orphans** - Unconnected nodes (potential to link)
4. **Bridges** - Nodes connecting different clusters

## Best Practices

### Building a Connected Graph

1. **Use wikilinks** - `[[Link to related notes]]`
2. **Consistent tagging** - Same tags across related items
3. **Link tasks to notes** - Reference documentation
4. **Review orphans** - Find connection opportunities

### Exploring Your Knowledge

1. **Find clusters** - Topics that group together
2. **Follow connections** - Discover related ideas
3. **Identify hubs** - Your core concepts
4. **Spot gaps** - Areas lacking connections

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+8` | Open Knowledge Graph |
| `Scroll` | Zoom in/out |
| `Click+Drag` | Pan view |

## Performance

For large graphs:
- Filter to specific types
- Use zoom to focus on areas
- Graph physics auto-optimize layout

## Integration

The graph connects with:

- **Notes** - Click to open note
- **Tasks** - Click to open task
- **Habits** - Click to view habit
- **Bookmarks** - Click to open bookmark
- **Tags** - Click to filter by tag

## Example Use Cases

### Project Overview
1. Filter to show Tasks and Notes
2. Find the project cluster
3. See all related documentation

### Topic Exploration
1. Click on a concept node
2. Follow connections to related ideas
3. Discover unexpected relationships

### Content Audit
1. View all nodes
2. Identify orphaned content
3. Add connections to improve graph
