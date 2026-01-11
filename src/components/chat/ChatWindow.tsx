import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useTaskStore } from '../../stores/taskStore'
import { useHabitStore } from '../../stores/habitStore'
import { useJournalStore } from '../../stores/journalStore'
import { sendMessage, getQuickActions } from '../../services/aiService'
import { useTranslation } from '../../i18n'
import type { ChatContext } from '../../types'

// Destructive tools that require confirmation (for future use)
// const DESTRUCTIVE_TOOLS = ['delete_task', 'delete_habit', 'delete_note', 'delete_bookmark']

function getContext(): ChatContext {
  const tasks = useTaskStore.getState().tasks
  const habits = useHabitStore.getState().habits
  const entries = useJournalStore.getState().entries

  const today = new Date().toISOString().split('T')[0]
  const pendingTasksList = tasks.filter(t => !t.completed)
  const completedTasksToday = tasks.filter(t =>
    t.completed && t.completedAt &&
    new Date(t.completedAt).toISOString().split('T')[0] === today
  ).length

  const dailyHabits = habits.filter(h => h.frequency === 'daily')
  const habitsCompletedToday = dailyHabits.filter(h => h.completions[today]).length

  const maxStreak = Math.max(...habits.map(h => h.streak), 0)

  const todayEntry = entries.find(e => e.date === today)

  // Build rich task list for AI context (max 10 tasks)
  const taskList = pendingTasksList
    .sort((a, b) => {
      const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    .slice(0, 10)
    .map(t => ({
      title: t.title,
      priority: t.priority,
      deadline: t.deadline ? new Date(t.deadline).toISOString().split('T')[0] : undefined,
    }))

  // Build habit list for AI context
  const habitList = dailyHabits.map(h => ({
    name: h.name,
    completed: !!h.completions[today],
  }))

  return {
    pendingTasks: pendingTasksList.length,
    completedTasksToday,
    habitsCompletedToday,
    totalHabitsToday: dailyHabits.length,
    currentStreak: maxStreak,
    lastMood: todayEntry?.mood,
    lastEnergy: todayEntry?.energy,
    taskList,
    habitList,
  }
}

export function ChatWindow() {
  const { t } = useTranslation()
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
      const response = await sendMessage(userMessage, messages, context)

      // Use the agent's natural language response only - never show raw tool results
      addMessage({ role: 'assistant', content: response.content })
    } catch (err) {
      console.error('[FlowBot Error]', err)
      const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu'

      if (errorMessage.includes('API key') || errorMessage.includes('apiKey')) {
        setError('API key geçersiz veya eksik. Settings → AI bölümünden kontrol et.')
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Bağlantı hatası. İnternet bağlantını kontrol et.')
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        setError('Çok fazla istek gönderildi. Biraz bekle ve tekrar dene.')
      } else {
        setError(errorMessage)
      }
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
          <span className="text-np-text-primary text-sm">{t('flowbot.title')}</span>
          <span className="text-np-text-secondary text-xs">// {t('flowbot.subtitle')}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="text-np-text-secondary hover:text-np-text-primary px-2 py-1 text-xs"
            title={t('flowbot.clearChat')}
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
            <div className="text-np-text-primary text-sm mb-1">{t('flowbot.greeting')}</div>
            <div className="text-np-text-secondary text-xs mb-4">
              {t('flowbot.greetingDesc')}
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
              <div className="whitespace-pre-wrap break-all" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{msg.content}</div>
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
            <div className="bg-np-bg-tertiary px-3 py-2 text-sm border-l-2 border-np-green max-w-[85%]">
              <span className="text-np-text-secondary animate-pulse">{t('flowbot.thinking')}</span>
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
            placeholder={t('flowbot.placeholder')}
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
          {t('flowbot.openClose')} • {t('flowbot.sendEnter')}
        </div>
      </div>
    </div>
  )
}
