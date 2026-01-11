import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama'
export type ApiKeyType = LLMProvider | 'tavily'

export interface LLMModel {
  id: string
  name: string
  provider: LLMProvider
}

export const LLM_MODELS: Record<LLMProvider, LLMModel[]> = {
  openai: [
    { id: 'gpt-5', name: 'GPT-5', provider: 'openai' },
    { id: 'gpt-5.2', name: 'GPT-5.2', provider: 'openai' },
    { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'openai' },
    { id: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'openai' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
  ],
  google: [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'google' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'groq' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq' },
  ],
  ollama: [
    { id: 'llama3.2', name: 'Llama 3.2', provider: 'ollama' },
    { id: 'mistral', name: 'Mistral', provider: 'ollama' },
    { id: 'codellama', name: 'Code Llama', provider: 'ollama' },
  ],
}

export const PROVIDER_INFO: Record<LLMProvider, { name: string; baseUrl: string; requiresKey: boolean }> = {
  openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', requiresKey: true },
  anthropic: { name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', requiresKey: true },
  google: { name: 'Google AI', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', requiresKey: true },
  groq: { name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', requiresKey: true },
  ollama: { name: 'Ollama (Local)', baseUrl: 'http://localhost:11434', requiresKey: false },
}

// Font Size Options
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'

export const FONT_SIZES: Record<FontSize, { label: string; value: string }> = {
  xs: { label: 'Extra Small (11px)', value: '11px' },
  sm: { label: 'Small (12px)', value: '12px' },
  base: { label: 'Default (14px)', value: '14px' },
  lg: { label: 'Large (16px)', value: '16px' },
  xl: { label: 'Extra Large (18px)', value: '18px' },
  '2xl': { label: 'Huge (20px)', value: '20px' },
  '3xl': { label: 'Giant (22px)', value: '22px' },
  '4xl': { label: 'Maximum (24px)', value: '24px' },
}

// Font Family Options
export type FontFamily = 
  | 'system' 
  | 'fira-code' 
  | 'jetbrains-mono' 
  | 'cascadia-code'
  | 'source-code-pro'
  | 'consolas'
  | 'proto-nerd'
  | 'hack-nerd'
  | 'meslo-nerd'
  | 'fira-code-nerd'
  | 'jetbrains-mono-nerd'

export const FONT_FAMILIES: Record<FontFamily, { label: string; value: string; isNerd: boolean }> = {
  'system': { 
    label: 'System Default', 
    value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    isNerd: false 
  },
  'consolas': { 
    label: 'Consolas', 
    value: 'Consolas, monospace',
    isNerd: false 
  },
  'fira-code': { 
    label: 'Fira Code', 
    value: '"Fira Code", monospace',
    isNerd: false 
  },
  'jetbrains-mono': { 
    label: 'JetBrains Mono', 
    value: '"JetBrains Mono", monospace',
    isNerd: false 
  },
  'cascadia-code': { 
    label: 'Cascadia Code', 
    value: '"Cascadia Code", monospace',
    isNerd: false 
  },
  'source-code-pro': { 
    label: 'Source Code Pro', 
    value: '"Source Code Pro", monospace',
    isNerd: false 
  },
  'proto-nerd': { 
    label: '🔤 Proto Nerd Font', 
    value: '"ProFont IIx Nerd Font", "ProFontWindows Nerd Font", monospace',
    isNerd: true 
  },
  'hack-nerd': { 
    label: '🔤 Hack Nerd Font', 
    value: '"Hack Nerd Font", monospace',
    isNerd: true 
  },
  'meslo-nerd': { 
    label: '🔤 Meslo Nerd Font', 
    value: '"MesloLGS Nerd Font", "MesloLGS NF", monospace',
    isNerd: true 
  },
  'fira-code-nerd': { 
    label: '🔤 Fira Code Nerd Font', 
    value: '"FiraCode Nerd Font", monospace',
    isNerd: true 
  },
  'jetbrains-mono-nerd': { 
    label: '🔤 JetBrains Mono Nerd Font', 
    value: '"JetBrainsMono Nerd Font", monospace',
    isNerd: true 
  },
}

// GitHub Gist Sync Preferences
export interface GistSyncPreferences {
  enabled: boolean
  githubToken: string
  gistId: string
  autoSync: boolean
  syncInterval: number // minutes, 0 = only manual
  lastSyncAt: string | null
  lastSyncStatus: 'success' | 'error' | 'pending' | null
  lastSyncError: string | null
}

// Focus Mode Preferences
export interface FocusPreferences {
  defaultDuration: number // minutes (default: 25)
  shortBreakDuration: number // minutes (default: 5)
  longBreakDuration: number // minutes (default: 20)
  sessionsUntilLongBreak: number // (default: 4)
  autoStartBreak: boolean
  playTickSound: boolean
  playCompletionSound: boolean
  showTimeInTitle: boolean // browser tab title
  dailyGoalSessions: number // (default: 5)
}

// Email Notification Preferences
export interface EmailPreferences {
  enabled: boolean
  userEmail: string
  emailjsServiceId: string
  emailjsPublicKey: string
  emailjsTemplateDaily: string
  emailjsTemplateWeekly: string
  emailjsTemplateStreak: string
  dailySummaryEnabled: boolean
  dailySummaryTime: string // HH:mm format
  weeklySummaryEnabled: boolean
  weeklySummaryDay: number // 0=Sunday, 1=Monday, etc.
  streakAlertsEnabled: boolean
  lastDailySent: string | null
  lastWeeklySent: string | null
}

interface SettingsState {
  // LLM Settings
  llmProvider: LLMProvider
  llmModel: string
  apiKeys: Record<ApiKeyType, string>
  ollamaBaseUrl: string

  // Display Settings
  fontSize: FontSize
  fontFamily: FontFamily

  // Editor Settings
  noteMarkdownPreview: boolean

  // Email Notifications
  emailPreferences: EmailPreferences

  // GitHub Gist Sync
  gistSync: GistSyncPreferences

  // Focus Mode Settings
  focusPreferences: FocusPreferences

  // Gamification
  gamificationEnabled: boolean

  // Onboarding
  onboardingCompleted: boolean

  // Actions
  setLLMProvider: (provider: LLMProvider) => void
  setLLMModel: (model: string) => void
  setApiKey: (provider: ApiKeyType, key: string) => void
  setOllamaBaseUrl: (url: string) => void
  setFontSize: (size: FontSize) => void
  setFontFamily: (family: FontFamily) => void
  setNoteMarkdownPreview: (enabled: boolean) => void
  setEmailPreferences: (prefs: Partial<EmailPreferences>) => void
  setGistSync: (prefs: Partial<GistSyncPreferences>) => void
  setFocusPreferences: (prefs: Partial<FocusPreferences>) => void
  setGamificationEnabled: (enabled: boolean) => void
  completeOnboarding: () => void

  // Helpers
  getCurrentApiKey: () => string
  getCurrentModel: () => LLMModel | undefined
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Default values
      llmProvider: 'openai',
      llmModel: 'gpt-4o-mini',
      apiKeys: {
        openai: '',
        anthropic: '',
        google: '',
        groq: '',
        ollama: '',
        tavily: '',
      },
      ollamaBaseUrl: 'http://localhost:11434',
      fontSize: 'base',
      fontFamily: 'system',
      noteMarkdownPreview: false,
      emailPreferences: {
        enabled: false,
        userEmail: '',
        emailjsServiceId: '',
        emailjsPublicKey: '',
        emailjsTemplateDaily: '',
        emailjsTemplateWeekly: '',
        emailjsTemplateStreak: '',
        dailySummaryEnabled: false,
        dailySummaryTime: '20:00',
        weeklySummaryEnabled: false,
        weeklySummaryDay: 0, // Sunday
        streakAlertsEnabled: true,
        lastDailySent: null,
        lastWeeklySent: null,
      },
      gistSync: {
        enabled: false,
        githubToken: '',
        gistId: '',
        autoSync: true,
        syncInterval: 5, // 5 minutes
        lastSyncAt: null,
        lastSyncStatus: null,
        lastSyncError: null,
      },
      focusPreferences: {
        defaultDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 20,
        sessionsUntilLongBreak: 4,
        autoStartBreak: false,
        playTickSound: false,
        playCompletionSound: true,
        showTimeInTitle: true,
        dailyGoalSessions: 5,
      },
      gamificationEnabled: true,
      onboardingCompleted: false,

      // Actions
      setLLMProvider: (provider) => {
        const models = LLM_MODELS[provider]
        set({
          llmProvider: provider,
          llmModel: models[0]?.id || ''
        })
      },

      setLLMModel: (model) => set({ llmModel: model }),

      setApiKey: (provider, key) => set((state) => ({
        apiKeys: { ...state.apiKeys, [provider]: key }
      })),

      setOllamaBaseUrl: (url) => set({ ollamaBaseUrl: url }),

      setFontSize: (size) => set({ fontSize: size }),

      setFontFamily: (family) => set({ fontFamily: family }),

      setNoteMarkdownPreview: (enabled) => set({ noteMarkdownPreview: enabled }),

      setEmailPreferences: (prefs) => set((state) => ({
        emailPreferences: { ...state.emailPreferences, ...prefs }
      })),

      setGistSync: (prefs) => set((state) => ({
        gistSync: { ...state.gistSync, ...prefs }
      })),

      setFocusPreferences: (prefs) => set((state) => ({
        focusPreferences: { ...state.focusPreferences, ...prefs }
      })),

      setGamificationEnabled: (enabled) => set({ gamificationEnabled: enabled }),

      completeOnboarding: () => set({ onboardingCompleted: true }),

      // Helpers
      getCurrentApiKey: () => {
        const state = get()
        return state.apiKeys[state.llmProvider]
      },

      getCurrentModel: () => {
        const state = get()
        return LLM_MODELS[state.llmProvider].find(m => m.id === state.llmModel)
      },
    }),
    {
      name: 'myflowspace-settings',
      // Persist all settings including API keys, font size, etc.
      partialize: (state) => ({
        llmProvider: state.llmProvider,
        llmModel: state.llmModel,
        apiKeys: state.apiKeys,
        ollamaBaseUrl: state.ollamaBaseUrl,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        noteMarkdownPreview: state.noteMarkdownPreview,
        emailPreferences: state.emailPreferences,
        gistSync: state.gistSync,
        focusPreferences: state.focusPreferences,
        gamificationEnabled: state.gamificationEnabled,
        onboardingCompleted: state.onboardingCompleted,
      }),
      // Merge persisted state with initial state to handle new fields
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<SettingsState>),
      }),
    }
  )
)
