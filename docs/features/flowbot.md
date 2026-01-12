# FlowBot AI Coach

FlowBot is BytePad's AI-powered productivity assistant. It can help you manage tasks, search your content, and provide personalized productivity advice.

## Features

- Natural language interaction
- Context-aware responses
- Tool calling for actions
- Productivity insights
- Content search and creation

## Setup

### Requirements

FlowBot requires an AI API key from one of these providers:

| Provider | Models | Best For |
|----------|--------|----------|
| OpenAI | GPT-4, GPT-3.5 | General use |
| Anthropic | Claude 3 | Detailed analysis |
| OpenRouter | Various | Multiple models |

### Configuration

1. Open Settings (`Ctrl+,`)
2. Go to AI section
3. Select your provider
4. Enter your API key
5. Choose model

## Usage

### Opening FlowBot

- Press `Ctrl+/` to open FlowBot panel
- Or click FlowBot in sidebar
- Or use Command Palette

### Asking Questions

Type naturally:

```
What tasks should I focus on today?
```

```
Summarize my notes about the project
```

```
Help me plan my week
```

## Capabilities

### 1. Task Management

FlowBot can:
- List your tasks by priority
- Create new tasks
- Suggest task breakdowns
- Analyze task patterns

**Example prompts:**
- "Show my high-priority tasks"
- "Create a task to review documentation"
- "What tasks are overdue?"

### 2. Note Assistance

FlowBot can:
- Search through your notes
- Create new notes
- Summarize note content
- Find connections

**Example prompts:**
- "Find notes about machine learning"
- "Create a note from our discussion"
- "Summarize my project notes"

### 3. Productivity Insights

FlowBot can:
- Analyze your habits
- Review focus sessions
- Suggest improvements
- Identify patterns

**Example prompts:**
- "How productive was I this week?"
- "What habits am I struggling with?"
- "When am I most productive?"

### 4. Daily Planning

FlowBot can help plan your day:
- Review scheduled tasks
- Suggest priorities
- Time blocking advice
- Energy management

**Example prompts:**
- "Help me plan today"
- "What's on my schedule?"
- "I have 2 hours, what should I work on?"

## Tool Calling

FlowBot can take actions using tools:

| Tool | Action |
|------|--------|
| `search_notes` | Find notes by content |
| `create_note` | Create a new note |
| `list_tasks` | Get task list |
| `create_task` | Add new task |
| `get_habits` | View habit status |
| `get_focus_stats` | Focus session data |

When FlowBot uses a tool, you'll see a tool indicator in the response.

## Context Awareness

FlowBot has access to:
- Your tasks and their status
- Note titles and content
- Habit tracking data
- Focus session history
- Achievement progress

This context enables personalized responses.

## Best Practices

### Effective Prompts

**Good:**
- "What are my P1 tasks for today?"
- "Create a task: Review PR with deadline tomorrow"
- "Summarize my notes on API design"

**Less effective:**
- "Tasks" (too vague)
- "Help" (no context)
- "What should I do?" (need more specifics)

### Tips

1. **Be specific** - Include details in your questions
2. **Use natural language** - No special syntax needed
3. **Ask follow-ups** - FlowBot maintains context
4. **Review actions** - Verify created content

## Conversation History

FlowBot maintains conversation context within a session:
- Ask follow-up questions
- Reference previous responses
- Build on suggestions

Clear history by closing and reopening FlowBot.

## Privacy

- FlowBot only accesses your local BytePad data
- Conversations are sent to your chosen AI provider
- No data is stored by BytePad externally
- API keys are stored locally only

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+/` | Open/close FlowBot |
| `Enter` | Send message |
| `Shift+Enter` | New line in message |
| `Escape` | Close FlowBot |

## Troubleshooting

### "No API Key"
Configure your AI provider in Settings → AI

### Slow Responses
- Check your internet connection
- Try a faster model (GPT-3.5 vs GPT-4)
- Reduce conversation length

### Inaccurate Responses
- Provide more context
- Be more specific
- Try rephrasing the question
