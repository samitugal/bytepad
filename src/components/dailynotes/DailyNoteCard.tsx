import { useState, useRef, useEffect } from 'react'
import { useDailyNotesStore } from '../../stores/dailyNotesStore'
import type { DailyNoteCard as DailyNoteCardType } from '../../types'
import { ConfirmModal } from '../common'
import { useTranslation } from '../../i18n'

interface Props {
  card: DailyNoteCardType
  date: string
}

const EMOJI_OPTIONS = ['📝', '💡', '🎯', '📋', '⭐', '🔥', '💪', '🎨', '📚', '🚀', '✅', '❓', '⚠️', '💭', '🔗']

export function DailyNoteCard({ card, date }: Props) {
  const { t } = useTranslation()
  const { updateCard, deleteCard, togglePinCard } = useDailyNotesStore()
  const [isEditing, setIsEditing] = useState(!card.title && !card.content)
  const [title, setTitle] = useState(card.title)
  const [content, setContent] = useState(card.content)
  const [icon, setIcon] = useState(card.icon || '📝')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [tagsInput, setTagsInput] = useState(card.tags.join(', '))
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && titleRef.current) {
      titleRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    updateCard(date, card.id, {
      title: title.trim() || 'Untitled',
      content,
      icon,
      tags,
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    deleteCard(date, card.id)
    setShowDeleteConfirm(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false)
      setTitle(card.title)
      setContent(card.content)
      setIcon(card.icon || '📝')
      setTagsInput(card.tags.join(', '))
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    }
  }

  if (isEditing) {
    return (
      <div className="bg-np-bg-secondary border border-np-blue p-4 flex flex-col gap-3" onKeyDown={handleKeyDown}>
        {/* Icon Picker */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-2xl hover:bg-np-bg-hover p-1 rounded"
          >
            {icon}
          </button>
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-1 bg-np-bg-tertiary border border-np-border p-2 flex flex-wrap gap-1 z-10 w-48">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setIcon(emoji)
                    setShowEmojiPicker(false)
                  }}
                  className="text-lg hover:bg-np-bg-hover p-1 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('dailyNotes.cardTitle')}
          className="bg-np-bg-primary border border-np-border text-np-text-primary px-3 py-2 text-sm focus:outline-none focus:border-np-blue"
        />

        {/* Content */}
        <textarea
          ref={contentRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('dailyNotes.writeNote')}
          rows={4}
          className="bg-np-bg-primary border border-np-border text-np-text-primary px-3 py-2 text-sm focus:outline-none focus:border-np-blue resize-none"
        />

        {/* Tags */}
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder={t('dailyNotes.tags')}
          className="bg-np-bg-primary border border-np-border text-np-text-secondary px-3 py-1 text-xs focus:outline-none focus:border-np-blue"
        />

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleDelete}
            className="text-np-error text-xs hover:underline"
          >
            {t('common.delete')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false)
                setTitle(card.title)
                setContent(card.content)
                setIcon(card.icon || '📝')
                setTagsInput(card.tags.join(', '))
              }}
              className="text-np-text-secondary text-xs hover:text-np-text-primary"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="np-btn text-xs"
            >
              {t('common.save')} (Ctrl+Enter)
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-np-bg-secondary border ${card.pinned ? 'border-np-yellow' : 'border-np-border'} p-4 cursor-pointer hover:border-np-blue transition-colors group relative`}
      onClick={() => setIsEditing(true)}
    >
      {/* Pin indicator */}
      {card.pinned && (
        <div className="absolute -top-2 -right-2 text-np-yellow">📌</div>
      )}

      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xl">{card.icon || '📝'}</span>
        <h3 className="text-np-text-primary font-medium flex-1 truncate">
          {card.title || t('notes.untitled')}
        </h3>
      </div>

      {/* Content */}
      <p className="text-np-text-secondary text-sm line-clamp-3 mb-3">
        {card.content || t('notes.emptyNote')}
      </p>

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-np-bg-tertiary text-np-cyan px-2 py-0.5"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions (visible on hover) */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            togglePinCard(date, card.id)
          }}
          className={`text-xs px-2 py-1 ${card.pinned ? 'text-np-yellow' : 'text-np-text-secondary hover:text-np-yellow'}`}
          title={card.pinned ? t('dailyNotes.pinned') : t('dailyNotes.pinned')}
        >
          📌
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          className="text-xs px-2 py-1 text-np-text-secondary hover:text-np-error"
          title={t('common.delete')}
        >
          ×
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={`// ${t('dailyNotes.deleteCard')}`}
        message={t('dailyNotes.deleteCardConfirm', { title: card.title || t('notes.untitled') })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
