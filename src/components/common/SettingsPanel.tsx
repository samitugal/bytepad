import { useState, useRef } from 'react'
import { exportAllData, downloadAsJson, importData, readFileAsJson, clearAllData, getDataStats } from '../../services/dataService'
import { useSettingsStore, LLM_MODELS, PROVIDER_INFO, LLMProvider, FONT_SIZES, FontSize, FONT_FAMILIES, FontFamily, ApiKeyType, GistSyncPreferences } from '../../stores/settingsStore'
import { useI18nStore, LANGUAGES, Language } from '../../i18n'
import { useThemeStore, Theme } from '../../stores/themeStore'
import { useNotificationStore } from '../../stores/notificationStore'
import { useAuthStore } from '../../stores/authStore'
import { requestNotificationPermission, startNotificationChecker, stopNotificationChecker } from '../../services/notificationService'
import {
    forcePushToGist,
    forcePullFromGist,
    createGist,
    validateGitHubToken
} from '../../services/gistSyncService'
import {
    useKeybindingsStore,
    formatKeybinding,
    type Keybinding
} from '../../stores/keybindingsStore'

type SettingsTab = 'general' | 'keyboard' | 'ai' | 'integrations' | 'sync' | 'data'

const TABS: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'keyboard', label: 'Keyboard', icon: '⌨️' },
    { id: 'ai', label: 'AI', icon: '🤖' },
    { id: 'integrations', label: 'Integrations', icon: '🔌' },
    { id: 'sync', label: 'Sync', icon: '☁️' },
    { id: 'data', label: 'Data', icon: '💾' },
]

interface SettingsPanelProps {
    isOpen: boolean
    onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general')
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const [showApiKey, setShowApiKey] = useState(false)
    const [gistSyncStatus, setGistSyncStatus] = useState<string | null>(null)
    const [isGistSyncing, setIsGistSyncing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const stats = getDataStats()

    const {
        llmProvider,
        llmModel,
        apiKeys,
        ollamaBaseUrl,
        fontSize,
        fontFamily,
        noteFontSize,
        emailPreferences,
        gistSync,
        setLLMProvider,
        setLLMModel,
        setApiKey,
        setOllamaBaseUrl,
        setFontSize,
        setFontFamily,
        setNoteFontSize,
        setEmailPreferences,
        setGistSync,
    } = useSettingsStore()

    const {
        preferences: notifPrefs,
        permissionGranted,
        setPreferences: setNotifPrefs,
    } = useNotificationStore()

    const { user, isLoading: authLoading, isConfigured: authConfigured, signIn, signOut } = useAuthStore()

    // Handlers
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
        downloadAsJson(data, `bytepad-backup-${date}.json`)
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

    const handleGistForcePush = async () => {
        if (!confirm('This will overwrite remote data with local data. Continue?')) return
        setIsGistSyncing(true)
        setGistSyncStatus(null)
        const result = await forcePushToGist()
        setGistSyncStatus(result.message)
        setIsGistSyncing(false)
    }

    const handleGistForcePull = async () => {
        if (!confirm('This will overwrite local data with remote data. Continue?')) return
        setIsGistSyncing(true)
        setGistSyncStatus(null)
        const result = await forcePullFromGist()
        setGistSyncStatus(result.message)
        setIsGistSyncing(false)
    }

    const handleCreateGist = async () => {
        if (!gistSync.githubToken) {
            setGistSyncStatus('Please enter GitHub token first')
            return
        }
        setIsGistSyncing(true)
        try {
            const isValid = await validateGitHubToken(gistSync.githubToken)
            if (!isValid) {
                setGistSyncStatus('Invalid GitHub token')
                setIsGistSyncing(false)
                return
            }
            const gistId = await createGist(gistSync.githubToken, 'bytepad Data Sync')
            setGistSync({ gistId, enabled: true })
            setGistSyncStatus(`Gist created! ID: ${gistId}`)
        } catch (error) {
            setGistSyncStatus(`Error: ${error instanceof Error ? error.message : 'Unknown'}`)
        }
        setIsGistSyncing(false)
    }

    const handleToggleGistSync = () => {
        const newEnabled = !gistSync.enabled
        setGistSync({ enabled: newEnabled })
        // No auto-sync - sync happens on app open/close
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="w-[600px] max-h-[85vh] bg-np-bg-secondary border border-np-border shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-np-border shrink-0">
                    <span className="text-np-text-primary font-medium">Settings</span>
                    <button onClick={onClose} className="text-np-text-secondary hover:text-np-text-primary text-xl">
                        ×
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-np-border shrink-0">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-3 py-2 text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === tab.id
                                ? 'bg-np-bg-tertiary text-np-text-primary border-b-2 border-np-blue'
                                : 'text-np-text-secondary hover:bg-np-bg-tertiary hover:text-np-text-primary'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'general' && (
                        <GeneralTab
                            fontSize={fontSize}
                            setFontSize={setFontSize}
                            fontFamily={fontFamily}
                            setFontFamily={setFontFamily}
                            noteFontSize={noteFontSize}
                            setNoteFontSize={setNoteFontSize}
                        />
                    )}

                    {activeTab === 'keyboard' && (
                        <KeyboardTab />
                    )}

                    {activeTab === 'ai' && (
                        <AITab
                            llmProvider={llmProvider}
                            llmModel={llmModel}
                            apiKeys={apiKeys}
                            ollamaBaseUrl={ollamaBaseUrl}
                            showApiKey={showApiKey}
                            setShowApiKey={setShowApiKey}
                            setLLMProvider={setLLMProvider}
                            setLLMModel={setLLMModel}
                            setApiKey={setApiKey}
                            setOllamaBaseUrl={setOllamaBaseUrl}
                        />
                    )}

                    {activeTab === 'integrations' && (
                        <IntegrationsTab
                            apiKeys={apiKeys}
                            setApiKey={setApiKey}
                            emailPreferences={emailPreferences}
                            setEmailPreferences={setEmailPreferences}
                            notifPrefs={notifPrefs}
                            permissionGranted={permissionGranted}
                            handleEnableNotifications={handleEnableNotifications}
                            handleDisableNotifications={handleDisableNotifications}
                            setNotifPrefs={setNotifPrefs}
                        />
                    )}

                    {activeTab === 'sync' && (
                        <SyncTab
                            gistSync={gistSync}
                            setGistSync={setGistSync}
                            gistSyncStatus={gistSyncStatus}
                            isGistSyncing={isGistSyncing}
                            handleGistForcePush={handleGistForcePush}
                            handleGistForcePull={handleGistForcePull}
                            handleCreateGist={handleCreateGist}
                            handleToggleGistSync={handleToggleGistSync}
                            user={user}
                            authLoading={authLoading}
                            authConfigured={authConfigured}
                            signIn={signIn}
                            signOut={signOut}
                        />
                    )}

                    {activeTab === 'data' && (
                        <DataTab
                            stats={stats}
                            importStatus={importStatus}
                            fileInputRef={fileInputRef}
                            handleExport={handleExport}
                            handleImportClick={handleImportClick}
                            handleFileChange={handleFileChange}
                            handleClearData={handleClearData}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-np-border text-xs text-np-text-secondary flex justify-between shrink-0">
                    <span>bytepad v0.22.1</span>
                    <span>Ctrl+, to open settings</span>
                </div>
            </div>
        </div>
    )
}

// ============ TAB COMPONENTS ============

function GeneralTab({ fontSize, setFontSize, fontFamily, setFontFamily, noteFontSize, setNoteFontSize }: {
    fontSize: FontSize
    setFontSize: (size: FontSize) => void
    fontFamily: FontFamily
    setFontFamily: (family: FontFamily) => void
    noteFontSize: FontSize
    setNoteFontSize: (size: FontSize) => void
}) {
    const { language, setLanguage } = useI18nStore()
    const { theme, setTheme } = useThemeStore()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm text-np-green mb-3">// Display</h3>
                <div className="space-y-4">
                    {/* Theme Selection */}
                    <div>
                        <label className="block text-xs text-np-text-secondary mb-1">Theme</label>
                        <div className="flex gap-2">
                            {(['dark', 'light', 'system'] as Theme[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`flex-1 px-3 py-2 text-sm border transition-colors ${theme === t
                                            ? 'bg-np-selection border-np-blue text-np-text-primary'
                                            : 'bg-np-bg-tertiary border-np-border text-np-text-secondary hover:bg-np-bg-hover'
                                        }`}
                                >
                                    {t === 'dark' && '🌙 Dark'}
                                    {t === 'light' && '☀️ Light'}
                                    {t === 'system' && '💻 System'}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-np-text-secondary mt-1">
                            Choose your preferred color scheme.
                        </p>
                    </div>

                    {/* Language Selection */}
                    <div>
                        <label className="block text-xs text-np-text-secondary mb-1">Language</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="w-full bg-np-bg-primary border border-np-border text-np-text-primary
                         font-mono text-sm px-2 py-1.5 focus:outline-none focus:border-np-blue"
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang.id} value={lang.id}>
                                    {lang.nativeLabel} ({lang.label})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-np-text-secondary mt-1">
                            Select your preferred language.
                        </p>
                    </div>

                    {/* Font Size */}
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
                            Changes apply to UI elements (buttons, menus, etc.)
                        </p>
                    </div>

                    {/* Note Font Size */}
                    <div>
                        <label className="block text-xs text-np-text-secondary mb-1">Note Editor Font Size</label>
                        <select
                            value={noteFontSize}
                            onChange={(e) => setNoteFontSize(e.target.value as FontSize)}
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
                            Separate font size for note content.
                        </p>
                    </div>

                    {/* Font Family */}
                    <div>
                        <label className="block text-xs text-np-text-secondary mb-1">Font Family</label>
                        <select
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                            className="w-full bg-np-bg-primary border border-np-border text-np-text-primary
                         font-mono text-sm px-2 py-1.5 focus:outline-none focus:border-np-blue"
                        >
                            <optgroup label="Standard Fonts">
                                {(Object.keys(FONT_FAMILIES) as FontFamily[])
                                    .filter((f) => !FONT_FAMILIES[f].isNerd)
                                    .map((family) => (
                                        <option key={family} value={family}>
                                            {FONT_FAMILIES[family].label}
                                        </option>
                                    ))}
                            </optgroup>
                            <optgroup label="Nerd Fonts (requires installation)">
                                {(Object.keys(FONT_FAMILIES) as FontFamily[])
                                    .filter((f) => FONT_FAMILIES[f].isNerd)
                                    .map((family) => (
                                        <option key={family} value={family}>
                                            {FONT_FAMILIES[family].label}
                                        </option>
                                    ))}
                            </optgroup>
                        </select>
                        <p className="text-xs text-np-text-secondary mt-1">
                            Nerd Fonts must be installed on your system.
                            <a 
                                href="https://www.nerdfonts.com/font-downloads" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-np-cyan hover:underline ml-1"
                            >
                                Download Nerd Fonts →
                            </a>
                        </p>
                    </div>
                </div>
            </div>

        </div>
    )
}

function AITab({
    llmProvider,
    llmModel,
    apiKeys,
    ollamaBaseUrl,
    showApiKey,
    setShowApiKey,
    setLLMProvider,
    setLLMModel,
    setApiKey,
    setOllamaBaseUrl,
}: {
    llmProvider: LLMProvider
    llmModel: string
    apiKeys: Record<string, string>
    ollamaBaseUrl: string
    showApiKey: boolean
    setShowApiKey: (show: boolean) => void
    setLLMProvider: (provider: LLMProvider) => void
    setLLMModel: (model: string) => void
    setApiKey: (provider: ApiKeyType, key: string) => void
    setOllamaBaseUrl: (url: string) => void
}) {
    const hasApiKey = llmProvider === 'ollama' || !!apiKeys[llmProvider]

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm text-np-green mb-3">// AI Provider</h3>
                <div className="space-y-4">
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
                            <label className="block text-xs text-np-text-secondary mb-1">
                                API Key {!hasApiKey && <span className="text-np-error">*required</span>}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={apiKeys[llmProvider] || ''}
                                    onChange={(e) => setApiKey(llmProvider, e.target.value)}
                                    placeholder={`Enter ${PROVIDER_INFO[llmProvider].name} API key...`}
                                    className={`flex-1 bg-np-bg-primary border text-np-text-primary 
                             font-mono text-sm px-2 py-1.5 focus:outline-none focus:border-np-blue
                             ${!hasApiKey ? 'border-np-error' : 'border-np-border'}`}
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

                    {/* Status */}
                    <div className={`text-xs p-2 border ${hasApiKey ? 'border-np-green text-np-green' : 'border-np-error text-np-error'}`}>
                        {hasApiKey
                            ? `✓ ${PROVIDER_INFO[llmProvider].name} configured - Chat is ready`
                            : `✗ API key required - Chat is disabled`
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

function IntegrationsTab({
    apiKeys,
    setApiKey,
    emailPreferences,
    setEmailPreferences,
    notifPrefs,
    permissionGranted,
    handleEnableNotifications,
    handleDisableNotifications,
    setNotifPrefs,
}: {
    apiKeys: Record<string, string>
    setApiKey: (provider: ApiKeyType, key: string) => void
    emailPreferences: {
        enabled: boolean
        userEmail: string
        emailjsServiceId: string
        emailjsPublicKey: string
        dailySummaryEnabled: boolean
        dailySummaryTime: string
        weeklySummaryEnabled: boolean
        weeklySummaryDay: number
        streakAlertsEnabled: boolean
    }
    setEmailPreferences: (prefs: Partial<typeof emailPreferences>) => void
    notifPrefs: { enabled: boolean; quietHoursStart: string; quietHoursEnd: string }
    permissionGranted: boolean
    handleEnableNotifications: () => void
    handleDisableNotifications: () => void
    setNotifPrefs: (prefs: Partial<typeof notifPrefs>) => void
}) {
    return (
        <div className="space-y-6">
            {/* Tavily */}
            <div>
                <h3 className="text-sm text-np-green mb-3">// Web Search (Tavily)</h3>
                <div>
                    <label className="block text-xs text-np-text-secondary mb-1">Tavily API Key</label>
                    <input
                        type="password"
                        value={apiKeys.tavily || ''}
                        onChange={(e) => setApiKey('tavily', e.target.value)}
                        placeholder="tvly-xxxxxxxxxxxx"
                        className="w-full bg-np-bg-primary border border-np-border text-np-text-primary 
                       font-mono text-sm px-2 py-1.5 focus:outline-none focus:border-np-blue"
                    />
                    <p className="text-xs text-np-text-secondary mt-1">
                        Get your API key at{' '}
                        <a href="https://tavily.com" target="_blank" rel="noopener" className="text-np-blue hover:underline">
                            tavily.com
                        </a>
                    </p>
                </div>
            </div>

            {/* Browser Notifications */}
            <div>
                <h3 className="text-sm text-np-green mb-3">// Browser Notifications</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-np-text-secondary">Push Notifications</span>
                        {notifPrefs.enabled ? (
                            <button onClick={handleDisableNotifications} className="np-btn text-xs text-np-error">
                                Disable
                            </button>
                        ) : (
                            <button onClick={handleEnableNotifications} className="np-btn text-xs text-np-green">
                                {permissionGranted ? 'Enable' : 'Request Permission'}
                            </button>
                        )}
                    </div>

                    {notifPrefs.enabled && (
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-np-text-secondary">Quiet Hours:</span>
                            <input
                                type="time"
                                value={notifPrefs.quietHoursStart}
                                onChange={(e) => setNotifPrefs({ quietHoursStart: e.target.value })}
                                className="np-input text-xs"
                            />
                            <span className="text-xs text-np-text-secondary">to</span>
                            <input
                                type="time"
                                value={notifPrefs.quietHoursEnd}
                                onChange={(e) => setNotifPrefs({ quietHoursEnd: e.target.value })}
                                className="np-input text-xs"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Email Notifications */}
            <div>
                <h3 className="text-sm text-np-green mb-3">// Email Notifications</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-np-text-secondary">Email Notifications</span>
                        <button
                            onClick={() => setEmailPreferences({ enabled: !emailPreferences.enabled })}
                            className={`np-btn text-xs ${emailPreferences.enabled ? 'text-np-error' : 'text-np-green'}`}
                        >
                            {emailPreferences.enabled ? 'Disable' : 'Enable'}
                        </button>
                    </div>

                    {emailPreferences.enabled && (
                        <>
                            <div>
                                <label className="block text-xs text-np-text-secondary mb-1">Your Email</label>
                                <input
                                    type="email"
                                    value={emailPreferences.userEmail}
                                    onChange={(e) => setEmailPreferences({ userEmail: e.target.value })}
                                    placeholder="your@email.com"
                                    className="w-full bg-np-bg-primary border border-np-border text-np-text-primary 
                             font-mono text-sm px-2 py-1.5 focus:outline-none focus:border-np-blue"
                                />
                            </div>

                            <div className="pt-2 border-t border-np-border">
                                <p className="text-xs text-np-text-secondary mb-2">
                                    EmailJS Configuration -{' '}
                                    <a href="https://emailjs.com" target="_blank" rel="noopener" className="text-np-blue hover:underline">
                                        emailjs.com
                                    </a>
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={emailPreferences.emailjsServiceId}
                                        onChange={(e) => setEmailPreferences({ emailjsServiceId: e.target.value })}
                                        placeholder="Service ID"
                                        className="bg-np-bg-primary border border-np-border text-np-text-primary 
                               font-mono text-xs px-2 py-1 focus:outline-none focus:border-np-blue"
                                    />
                                    <input
                                        type="text"
                                        value={emailPreferences.emailjsPublicKey}
                                        onChange={(e) => setEmailPreferences({ emailjsPublicKey: e.target.value })}
                                        placeholder="Public Key"
                                        className="bg-np-bg-primary border border-np-border text-np-text-primary 
                               font-mono text-xs px-2 py-1 focus:outline-none focus:border-np-blue"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-np-text-secondary">
                                    <input
                                        type="checkbox"
                                        checked={emailPreferences.dailySummaryEnabled}
                                        onChange={(e) => setEmailPreferences({ dailySummaryEnabled: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    Daily summary email
                                </label>
                                <label className="flex items-center gap-2 text-sm text-np-text-secondary">
                                    <input
                                        type="checkbox"
                                        checked={emailPreferences.weeklySummaryEnabled}
                                        onChange={(e) => setEmailPreferences({ weeklySummaryEnabled: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    Weekly report email
                                </label>
                                <label className="flex items-center gap-2 text-sm text-np-text-secondary">
                                    <input
                                        type="checkbox"
                                        checked={emailPreferences.streakAlertsEnabled}
                                        onChange={(e) => setEmailPreferences({ streakAlertsEnabled: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    Streak risk alerts
                                </label>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function SyncTab({
    gistSync,
    setGistSync,
    gistSyncStatus,
    isGistSyncing,
    handleGistForcePush,
    handleGistForcePull,
    handleCreateGist,
    handleToggleGistSync,
    user,
    authLoading,
    authConfigured,
    signIn,
    signOut,
}: {
    gistSync: GistSyncPreferences
    setGistSync: (prefs: Partial<GistSyncPreferences>) => void
    gistSyncStatus: string | null
    isGistSyncing: boolean
    handleGistForcePush: () => void
    handleGistForcePull: () => void
    handleCreateGist: () => void
    handleToggleGistSync: () => void
    user: { displayName: string | null; email: string | null; photoURL: string | null } | null
    authLoading: boolean
    authConfigured: boolean
    signIn: () => void
    signOut: () => void
}) {
    return (
        <div className="space-y-6">
            {/* Google Account */}
            <div>
                <h3 className="text-sm text-np-green mb-3">// Google Account</h3>
                {!authConfigured ? (
                    <div className="text-xs text-np-text-secondary bg-np-bg-tertiary p-3 border border-np-border">
                        <p className="mb-2">Google Sign-in is not configured.</p>
                        <p>Add Firebase config to <code className="text-np-cyan">.env</code> file.</p>
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
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {authLoading ? 'Signing in...' : 'Sign in with Google'}
                    </button>
                )}
            </div>

            {/* GitHub Gist Sync */}
            <div>
                <h3 className="text-sm text-np-green mb-3">// GitHub Gist Sync</h3>
                <div className="space-y-3">
                    <p className="text-xs text-np-text-secondary">
                        Sync your data across devices using a private GitHub Gist.
                    </p>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-np-text-secondary">Enable Gist Sync</span>
                        <button
                            onClick={handleToggleGistSync}
                            disabled={!gistSync.githubToken || !gistSync.gistId}
                            className={`np-btn text-xs ${gistSync.enabled ? 'text-np-error' : 'text-np-green'}`}
                        >
                            {gistSync.enabled ? 'Disable' : 'Enable'}
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs text-np-text-secondary mb-1">GitHub Token</label>
                        <input
                            type="password"
                            value={gistSync.githubToken}
                            onChange={(e) => setGistSync({ githubToken: e.target.value })}
                            placeholder="ghp_xxxxxxxxxxxx"
                            className="w-full bg-np-bg-primary border border-np-border text-np-text-primary 
                         font-mono text-xs px-2 py-1.5 focus:outline-none focus:border-np-blue"
                        />
                        <p className="text-xs text-np-text-secondary mt-1">
                            <a
                                href="https://github.com/settings/tokens/new?scopes=gist&description=bytepad"
                                target="_blank"
                                rel="noopener"
                                className="text-np-blue hover:underline"
                            >
                                Create token
                            </a>
                            {' '}with "gist" scope
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs text-np-text-secondary mb-1">Gist ID</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={gistSync.gistId}
                                onChange={(e) => setGistSync({ gistId: e.target.value })}
                                placeholder="Enter existing Gist ID or create new"
                                className="flex-1 bg-np-bg-primary border border-np-border text-np-text-primary 
                           font-mono text-xs px-2 py-1.5 focus:outline-none focus:border-np-blue"
                            />
                            <button
                                onClick={handleCreateGist}
                                disabled={isGistSyncing || !gistSync.githubToken}
                                className="np-btn text-xs"
                            >
                                {isGistSyncing ? '...' : 'Create New'}
                            </button>
                        </div>
                    </div>

                    {gistSync.gistId && (
                        <div className="text-xs text-np-text-secondary p-2 bg-np-bg-tertiary border border-np-border">
                            <strong>Sync Mode:</strong> Pull on app open, Push on app close
                            <br />
                            <span className="text-np-text-secondary/70">Use manual buttons for immediate sync</span>
                        </div>
                    )}

                    {/* Sync Status Indicator */}
                    {gistSync.enabled && gistSync.gistId && (
                        <div className="pt-2 border-t border-np-border space-y-3">
                            {/* Sync Status */}
                            <div className={`flex items-center justify-between p-2 border ${
                                isGistSyncing ? 'border-np-blue bg-np-blue/10' :
                                gistSync.lastSyncStatus === 'error' ? 'border-np-error bg-np-error/10' :
                                gistSync.lastSyncStatus === 'success' ? 'border-np-green bg-np-green/10' :
                                'border-np-border bg-np-bg-tertiary'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <span className={`text-lg ${
                                        isGistSyncing ? 'animate-spin' : ''
                                    }`}>
                                        {isGistSyncing ? '🔄' :
                                         gistSync.lastSyncStatus === 'error' ? '❌' :
                                         gistSync.lastSyncStatus === 'success' ? '✅' : '⏳'}
                                    </span>
                                    <div>
                                        <div className="text-xs text-np-text-primary">
                                            {isGistSyncing ? 'Syncing...' :
                                             gistSync.lastSyncStatus === 'error' ? 'Sync Failed' :
                                             gistSync.lastSyncStatus === 'success' ? 'Synced' : 'Ready'}
                                        </div>
                                        {gistSync.lastSyncAt && !isGistSyncing && (
                                            <div className="text-xs text-np-text-secondary">
                                                {new Date(gistSync.lastSyncAt).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-np-text-secondary">
                                    Mode: Pull on open, Push on close
                                </div>
                            </div>

                            {/* Error Message */}
                            {gistSyncStatus && gistSync.lastSyncStatus === 'error' && (
                                <div className="text-xs p-2 border border-np-error text-np-error bg-np-error/10">
                                    {gistSyncStatus}
                                </div>
                            )}

                            {/* Manual Override Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleGistForcePush}
                                    disabled={isGistSyncing}
                                    className="np-btn text-xs flex-1 text-np-orange hover:bg-np-orange/10"
                                    title="Overwrite remote with local data"
                                >
                                    ⬆️ Force Push
                                </button>
                                <button
                                    onClick={handleGistForcePull}
                                    disabled={isGistSyncing}
                                    className="np-btn text-xs flex-1 text-np-cyan hover:bg-np-cyan/10"
                                    title="Overwrite local with remote data"
                                >
                                    ⬇️ Force Pull
                                </button>
                            </div>

                            <p className="text-xs text-np-text-secondary">
                                💡 Sync happens automatically on startup, when you close the app, and at your configured interval.
                                Use Push/Pull for manual overrides.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function DataTab({
    stats,
    importStatus,
    fileInputRef,
    handleExport,
    handleImportClick,
    handleFileChange,
    handleClearData,
}: {
    stats: { notes: number; habits: number; tasks: number; journalEntries: number }
    importStatus: { type: 'success' | 'error'; message: string } | null
    fileInputRef: React.RefObject<HTMLInputElement>
    handleExport: () => void
    handleImportClick: () => void
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleClearData: () => void
}) {
    const {
        localNotesEnabled,
        localNotesPath,
        localNotesDirHandle,
        setLocalNotesEnabled,
        setLocalNotesPath,
        setLocalNotesDirHandle,
    } = useSettingsStore()
    
    const [localNotesStatus, setLocalNotesStatus] = useState<string | null>(null)
    const [isSavingNotes, setIsSavingNotes] = useState(false)

    const handleSelectFolder = async () => {
        console.log('Select Folder clicked')
        
        // Check if File System Access API is supported
        if (!('showDirectoryPicker' in window)) {
            setLocalNotesStatus('Error: Your browser does not support folder selection. Please use Chrome, Edge, or Opera.')
            console.error('showDirectoryPicker not supported')
            return
        }
        
        console.log('showDirectoryPicker is supported, opening dialog...')
        setLocalNotesStatus('Opening folder picker...')
        
        try {
            // @ts-expect-error - showDirectoryPicker is not in TypeScript's lib yet
            const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
            })
            
            console.log('Folder selected:', dirHandle)
            
            if (dirHandle) {
                setLocalNotesDirHandle(dirHandle)
                setLocalNotesPath(dirHandle.name)
                setLocalNotesEnabled(true)
                setLocalNotesStatus(`✓ Folder selected: ${dirHandle.name}`)
            }
        } catch (error) {
            console.error('Folder selection error:', error)
            if ((error as Error).name === 'AbortError') {
                // User cancelled
                setLocalNotesStatus('Folder selection cancelled')
                return
            }
            setLocalNotesStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    const handleSaveAllNotes = async () => {
        if (!localNotesDirHandle) {
            setLocalNotesStatus('Please select a folder first')
            return
        }
        setIsSavingNotes(true)
        try {
            const { saveAllNotesToFiles } = await import('../../services/localNotesService')
            const result = await saveAllNotesToFiles()
            setLocalNotesStatus(`Saved ${result.success} notes${result.failed > 0 ? `, ${result.failed} failed` : ''}`)
        } catch (error) {
            setLocalNotesStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        setIsSavingNotes(false)
    }

    const handleDownloadNote = async () => {
        const { downloadNoteAsTxt } = await import('../../services/localNotesService')
        const { useNoteStore } = await import('../../stores/noteStore')
        const activeNote = useNoteStore.getState().getActiveNote()
        if (activeNote) {
            downloadNoteAsTxt(activeNote)
            setLocalNotesStatus(`Downloaded: ${activeNote.title || 'Untitled'}.txt`)
        } else {
            setLocalNotesStatus('No active note to download')
        }
    }

    const handleDownloadAllAsZip = async () => {
        setLocalNotesStatus('Creating ZIP file...')
        try {
            const { downloadAllDataAsZip } = await import('../../services/localNotesService')
            const result = await downloadAllDataAsZip()
            setLocalNotesStatus(`✓ Downloaded ZIP with ${result.notes} notes, ${result.tasks} tasks, ${result.habits} habits, ${result.journal} journal entries`)
        } catch (error) {
            console.error('ZIP download error:', error)
            setLocalNotesStatus(`Error: ${error instanceof Error ? error.message : 'Failed to create ZIP'}`)
        }
    }

    return (
        <div className="space-y-6">
            {/* Local Notes Storage */}
            <div>
                <h3 className="text-sm text-np-green mb-3">// Local Notes Storage</h3>
                <p className="text-xs text-np-text-secondary mb-3">
                    Save your notes as .txt files to a folder on your computer for easy access and backup.
                </p>
                
                <div className="space-y-3">
                    {/* Folder Selection */}
                    <button
                        onClick={handleSelectFolder}
                        className="w-full np-btn text-left"
                    >
                        <span className="text-np-cyan">📁</span> {localNotesPath ? `Change Folder (${localNotesPath})` : 'Select Folder'}
                    </button>

                    {/* Save All Notes Button - always show but disable if no folder */}
                    <button
                        onClick={handleSaveAllNotes}
                        disabled={isSavingNotes || !localNotesDirHandle}
                        className={`w-full np-btn text-left ${!localNotesDirHandle ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span className="text-np-green">💾</span> {isSavingNotes ? 'Saving...' : 'Save All Notes to Folder'}
                    </button>

                    {/* Download Single Note (Fallback) */}
                    <button
                        onClick={handleDownloadNote}
                        className="w-full np-btn text-left"
                    >
                        <span className="text-np-purple">↓</span> Download Current Note as .txt
                    </button>

                    {/* Download All Data as ZIP */}
                    <button
                        onClick={handleDownloadAllAsZip}
                        className="w-full np-btn text-left"
                    >
                        <span className="text-np-orange">📦</span> Download All Data as ZIP
                    </button>

                    {/* Auto-save Toggle */}
                    {localNotesDirHandle && (
                        <label className="flex items-center gap-2 text-sm text-np-text-secondary cursor-pointer hover:text-np-text-primary">
                            <input
                                type="checkbox"
                                checked={localNotesEnabled}
                                onChange={(e) => setLocalNotesEnabled(e.target.checked)}
                                className="w-4 h-4 accent-np-green"
                            />
                            Auto-save notes to folder when editing
                        </label>
                    )}

                    {/* Status */}
                    {localNotesStatus && (
                        <div className={`text-xs p-2 border bg-np-bg-tertiary ${
                            localNotesStatus.startsWith('Error') ? 'border-np-error text-np-error' : 'border-np-border text-np-text-secondary'
                        }`}>
                            {localNotesStatus}
                        </div>
                    )}

                    <p className="text-xs text-np-text-secondary">
                        💡 Note: You may need to re-select the folder after restarting the app due to browser security.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div>
                <h3 className="text-sm text-np-green mb-3">// Your Data</h3>
                <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-np-bg-tertiary p-3 border border-np-border">
                        <div className="text-2xl text-np-text-primary">{stats.notes}</div>
                        <div className="text-xs text-np-text-secondary">Notes</div>
                    </div>
                    <div className="bg-np-bg-tertiary p-3 border border-np-border">
                        <div className="text-2xl text-np-text-primary">{stats.habits}</div>
                        <div className="text-xs text-np-text-secondary">Habits</div>
                    </div>
                    <div className="bg-np-bg-tertiary p-3 border border-np-border">
                        <div className="text-2xl text-np-text-primary">{stats.tasks}</div>
                        <div className="text-xs text-np-text-secondary">Tasks</div>
                    </div>
                    <div className="bg-np-bg-tertiary p-3 border border-np-border">
                        <div className="text-2xl text-np-text-primary">{stats.journalEntries}</div>
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
                        <span className="text-np-purple">↑</span> Import from Backup
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {importStatus && (
                    <div className={`mt-2 p-2 text-xs ${importStatus.type === 'success'
                        ? 'bg-np-green/20 text-np-green'
                        : 'bg-np-error/20 text-np-error'
                        }`}>
                        {importStatus.message}
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div>
                <h3 className="text-sm text-np-error mb-3">// Danger Zone</h3>
                <button
                    onClick={handleClearData}
                    className="w-full np-btn text-np-error border-np-error hover:bg-np-error/20"
                >
                    🗑️ Delete All Data
                </button>
                <p className="text-xs text-np-text-secondary mt-2">
                    This will permanently delete all your notes, tasks, habits, and journal entries.
                </p>
            </div>
        </div>
    )
}

// ============ KEYBOARD TAB ============

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
    navigation: { label: 'Navigation', icon: '🧭' },
    system: { label: 'System', icon: '⚙️' },
    focus: { label: 'Focus', icon: '🎯' },
    actions: { label: 'Actions', icon: '⚡' },
}

function KeyboardTab() {
    const { keybindings, customKeybindings, setKeybinding, resetKeybinding, resetAllKeybindings, isKeysConflict } = useKeybindingsStore()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingKeys, setEditingKeys] = useState('')
    const [conflictWarning, setConflictWarning] = useState<string | null>(null)

    // Group keybindings by category
    const groupedKeybindings = keybindings.reduce((acc, kb) => {
        if (!acc[kb.category]) acc[kb.category] = []
        acc[kb.category].push({
            ...kb,
            keys: customKeybindings[kb.id] || kb.keys,
            isModified: !!customKeybindings[kb.id],
        })
        return acc
    }, {} as Record<string, (Keybinding & { isModified: boolean })[]>)

    const handleStartEdit = (kb: Keybinding) => {
        setEditingId(kb.id)
        setEditingKeys(customKeybindings[kb.id] || kb.keys)
        setConflictWarning(null)
    }

    const handleKeyCapture = (e: React.KeyboardEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // Build key combination
        const parts: string[] = []
        if (e.ctrlKey) parts.push('ctrl')
        if (e.altKey) parts.push('alt')
        if (e.shiftKey) parts.push('shift')

        // Get the actual key
        let key = e.key.toLowerCase()
        if (key === 'control' || key === 'alt' || key === 'shift') return // Ignore modifier-only presses

        // Normalize special keys
        if (key === ' ') key = 'space'
        if (key === 'escape') key = 'esc'

        parts.push(key)
        const newKeys = parts.join('+')
        setEditingKeys(newKeys)

        // Check for conflicts
        const conflict = isKeysConflict(newKeys, editingId || undefined)
        if (conflict) {
            setConflictWarning(`Conflicts with "${conflict.label}"`)
        } else {
            setConflictWarning(null)
        }
    }

    const handleSaveEdit = () => {
        if (!editingId || !editingKeys) return

        // Check for conflicts before saving
        const conflict = isKeysConflict(editingKeys, editingId)
        if (conflict) {
            setConflictWarning(`Cannot save: conflicts with "${conflict.label}"`)
            return
        }

        setKeybinding(editingId, editingKeys)
        setEditingId(null)
        setEditingKeys('')
        setConflictWarning(null)
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditingKeys('')
        setConflictWarning(null)
    }

    const handleResetOne = (id: string) => {
        resetKeybinding(id)
        if (editingId === id) {
            setEditingId(null)
            setEditingKeys('')
        }
    }

    const handleResetAll = () => {
        if (confirm('Reset all keyboard shortcuts to defaults?')) {
            resetAllKeybindings()
            setEditingId(null)
            setEditingKeys('')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm text-np-green">// Custom Keybindings</h3>
                    <p className="text-xs text-np-text-secondary mt-1">
                        Click on a shortcut to customize it
                    </p>
                </div>
                <button onClick={handleResetAll} className="np-btn text-xs text-np-orange">
                    Reset All
                </button>
            </div>

            {/* Categories */}
            {Object.entries(CATEGORY_LABELS).map(([category, { label, icon }]) => (
                <div key={category}>
                    <h4 className="text-xs text-np-text-secondary mb-2 flex items-center gap-2">
                        <span>{icon}</span>
                        <span>{label}</span>
                    </h4>
                    <div className="space-y-1">
                        {groupedKeybindings[category]?.map((kb) => (
                            <div
                                key={kb.id}
                                className={`flex items-center justify-between p-2 border transition-colors ${
                                    editingId === kb.id
                                        ? 'bg-np-selection border-np-blue'
                                        : 'bg-np-bg-tertiary border-np-border hover:border-np-blue/50'
                                } ${kb.isModified ? 'border-l-2 border-l-np-purple' : ''}`}
                            >
                                <div className="flex-1">
                                    <div className="text-sm text-np-text-primary">{kb.label}</div>
                                    <div className="text-xs text-np-text-secondary">{kb.description}</div>
                                </div>

                                {editingId === kb.id ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={formatKeybinding(editingKeys)}
                                            onKeyDown={handleKeyCapture}
                                            placeholder="Press keys..."
                                            readOnly
                                            autoFocus
                                            className="w-32 bg-np-bg-primary border border-np-border text-np-cyan text-xs px-2 py-1 text-center focus:outline-none focus:border-np-blue"
                                        />
                                        <button onClick={handleSaveEdit} className="text-np-green text-sm px-1" title="Save">
                                            ✓
                                        </button>
                                        <button onClick={handleCancelEdit} className="text-np-error text-sm px-1" title="Cancel">
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleStartEdit(kb)}
                                            className={`px-2 py-1 text-xs font-mono ${
                                                kb.isModified ? 'text-np-purple' : 'text-np-cyan'
                                            } bg-np-bg-primary border border-np-border hover:border-np-blue`}
                                        >
                                            {formatKeybinding(kb.keys)}
                                        </button>
                                        {kb.isModified && (
                                            <button
                                                onClick={() => handleResetOne(kb.id)}
                                                className="text-np-text-secondary hover:text-np-orange text-xs"
                                                title="Reset to default"
                                            >
                                                ↺
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Conflict Warning */}
            {conflictWarning && (
                <div className="text-xs text-np-error bg-np-error/10 border border-np-error p-2">
                    ⚠️ {conflictWarning}
                </div>
            )}

            {/* Help */}
            <div className="text-xs text-np-text-secondary bg-np-bg-tertiary p-3 border border-np-border">
                <p className="font-medium mb-1">Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Click a shortcut to edit, then press your desired key combination</li>
                    <li>Modified shortcuts are marked with a purple border</li>
                    <li>Shortcuts are saved automatically and persist across sessions</li>
                </ul>
            </div>
        </div>
    )
}
