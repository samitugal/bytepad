import { useState, useRef } from 'react'
import { exportAllData, downloadAsJson, importData, readFileAsJson, clearAllData, getDataStats } from '../../services/dataService'
import { useSettingsStore, LLM_MODELS, PROVIDER_INFO, LLMProvider, FONT_SIZES, FontSize } from '../../stores/settingsStore'
import { useNotificationStore } from '../../stores/notificationStore'
import { useAuthStore } from '../../stores/authStore'
import { requestNotificationPermission, startNotificationChecker, stopNotificationChecker } from '../../services/notificationService'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stats = getDataStats()
  
  const {
    llmProvider,
    llmModel,
    apiKeys,
    ollamaBaseUrl,
    fontSize,
    setLLMProvider,
    setLLMModel,
    setApiKey,
    setOllamaBaseUrl,
    setFontSize,
  } = useSettingsStore()
  
  const {
    preferences: notifPrefs,
    permissionGranted,
    setPreferences: setNotifPrefs,
  } = useNotificationStore()

  const { user, isLoading: authLoading, isConfigured: authConfigured, signIn, signOut } = useAuthStore()
  
  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      setNotifPrefs({ enabled: true })
      startNotificationChecker()
    }
  }
  
  const handleDisableNotifications = () => {
    setNotifPrefs({ enabled: false })
    stopNotificationChecker()
  }

  const handleExport = () => {
    const data = exportAllData()
    const date = new Date().toISOString().split('T')[0]
    downloadAsJson(data, `myflowspace-backup-${date}.json`)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await readFileAsJson(file)
      const result = importData(data)

      if (result.success) {
        setImportStatus({ type: 'success', message: 'Data imported successfully! Refresh to see changes.' })
      } else {
        setImportStatus({ type: 'error', message: result.error || 'Import failed' })
      }
    } catch (error) {
      setImportStatus({ type: 'error', message: String(error) })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
      if (confirm('Really? All notes, habits, tasks, and journal entries will be permanently deleted.')) {
        clearAllData()
        setImportStatus({ type: 'success', message: 'All data cleared. Refresh to reset.' })
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-[500px] max-h-[85vh] bg-np-bg-secondary border border-np-border shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-np-border shrink-0">
          <span className="text-np-text-primary">Settings</span>
          <button onClick={onClose} className="text-np-text-secondary hover:text-np-text-primary">
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Display Settings - MOVED TO TOP */}
          <div>
            <h3 className="text-sm text-np-green mb-3">// Display</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-np-text-secondary mb-1">Font Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as FontSize)}
                  className="w-full bg-np-bg-primary border border-np-border text-np-text-primary
                             font-mono text-sm px-2 py-1.5 focus:outline-none focus:border-np-blue"
                >
                  {(Object.keys(FONT_SIZES) as FontSize[]).map((size) => (
                    <option key={size} value={size}>
                      {FONT_SIZES[size].label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-np-text-secondary mt-1">
                  Changes apply immediately to the entire app.
                </p>
              </div>
            </div>
          </div>

          {/* Account / Google Auth */}
          <div>
            <h3 className="text-sm text-np-green mb-3">// Account</h3>
            {!authConfigured ? (
              <div className="text-xs text-np-text-secondary bg-np-bg-tertiary p-3 border border-np-border">
                <p className="mb-2">Google Sign-in is not configured.</p>
                <p>Add Firebase config to <code className="text-np-cyan">.env</code> file:</p>
                <pre className="mt-2 text-np-purple text-xs">
{`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...`}
                </pre>
              </div>
            ) : user ? (
              <div className="flex items-center justify-between bg-np-bg-tertiary p-3 border border-np-border">
                <div className="flex items-center gap-3">
                  {user.photoURL && (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                  )}
                  <div>
                    <div className="text-sm text-np-text-primary">{user.displayName}</div>
                    <div className="text-xs text-np-text-secondary">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  disabled={authLoading}
                  className="np-btn text-xs text-np-error"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                disabled={authLoading}
                className="w-full np-btn flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {authLoading ? 'Signing in...' : 'Sign in with Google'}
              </button>
            )}
          </div>

          {/* Data Stats */}
          <div>
            <h3 className="text-sm text-np-green mb-3">// Your Data</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-np-bg-tertiary p-2 border border-np-border">
                <div className="text-lg text-np-text-primary">{stats.notes}</div>
                <div className="text-xs text-np-text-secondary">Notes</div>
              </div>
              <div className="bg-np-bg-tertiary p-2 border border-np-border">
                <div className="text-lg text-np-text-primary">{stats.habits}</div>
                <div className="text-xs text-np-text-secondary">Habits</div>
              </div>
              <div className="bg-np-bg-tertiary p-2 border border-np-border">
                <div className="text-lg text-np-text-primary">{stats.tasks}</div>
                <div className="text-xs text-np-text-secondary">Tasks</div>
              </div>
              <div className="bg-np-bg-tertiary p-2 border border-np-border">
                <div className="text-lg text-np-text-primary">{stats.journalEntries}</div>
                <div className="text-xs text-np-text-secondary">Journal</div>
              </div>
            </div>
          </div>

          {/* Export/Import */}
          <div>
            <h3 className="text-sm text-np-green mb-3">// Backup & Restore</h3>
            <div className="space-y-2">
              <button onClick={handleExport} className="w-full np-btn text-left">
                <span className="text-np-cyan">↓</span> Export All Data (JSON)
              </button>

              <button onClick={handleImportClick} className="w-full np-btn text-left">
                <span className="text-np-purple">↑</span> Import Data from Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              {importStatus && (
                <div className={`p-2 text-sm ${
                  importStatus.type === 'success' ? 'text-np-green bg-np-green/10' : 'text-np-error bg-np-error/10'
                }`}>
                  {importStatus.message}
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <h3 className="text-sm text-np-error mb-3">// Danger Zone</h3>
            <button
              onClick={handleClearData}
              className="w-full np-btn text-left text-np-error hover:bg-np-error/20"
            >
              <span>🗑</span> Delete All Data
            </button>
            <p className="text-xs text-np-text-secondary mt-2">
              This will permanently delete all your notes, habits, tasks, and journal entries.
            </p>
          </div>

          {/* Notification Settings */}
          <div>
            <h3 className="text-sm text-np-green mb-3">// Notifications</h3>
            <div className="space-y-3">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-np-text-secondary">Browser Notifications</span>
                {notifPrefs.enabled ? (
                  <button onClick={handleDisableNotifications} className="np-btn text-np-error text-xs">
                    Disable
                  </button>
                ) : (
                  <button onClick={handleEnableNotifications} className="np-btn text-np-green text-xs">
                    Enable
                  </button>
                )}
              </div>
              
              {/* Permission status */}
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${permissionGranted ? 'bg-np-green' : 'bg-np-warning'}`}></span>
                <span className="text-np-text-secondary">
                  {permissionGranted ? 'Permission granted' : 'Permission required'}
                </span>
              </div>
              
              {notifPrefs.enabled && (
                <>
                  {/* Notification types */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-np-text-secondary">
                      <input
                        type="checkbox"
                        checked={notifPrefs.habitReminders}
                        onChange={(e) => setNotifPrefs({ habitReminders: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>🎯 Habit reminders</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-np-text-secondary">
                      <input
                        type="checkbox"
                        checked={notifPrefs.taskDeadlines}
                        onChange={(e) => setNotifPrefs({ taskDeadlines: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>⏰ Task deadline alerts</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-np-text-secondary">
                      <input
                        type="checkbox"
                        checked={notifPrefs.streakAlerts}
                        onChange={(e) => setNotifPrefs({ streakAlerts: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>🔥 Streak risk alerts</span>
                    </label>
                  </div>
                  
                  {/* Quiet hours */}
                  <div className="pt-2 border-t border-np-border">
                    <label className="flex items-center gap-2 text-sm text-np-text-secondary mb-2">
                      <input
                        type="checkbox"
                        checked={notifPrefs.quietHoursEnabled}
                        onChange={(e) => setNotifPrefs({ quietHoursEnabled: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>🌙 Quiet hours</span>
                    </label>
                    {notifPrefs.quietHoursEnabled && (
                      <div className="flex items-center gap-2 ml-6">
                        <input
                          type="time"
                          value={notifPrefs.quietHoursStart}
                          onChange={(e) => setNotifPrefs({ quietHoursStart: e.target.value })}
                          className="np-input text-xs"
                        />
                        <span className="text-np-text-secondary">to</span>
                        <input
                          type="time"
                          value={notifPrefs.quietHoursEnd}
                          onChange={(e) => setNotifPrefs({ quietHoursEnd: e.target.value })}
                          className="np-input text-xs"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* AI / LLM Settings */}
          <div>
            <h3 className="text-sm text-np-green mb-3">// AI Settings</h3>
            <div className="space-y-3">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs text-np-text-secondary mb-1">Provider</label>
                <select
                  value={llmProvider}
                  onChange={(e) => setLLMProvider(e.target.value as LLMProvider)}
                  className="w-full bg-np-bg-primary border border-np-border text-np-text-primary 
                             font-mono text-sm px-2 py-1.5 focus:outline-none focus:border-np-blue"
                >
                  {(Object.keys(PROVIDER_INFO) as LLMProvider[]).map((provider) => (
                    <option key={provider} value={provider}>
                      {PROVIDER_INFO[provider].name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-xs text-np-text-secondary mb-1">Model</label>
                <select
                  value={llmModel}
                  onChange={(e) => setLLMModel(e.target.value)}
                  className="w-full bg-np-bg-primary border border-np-border text-np-text-primary 
                             font-mono text-sm px-2 py-1.5 focus:outline-none focus:border-np-blue"
                >
                  {LLM_MODELS[llmProvider].map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* API Key Input */}
              {PROVIDER_INFO[llmProvider].requiresKey && (
                <div>
                  <label className="block text-xs text-np-text-secondary mb-1">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeys[llmProvider]}
                      onChange={(e) => setApiKey(llmProvider, e.target.value)}
                      placeholder={`Enter ${PROVIDER_INFO[llmProvider].name} API key...`}
                      className="flex-1 bg-np-bg-primary border border-np-border text-np-text-primary 
                                 font-mono text-sm px-2 py-1.5 focus:outline-none focus:border-np-blue"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="np-btn text-xs"
                      title={showApiKey ? 'Hide' : 'Show'}
                    >
                      {showApiKey ? '👁' : '👁‍🗨'}
                    </button>
                  </div>
                  <p className="text-xs text-np-text-secondary mt-1">
                    Your API key is stored locally and never sent to our servers.
                  </p>
                </div>
              )}

              {/* Ollama Base URL */}
              {llmProvider === 'ollama' && (
                <div>
                  <label className="block text-xs text-np-text-secondary mb-1">Ollama Base URL</label>
                  <input
                    type="text"
                    value={ollamaBaseUrl}
                    onChange={(e) => setOllamaBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full bg-np-bg-primary border border-np-border text-np-text-primary 
                               font-mono text-sm px-2 py-1.5 focus:outline-none focus:border-np-blue"
                  />
                </div>
              )}

              {/* Status indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${apiKeys[llmProvider] || llmProvider === 'ollama' ? 'bg-np-green' : 'bg-np-warning'}`}></span>
                <span className="text-np-text-secondary">
                  {apiKeys[llmProvider] || llmProvider === 'ollama' 
                    ? `Ready to use ${PROVIDER_INFO[llmProvider].name}` 
                    : 'API key required'}
                </span>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="text-sm text-np-green mb-3">// Keyboard Shortcuts</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-np-text-secondary">Command Palette</span>
                <kbd className="bg-np-bg-tertiary px-2 text-np-text-primary">Ctrl+K</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-np-text-secondary">Navigate Modules</span>
                <kbd className="bg-np-bg-tertiary px-2 text-np-text-primary">Ctrl+1-5</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-np-text-secondary">Focus Mode</span>
                <kbd className="bg-np-bg-tertiary px-2 text-np-text-primary">Ctrl+Shift+F</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-np-text-secondary">FlowBot Chat</span>
                <kbd className="bg-np-bg-tertiary px-2 text-np-text-primary">Ctrl+/</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-np-text-secondary">Save</span>
                <kbd className="bg-np-bg-tertiary px-2 text-np-text-primary">Ctrl+S</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-np-text-secondary">Close/Cancel</span>
                <kbd className="bg-np-bg-tertiary px-2 text-np-text-primary">Escape</kbd>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="text-center text-xs text-np-text-secondary border-t border-np-border pt-4">
            <div className="text-np-text-primary">MyFlowSpace v0.8.0</div>
            <div className="mt-1">ADHD Productivity Super App</div>
            <div className="mt-1">Built with Notepad++ aesthetics 💜</div>
          </div>
        </div>
      </div>
    </div>
  )
}
