import { useState, useMemo } from 'react'
import { useBookmarkStore } from '../../stores/bookmarkStore'

interface LinkedResourcesEditorProps {
  linkedBookmarkIds: string[]
  onChange: (ids: string[]) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function LinkedResourcesEditor({ linkedBookmarkIds, onChange, searchQuery, onSearchChange }: LinkedResourcesEditorProps) {
  const bookmarks = useBookmarkStore((state) => state.bookmarks)
  const [showDropdown, setShowDropdown] = useState(false)

  // Get linked bookmarks
  const linkedBookmarks = useMemo(() => {
    return bookmarks.filter(b => linkedBookmarkIds.includes(b.id))
  }, [linkedBookmarkIds, bookmarks])

  // Get available bookmarks (not already linked)
  const availableBookmarks = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return bookmarks
      .filter(b => !linkedBookmarkIds.includes(b.id))
      .filter(b => !query || b.title.toLowerCase().includes(query) || b.url.toLowerCase().includes(query))
      .slice(0, 8)
  }, [bookmarks, linkedBookmarkIds, searchQuery])

  const handleAddBookmark = (bookmarkId: string) => {
    if (!linkedBookmarkIds.includes(bookmarkId)) {
      onChange([...linkedBookmarkIds, bookmarkId])
    }
    onSearchChange('')
    setShowDropdown(false)
  }

  const handleRemoveBookmark = (bookmarkId: string) => {
    onChange(linkedBookmarkIds.filter(id => id !== bookmarkId))
  }

  return (
    <div className="mb-3">
      <label className="text-xs text-np-text-secondary block mb-1">🔗 Linked Resources</label>

      {/* Currently linked bookmarks */}
      {linkedBookmarks.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {linkedBookmarks.map((bookmark) => (
            <span
              key={bookmark.id}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-np-cyan/20 text-np-cyan rounded max-w-[200px]"
            >
              <span className="truncate">{bookmark.title}</span>
              <button
                onClick={() => handleRemoveBookmark(bookmark.id)}
                className="hover:text-np-error ml-1 flex-shrink-0"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search and add bookmarks */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Search bookmarks to link..."
          className="w-full np-input text-sm"
        />

        {/* Dropdown */}
        {showDropdown && availableBookmarks.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-np-bg-secondary border border-np-border shadow-lg z-50 max-h-48 overflow-y-auto">
            {availableBookmarks.map((bookmark) => (
              <button
                key={bookmark.id}
                onClick={() => handleAddBookmark(bookmark.id)}
                className="w-full text-left px-3 py-2 hover:bg-np-bg-hover flex items-center gap-2"
              >
                <span className="text-np-cyan">🔗</span>
                <div className="flex-1 min-w-0">
                  <div className="text-np-text-primary text-sm truncate">{bookmark.title}</div>
                  <div className="text-np-text-secondary text-xs truncate">{bookmark.domain}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showDropdown && availableBookmarks.length === 0 && searchQuery && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-np-bg-secondary border border-np-border shadow-lg z-50 px-3 py-2 text-sm text-np-text-secondary">
            No bookmarks found for "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  )
}
