import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { secretsStorage, isRememberOnDeviceEnabled, type StoredSecrets } from '../utils/storage'

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
  | 'courier-new'
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
  'courier-new': { 
    label: 'Courier New', 
    value: '"Courier New", Courier, monospace',
    isNerd: false 
  },
  'proto-nerd': { 
    label: '🔤 0xProto Nerd Font', 
    value: '"0xProto Nerd Font", "0xProto Nerd Font Mono", "0xProto NF", monospace',
    isNerd: true 
  },
  'hack-nerd': { 
    label: '🔤 Hack Nerd Font', 
    value: '"Hack Nerd Font", "Hack Nerd Font Mono", "Hack NF", monospace',
    isNerd: true 
  },
  'meslo-nerd': { 
    label: '🔤 Meslo Nerd Font', 
    value: '"MesloLGS Nerd Font", "MesloLGS NF", "MesloLGM Nerd Font", monospace',
    isNerd: true 
  },
  'fira-code-nerd': { 
    label: '🔤 Fira Code Nerd Font', 
    value: '"FiraCode Nerd Font", "FiraCode Nerd Font Mono", "FiraCode NF", monospace',
    isNerd: true 
  },
  'jetbrains-mono-nerd': { 
    label: '🔤 JetBrains Mono Nerd Font', 
    value: '"JetBrainsMono Nerd Font", "JetBrainsMono Nerd Font Mono", "JetBrainsMono NF", monospace',
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
  noteFontSize: FontSize // Separate font size for note editor content

  // GitHub Gist Sync
  gistSync: GistSyncPreferences

  // Web-only opt-in: persist secrets (apiKeys, gistSync.githubToken) to
  // localStorage instead of the sessionStorage-only default. Always false
  // in Electron, where safeStorage-backed encryption covers this instead
  // (see storage.ts).
  rememberSecretsOnDevice: boolean

  // Focus Mode Settings
  focusPreferences: FocusPreferences

  // Gamification
  gamificationEnabled: boolean

  // Onboarding
  onboardingCompleted: boolean

  // Locale Settings
  timezone: string // e.g., 'Europe/Istanbul', 'America/New_York'

  // Local Storage Settings
  localNotesEnabled: boolean
  localNotesPath: string // User-selected directory path for saving notes as .txt files
  localNotesDirHandle: FileSystemDirectoryHandle | null // For File System Access API

  // Actions
  setLLMProvider: (provider: LLMProvider) => void
  setLLMModel: (model: string) => void
  setApiKey: (provider: ApiKeyType, key: string) => void
  setOllamaBaseUrl: (url: string) => void
  setFontSize: (size: FontSize) => void
  setFontFamily: (family: FontFamily) => void
  setNoteMarkdownPreview: (enabled: boolean) => void
  setNoteFontSize: (size: FontSize) => void
  setGistSync: (prefs: Partial<GistSyncPreferences>) => void
  setRememberSecretsOnDevice: (enabled: boolean) => void
  setFocusPreferences: (prefs: Partial<FocusPreferences>) => void
  setGamificationEnabled: (enabled: boolean) => void
  setTimezone: (timezone: string) => void
  completeOnboarding: () => void
  setLocalNotesEnabled: (enabled: boolean) => void
  setLocalNotesPath: (path: string) => void
  setLocalNotesDirHandle: (handle: FileSystemDirectoryHandle | null) => void

  // Helpers
  getCurrentApiKey: () => string
  getCurrentModel: () => LLMModel | undefined
}

// --- Secret handling -------------------------------------------------------
// apiKeys and gistSync.githubToken are intentionally excluded from the
// zustand `persist` blob below (see `partialize`) and are instead mirrored
// to `secretsStorage` (Electron: electron-store via a safeStorage-encrypted
// IPC channel, Web: sessionStorage by default, or localStorage if the user
// opts in via `setRememberSecretsOnDevice` — see src/utils/storage.ts).
// This keeps the runtime store shape and every existing call site
// (`state.apiKeys[...]`, `getCurrentApiKey()`, etc.) unchanged; only where
// these fields end up at rest on disk changes.
function buildSecretsPayload(state: Pick<SettingsState, 'apiKeys' | 'gistSync'>): StoredSecrets {
  return {
    apiKeys: state.apiKeys,
    githubToken: state.gistSync.githubToken,
  }
}

let secretsMigrationRan = false

// Runs once per app session after the settings store rehydrates.
// - Always scrubs a legacy `emailPreferences` object left on the persisted
//   state from before the Email Notifications feature (and the field
//   entirely) was removed — there is no send path left anywhere in the
//   app. `merge` below spreads whatever the old localStorage blob still
//   has onto the live store, so the field can still be present at runtime
//   even though it's no longer part of `SettingsState`. This alone is a
//   `set` call, so it also triggers a persist re-write that drops the key
//   from the localStorage blob (the current `partialize` never lists it).
// - If secretsStorage already has a record, it wins (it's the source of
//   truth going forward) and is applied over whatever hydration produced.
//   If that record still carries an orphaned emailjsPublicKey from before
//   removal, it's re-saved via buildSecretsPayload (which no longer knows
//   about that field) — secretsStorage.save always overwrites the whole
//   record, so this is what actually deletes the stale value rather than
//   merely stopping future writes of it.
// - Otherwise, if the persisted localStorage blob still carries plaintext
//   secrets from before this change, migrate them into secretsStorage.
// - Either way, force one persist write so `partialize` (which no longer
//   writes secret values) overwrites any legacy plaintext left on disk.
// Idempotent: once secretsStorage has a record and the persisted blob no
// longer carries `emailPreferences`, subsequent runs are no-ops beyond
// re-applying the same values.
async function migrateAndLoadSecrets() {
  if (secretsMigrationRan) return
  secretsMigrationRan = true

  const state = useSettingsStore.getState()
  const stored = await secretsStorage.load() as (StoredSecrets & { emailjsPublicKey?: string }) | null

  // Legacy `emailPreferences` from before the Email Notifications feature
  // was removed. Detected via a runtime cast since the field no longer
  // exists on `SettingsState` — see comment above.
  const hasLegacyEmailPreferences = 'emailPreferences' in (state as unknown as Record<string, unknown>)
  if (hasLegacyEmailPreferences) {
    useSettingsStore.setState((s) => ({ ...s }))
  }

  if (stored) {
    useSettingsStore.setState((s) => ({
      apiKeys: { ...s.apiKeys, ...(stored.apiKeys || {}) },
      gistSync: { ...s.gistSync, githubToken: stored.githubToken ?? s.gistSync.githubToken },
    }))
    if ('emailjsPublicKey' in stored) {
      await secretsStorage.save(buildSecretsPayload(useSettingsStore.getState()))
    }
    return
  }

  const hasLegacySecrets =
    Object.values(state.apiKeys).some(Boolean) ||
    !!state.gistSync.githubToken

  if (hasLegacySecrets) {
    await secretsStorage.save(buildSecretsPayload(state))
  }

  // No-op state update: triggers the persist middleware to re-write the
  // localStorage blob using the current `partialize`, scrubbing any secret
  // values that were written by pre-fix versions of the app.
  useSettingsStore.setState((s) => ({ ...s }))
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
      noteFontSize: 'base',
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
      // Not persisted via `partialize` — source of truth is the localStorage
      // marker read by isRememberOnDeviceEnabled() (see storage.ts), which
      // is also always false in Electron.
      rememberSecretsOnDevice: isRememberOnDeviceEnabled(),
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
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detect from browser
      localNotesEnabled: false,
      localNotesPath: '',
      localNotesDirHandle: null,

      // Actions
      setLLMProvider: (provider) => {
        const models = LLM_MODELS[provider]
        set({
          llmProvider: provider,
          llmModel: models[0]?.id || ''
        })
      },

      setLLMModel: (model) => set({ llmModel: model }),

      setApiKey: (provider, key) => {
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key }
        }))
        void secretsStorage.save(buildSecretsPayload(get()))
      },

      setOllamaBaseUrl: (url) => set({ ollamaBaseUrl: url }),

      setFontSize: (size) => set({ fontSize: size }),

      setFontFamily: (family) => set({ fontFamily: family }),

      setNoteMarkdownPreview: (enabled) => set({ noteMarkdownPreview: enabled }),

      setNoteFontSize: (size) => set({ noteFontSize: size }),

      setGistSync: (prefs) => {
        set((state) => ({
          gistSync: { ...state.gistSync, ...prefs }
        }))
        if ('githubToken' in prefs) {
          void secretsStorage.save(buildSecretsPayload(get()))
        }
      },

      setRememberSecretsOnDevice: (enabled) => {
        set({ rememberSecretsOnDevice: enabled })
        void (async () => {
          await secretsStorage.setRememberOnDevice(enabled)
          if (enabled) {
            // Persist whatever is currently in memory immediately, rather
            // than waiting for the next setApiKey/setGistSync/etc. call.
            await secretsStorage.save(buildSecretsPayload(get()))
          }
        })()
      },

      setFocusPreferences: (prefs) => set((state) => ({
        focusPreferences: { ...state.focusPreferences, ...prefs }
      })),

      setGamificationEnabled: (enabled) => set({ gamificationEnabled: enabled }),

      setTimezone: (timezone) => set({ timezone }),

      completeOnboarding: () => set({ onboardingCompleted: true }),

      setLocalNotesEnabled: (enabled) => set({ localNotesEnabled: enabled }),

      setLocalNotesPath: (path) => set({ localNotesPath: path }),

      setLocalNotesDirHandle: (handle) => set({ localNotesDirHandle: handle }),

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
      name: 'bytepad-settings',
      // Persist settings, but NOT secrets (apiKeys, gistSync.githubToken).
      // Those are mirrored separately via `secretsStorage` (see
      // migrateAndLoadSecrets/buildSecretsPayload above) so they never land
      // in this plaintext localStorage blob.
      partialize: (state) => ({
        llmProvider: state.llmProvider,
        llmModel: state.llmModel,
        ollamaBaseUrl: state.ollamaBaseUrl,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        noteMarkdownPreview: state.noteMarkdownPreview,
        noteFontSize: state.noteFontSize,
        gistSync: { ...state.gistSync, githubToken: '' },
        focusPreferences: state.focusPreferences,
        gamificationEnabled: state.gamificationEnabled,
        onboardingCompleted: state.onboardingCompleted,
        timezone: state.timezone,
        localNotesEnabled: state.localNotesEnabled,
        localNotesPath: state.localNotesPath,
        // Note: localNotesDirHandle cannot be serialized, user needs to re-select folder
      }),
      // Merge persisted state with initial state to handle new fields.
      // Note: persistedState may still carry legacy plaintext apiKeys /
      // gistSync.githubToken from pre-fix installs, or a legacy
      // `emailPreferences` object from before the Email Notifications
      // feature was removed entirely (this old data isn't deleted out from
      // under the user); migrateAndLoadSecrets() picks those up right
      // after hydration, moves the secret ones into secretsStorage, drops
      // `emailPreferences`, and triggers a re-write that scrubs all of it
      // from this blob going forward.
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<SettingsState>),
      }),
    }
  )
)

// Kick off the one-time secrets migration/load once hydration completes.
// `onFinishHydration` covers the normal (async-scheduled) rehydrate path;
// the `hasHydrated` check covers the case where hydration already finished
// synchronously before this subscription was registered.
useSettingsStore.persist.onFinishHydration(() => {
  void migrateAndLoadSecrets()
})
if (useSettingsStore.persist.hasHydrated()) {
  void migrateAndLoadSecrets()
}
