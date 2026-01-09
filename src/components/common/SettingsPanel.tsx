import { useState, useRef } from 'react'
import { exportAllData, downloadAsJson, importData, readFileAsJson, clearAllData, getDataStats } from '../../services/dataService'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stats = getDataStats()

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
        className="w-[500px] bg-np-bg-secondary border border-np-border shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-np-border">
          <span className="text-np-text-primary">Settings</span>
          <button onClick={onClose} className="text-np-text-secondary hover:text-np-text-primary">
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
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
            <div className="text-np-text-primary">MyFlowSpace v0.3.0</div>
            <div className="mt-1">ADHD Productivity Super App</div>
            <div className="mt-1">Built with Notepad++ aesthetics 💜</div>
          </div>
        </div>
      </div>
    </div>
  )
}
