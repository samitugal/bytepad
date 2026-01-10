import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useTaskStore } from '../../stores/taskStore'
import { useHabitStore } from '../../stores/habitStore'
import { useJournalStore } from '../../stores/journalStore'
import { sendMessageWithTools, getQuickActions } from '../../services/llmService'
import type { ToolResult } from '../../services/agentService'
import type { ChatContext } from '../../types'

// Destructive tools that require confirmation
const DESTRUCTIVE_TOOLS = ['delete_task', 'delete_habit', 'delete_note', 'delete_bookmark']

function getContext(): ChatContext {
  const tasks = useTaskStore.getState().tasks
  const habits = useHabitStore.getState().habits
  const entries = useJournalStore.getState().entries

  const today = new Date().toISOString().split('T')[0]
  const pendingTasks = tasks.filter(t => !t.completed).length
  const completedTasksToday = tasks.filter(t =>
    t.completed && t.completedAt &&
    new Date(t.completedAt).toISOString().split('T')[0] === today
  ).length

  const habitsCompletedToday = habits.filter(h => h.completions[today]).length
  const totalHabitsToday = habits.filter(h => h.frequency === 'daily').length

  const maxStreak = Math.max(...habits.map(h => h.streak), 0)

  const todayEntry = entries.find(e => e.date === today)

  return {
    pendingTasks,
    completedTasksToday,
    habitsCompletedToday,
    totalHabitsToday,
    currentStreak: maxStreak,
    lastMood: todayEntry?.mood,
    lastEnergy: todayEntry?.energy,
  }
}

export function ChatWindow() {
  const { messages, isOpen, isLoading, error, addMessage, setOpen, setLoading, setError, clearMessages } = useChatStore()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickActions = getQuickActions()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage = text.trim()
    setInput('')
    setError(null)

    addMessage({ role: 'user', content: userMessage })
    setLoading(true)

    try {
      const context = getContext()
      const response = await sendMessageWithTools(userMessage, messages, context)

      // Build response message with tool results
      let finalContent = response.content

      if (response.toolResults.length > 0) {
        const toolSummary = response.toolResults
          .map((r: ToolResult) => `${r.success ? '✓' : '✗'} ${r.message}`)
          .join('\n')

        finalContent = finalContent
          ? `${finalContent}\n\n---\n**Yapılan işlemler:**\n${toolSummary}`
          : `**Yapılan işlemler:**\n${toolSummary}`
      }

      addMessage({ role: 'assistant', content: finalContent })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-np-bg-secondary border border-np-border 
                    shadow-2xl flex flex-col z-50 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-np-border bg-np-bg-tertiary">
        <div className="flex items-center gap-2">
          <span className="text-np-green">🤖</span>
          <span className="text-np-text-primary text-sm">FlowBot</span>
          <span className="text-np-text-secondary text-xs">// ADHD Coach</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="text-np-text-secondary hover:text-np-text-primary px-2 py-1 text-xs"
            title="Clear chat"
          >
            🗑
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-np-text-secondary hover:text-np-text-primary px-2 py-1"
          >
            ×
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-np-green text-2xl mb-2">🤖</div>
            <div className="text-np-text-primary text-sm mb-1">Merhaba! Ben FlowBot.</div>
            <div className="text-np-text-secondary text-xs mb-4">
              ADHD-friendly productivity koçun.
            </div>
            <div className="space-y-2">
              {quickActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleSend(action.prompt)}
                  className="block w-full text-left px-3 py-2 text-xs bg-np-bg-tertiary 
                             border border-np-border hover:border-np-blue transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 text-sm ${msg.role === 'user'
                ? 'bg-np-bg-hover text-np-text-primary'
                : 'bg-np-bg-tertiary text-np-text-primary border-l-2 border-np-green'
                }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className="text-[10px] text-np-text-secondary mt-1">
                {new Date(msg.timestamp).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-np-bg-tertiary px-3 py-2 text-sm border-l-2 border-np-green">
              <span className="text-np-text-secondary animate-pulse">FlowBot düşünüyor...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-np-error/10 border border-np-error px-3 py-2 text-sm text-np-error">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (when there are messages) */}
      {messages.length > 0 && (
        <div className="px-3 py-2 border-t border-np-border flex gap-1 overflow-x-auto">
          {quickActions.slice(0, 3).map(action => (
            <button
              key={action.id}
              onClick={() => handleSend(action.prompt)}
              disabled={isLoading}
              className="text-[10px] px-2 py-1 bg-np-bg-tertiary border border-np-border 
                         hover:border-np-blue whitespace-nowrap disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-np-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajını yaz..."
            disabled={isLoading}
            className="flex-1 bg-np-bg-primary border border-np-border text-np-text-primary 
                       text-sm px-3 py-2 focus:outline-none focus:border-np-blue
                       disabled:opacity-50"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isLoading || !input.trim()}
            className="np-btn px-4 disabled:opacity-50"
          >
            →
          </button>
        </div>
        <div className="text-[10px] text-np-text-secondary mt-1">
          Ctrl+/ ile aç/kapat • Enter ile gönder
        </div>
      </div>
    </div>
  )
}
