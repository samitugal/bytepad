import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama'

export interface LLMModel {
  id: string
  name: string
  provider: LLMProvider
}

export const LLM_MODELS: Record<LLMProvider, LLMModel[]> = {
  openai: [
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

interface SettingsState {
  // LLM Settings
  llmProvider: LLMProvider
  llmModel: string
  apiKeys: Record<LLMProvider, string>
  ollamaBaseUrl: string
  
  // Editor Settings
  noteMarkdownPreview: boolean
  
  // Actions
  setLLMProvider: (provider: LLMProvider) => void
  setLLMModel: (model: string) => void
  setApiKey: (provider: LLMProvider, key: string) => void
  setOllamaBaseUrl: (url: string) => void
  setNoteMarkdownPreview: (enabled: boolean) => void
  
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
      },
      ollamaBaseUrl: 'http://localhost:11434',
      noteMarkdownPreview: false,
      
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
      
      setNoteMarkdownPreview: (enabled) => set({ noteMarkdownPreview: enabled }),
      
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
    }
  )
)
