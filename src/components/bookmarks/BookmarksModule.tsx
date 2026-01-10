import { useState } from 'react'
import { useBookmarkStore, getFilteredBookmarks } from '../../stores/bookmarkStore'
import type { Bookmark } from '../../types'

const COLLECTIONS = [
  { name: 'Gold', emoji: '🥇' },
  { name: 'Silver', emoji: '🥈' },
  { name: 'Bronze', emoji: '🥉' },
  { name: 'Unsorted', emoji: '📁' },
]

export function BookmarksModule() {
  const {
    bookmarks,
    selectedCollection,
    selectedTag,
    searchQuery,
    sortBy,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    toggleRead,
    setSelectedCollection,
    setSelectedTag,
    setSearchQuery,
    setSortBy,
    getTopTags,
    getCollections,
  } = useBookmarkStore()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newBookmark, setNewBookmark] = useState({ url: '', title: '', tags: '', collection: 'Unsorted' })
  const [editingId, setEditingId] = useState<string | null>(null)

  const filteredBookmarks = getFilteredBookmarks(useBookmarkStore.getState())
  const topTags = getTopTags(5)
  const collections = getCollections()

  const handleAdd = async () => {
    if (!newBookmark.url.trim()) return

    // Auto-generate title from URL if not provided
    let title = newBookmark.title.trim()
    if (!title) {
      try {
        const url = new URL(newBookmark.url)
        title = url.hostname.replace('www.', '')
      } catch {
        title = newBookmark.url
      }
    }

    addBookmark({
      url: newBookmark.url.trim(),
      title,
      tags: newBookmark.tags.split(',').map((t) => t.trim()).filter(Boolean),
      collection: newBookmark.collection,
    })

    setNewBookmark({ url: '', title: '', tags: '', collection: 'Unsorted' })
    setShowAddForm(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') setShowAddForm(false)
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar - Collections & Tags */}
      <div className="w-48 border-r border-np-border bg-np-bg-secondary flex flex-col">
        {/* Collections */}
        <div className="p-3 border-b border-np-border">
          <div className="text-xs text-np-text-secondary mb-2">Collections</div>
          <button
            onClick={() => setSelectedCollection(null)}
            className={`w-full text-left px-2 py-1 text-sm flex items-center justify-between ${
              !selectedCollection ? 'bg-np-selection text-np-text-primary' : 'text-np-text-secondary hover:bg-np-bg-tertiary'
            }`}
          >
            <span>📚 All bookmarks</span>
            <span className="text-xs">{bookmarks.length}</span>
          </button>
          {COLLECTIONS.map((col) => {
            const count = collections.find((c) => c.name === col.name)?.count || 0
            if (count === 0 && col.name !== 'Unsorted') return null
            return (
              <button
                key={col.name}
                onClick={() => setSelectedCollection(col.name)}
                className={`w-full text-left px-2 py-1 text-sm flex items-center justify-between ${
                  selectedCollection === col.name ? 'bg-np-selection text-np-text-primary' : 'text-np-text-secondary hover:bg-np-bg-tertiary'
                }`}
              >
                <span>{col.emoji} {col.name}</span>
                <span className="text-xs">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Top Tags */}
        {topTags.length > 0 && (
          <div className="p-3 flex-1">
            <div className="text-xs text-np-text-secondary mb-2">Tags ({topTags.length})</div>
            {topTags.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`w-full text-left px-2 py-1 text-sm flex items-center justify-between ${
                  selectedTag === tag ? 'bg-np-purple/20 text-np-purple' : 'text-np-text-secondary hover:bg-np-bg-tertiary'
                }`}
              >
                <span># {tag}</span>
                <span className="text-xs">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-np-border">
          <div className="flex items-center gap-4">
            <h2 className="text-np-text-primary">
              <span className="text-np-green">// </span>
              {selectedCollection || 'All bookmarks'}
              {selectedTag && <span className="text-np-purple ml-2">#{selectedTag}</span>}
            </h2>
            <span className="text-xs text-np-text-secondary">{filteredBookmarks.length} items</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'domain')}
              className="np-input text-xs"
            >
              <option value="date">By date ↓</option>
              <option value="title">By title</option>
              <option value="domain">By domain</option>
            </select>
            <button onClick={() => setShowAddForm(true)} className="np-btn">
              <span className="text-np-green">+</span> Add
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-np-border">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookmarks..."
            className="w-full np-input"
          />
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="p-3 border-b border-np-border bg-np-bg-secondary">
            <div className="space-y-2">
              <input
                type="url"
                value={newBookmark.url}
                onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com"
                className="w-full np-input"
                autoFocus
              />
              <input
                type="text"
                value={newBookmark.title}
                onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="Title (optional, auto-detected)"
                className="w-full np-input"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBookmark.tags}
                  onChange={(e) => setNewBookmark({ ...newBookmark, tags: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="Tags (comma separated)"
                  className="flex-1 np-input"
                />
                <select
                  value={newBookmark.collection}
                  onChange={(e) => setNewBookmark({ ...newBookmark, collection: e.target.value })}
                  className="np-input"
                >
                  {COLLECTIONS.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.emoji} {col.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} className="np-btn text-np-green">
                  Save
                </button>
                <button onClick={() => setShowAddForm(false)} className="np-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bookmark List */}
        <div className="flex-1 overflow-y-auto">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center text-np-text-secondary py-8">
              <div className="text-np-green mb-2">// No bookmarks</div>
              <div className="text-sm">Add your first bookmark to get started</div>
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => (
              <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                onToggleRead={() => toggleRead(bookmark.id)}
                onDelete={() => deleteBookmark(bookmark.id)}
                onEdit={() => setEditingId(bookmark.id)}
                onTagClick={(tag) => setSelectedTag(tag)}
                isEditing={editingId === bookmark.id}
                onUpdate={(updates) => {
                  updateBookmark(bookmark.id, updates)
                  setEditingId(null)
                }}
                onCancelEdit={() => setEditingId(null)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface BookmarkItemProps {
  bookmark: Bookmark
  onToggleRead: () => void
  onDelete: () => void
  onEdit: () => void
  onTagClick: (tag: string) => void
  isEditing: boolean
  onUpdate: (updates: Partial<Bookmark>) => void
  onCancelEdit: () => void
}

function BookmarkItem({
  bookmark,
  onToggleRead,
  onDelete,
  onEdit,
  onTagClick,
  isEditing,
  onUpdate,
  onCancelEdit,
}: BookmarkItemProps) {
  const [editData, setEditData] = useState({
    title: bookmark.title,
    tags: bookmark.tags.join(', '),
    collection: bookmark.collection || 'Unsorted',
  })

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
  }

  const getCollectionEmoji = (collection?: string) => {
    const col = COLLECTIONS.find((c) => c.name === collection)
    return col?.emoji || '📁'
  }

  if (isEditing) {
    return (
      <div className="p-3 border-b border-np-border bg-np-bg-secondary">
        <input
          type="text"
          value={editData.title}
          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          className="w-full np-input mb-2"
        />
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={editData.tags}
            onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
            placeholder="Tags"
            className="flex-1 np-input"
          />
          <select
            value={editData.collection}
            onChange={(e) => setEditData({ ...editData, collection: e.target.value })}
            className="np-input"
          >
            {COLLECTIONS.map((col) => (
              <option key={col.name} value={col.name}>
                {col.emoji} {col.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              onUpdate({
                title: editData.title,
                tags: editData.tags.split(',').map((t) => t.trim()).filter(Boolean),
                collection: editData.collection,
              })
            }
            className="np-btn text-np-green text-xs"
          >
            Save
          </button>
          <button onClick={onCancelEdit} className="np-btn text-xs">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`p-3 border-b border-np-border hover:bg-np-bg-tertiary transition-colors group ${
        bookmark.isRead ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Favicon placeholder */}
        <div className="w-10 h-10 bg-np-bg-tertiary border border-np-border flex items-center justify-center text-xs text-np-text-secondary flex-shrink-0">
          {bookmark.domain.substring(0, 2).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-np-cyan hover:underline font-medium block truncate"
          >
            {bookmark.title}
          </a>
          <div className="flex items-center gap-2 text-xs text-np-text-secondary mt-1">
            <span>{getCollectionEmoji(bookmark.collection)} {bookmark.collection || 'Unsorted'}</span>
            <span>·</span>
            <span>{bookmark.domain}</span>
            <span>·</span>
            <span>{formatDate(bookmark.createdAt)}</span>
          </div>
          {bookmark.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {bookmark.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  className="text-xs bg-np-bg-tertiary text-np-purple px-1 hover:bg-np-purple/20"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onToggleRead}
            className={`p-1 text-xs ${bookmark.isRead ? 'text-np-green' : 'text-np-text-secondary hover:text-np-green'}`}
            title={bookmark.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            {bookmark.isRead ? '✓' : '○'}
          </button>
          <button onClick={onEdit} className="p-1 text-xs text-np-text-secondary hover:text-np-blue" title="Edit">
            ✎
          </button>
          <button onClick={onDelete} className="p-1 text-xs text-np-text-secondary hover:text-np-error" title="Delete">
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
