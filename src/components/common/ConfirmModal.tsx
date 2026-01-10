import { useEffect, useRef } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'danger' | 'primary' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Focus confirm button when modal opens
  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus()
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter') {
        onConfirm()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel, onConfirm])

  if (!isOpen) return null

  const getConfirmButtonStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-np-error/20 border-np-error text-np-error hover:bg-np-error hover:text-white'
      case 'warning':
        return 'bg-np-orange/20 border-np-orange text-np-orange hover:bg-np-orange hover:text-np-bg-primary'
      case 'primary':
        return 'bg-np-blue/20 border-np-blue text-np-blue hover:bg-np-blue hover:text-white'
      default:
        return 'bg-np-error/20 border-np-error text-np-error hover:bg-np-error hover:text-white'
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-np-bg-secondary border border-np-border shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-np-border bg-np-bg-tertiary">
          <div className="flex items-center gap-2">
            <span className="text-np-orange font-mono">!</span>
            <span className="text-np-text-primary font-mono text-sm">
              {title}
            </span>
          </div>
          <button
            onClick={onCancel}
            className="text-np-text-secondary hover:text-np-text-primary font-mono text-sm px-2 py-1 hover:bg-np-bg-hover transition-colors"
          >
            [x]
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-6">
          <p className="text-np-text-primary text-sm font-mono leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-np-border bg-np-bg-tertiary">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-mono text-np-text-secondary border border-np-border
                       hover:text-np-text-primary hover:bg-np-bg-hover transition-colors"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-mono border transition-colors ${getConfirmButtonStyles()}`}
          >
            {confirmText}
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className="text-np-text-secondary text-xs font-mono">
            <kbd className="np-kbd">Enter</kbd> to confirm • <kbd className="np-kbd">Esc</kbd> to cancel
          </span>
        </div>
      </div>
    </div>
  )
}
