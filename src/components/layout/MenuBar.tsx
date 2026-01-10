import { useUIStore } from '../../stores/uiStore'
import { useChatStore } from '../../stores/chatStore'
import { useSettingsStore, PROVIDER_INFO } from '../../stores/settingsStore'

interface MenuBarProps {
  onSettingsClick?: () => void
}

export function MenuBar({ onSettingsClick }: MenuBarProps) {
  const { toggleFocusMode } = useUIStore()
  const { toggleOpen: toggleChat } = useChatStore()
  const { llmProvider, apiKeys } = useSettingsStore()

  // Check if API key is configured
  const hasApiKey = llmProvider === 'ollama' || !!apiKeys[llmProvider]
  const requiresKey = PROVIDER_INFO[llmProvider].requiresKey

  return (
    <div className="h-6 bg-np-bg-secondary border-b border-np-border flex items-center justify-between px-2 text-sm select-none">
      <div className="flex items-center gap-4">
        <span className="text-np-text-primary font-medium">MyFlowSpace</span>
        <div className="flex items-center gap-3 text-np-text-secondary">
          <span className="hover:text-np-text-primary cursor-pointer">File</span>
          <span className="hover:text-np-text-primary cursor-pointer">Edit</span>
          <span className="hover:text-np-text-primary cursor-pointer">View</span>
          <span
            className="hover:text-np-text-primary cursor-pointer"
            onClick={toggleFocusMode}
            title="Focus Mode (Ctrl+Shift+F)"
          >
            Focus
          </span>
          <span
            className={`cursor-pointer ${hasApiKey || !requiresKey
                ? 'hover:text-np-text-primary text-np-green'
                : 'text-np-text-secondary/50 cursor-not-allowed'
              }`}
            onClick={hasApiKey || !requiresKey ? toggleChat : undefined}
            title={
              hasApiKey || !requiresKey
                ? 'FlowBot AI Coach (Ctrl+/)'
                : 'Configure API key in Settings → AI'
            }
          >
            🤖 Chat {!hasApiKey && requiresKey && <span className="text-np-error text-xs">!</span>}
          </span>
          <span
            className="hover:text-np-text-primary cursor-pointer"
            onClick={onSettingsClick}
            title="Settings"
          >
            Settings
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-np-text-secondary">
        <button className="w-6 h-5 hover:bg-np-bg-tertiary flex items-center justify-center">─</button>
        <button className="w-6 h-5 hover:bg-np-bg-tertiary flex items-center justify-center">□</button>
        <button className="w-6 h-5 hover:bg-np-error/80 flex items-center justify-center">×</button>
      </div>
    </div>
  )
}
