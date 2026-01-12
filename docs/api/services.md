# Services API

## aiService

AI integration for FlowBot and productivity reports.

```typescript
// Generate AI response
generateResponse(messages: Message[], context: Context): Promise<string>

// Generate productivity report
generateProductivityReport(data: ProductivityData): Promise<Report>
```

## gistSyncService

GitHub Gist synchronization.

```typescript
// Pull data from Gist
pullFromGist(): Promise<void>

// Push data to Gist
pushToGist(): Promise<void>

// Check sync status
getSyncStatus(): SyncStatus
```

## agentService

FlowBot agent with tool calling.

```typescript
// Execute agent with tools
executeAgent(input: string, tools: Tool[]): Promise<AgentResult>
```

## notificationService

Desktop notifications and reminders.

```typescript
// Schedule reminder
scheduleReminder(task: Task): void

// Show notification
showNotification(title: string, body: string): void
```
