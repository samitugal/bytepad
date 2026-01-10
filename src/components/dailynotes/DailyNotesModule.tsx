import { useEffect, useCallback } from 'react'
import { useDailyNotesStore } from '../../stores/dailyNotesStore'
import { DailyNoteCard } from './DailyNoteCard'
import { useTranslation } from '../../i18n'

export function DailyNotesModule() {
  const { t, language } = useTranslation()
  const {
    currentDate,
    filter,
    searchQuery,
    goToToday,
    goToPrevDay,
    goToNextDay,
    setFilter,
    setSearchQuery,
    getFilteredCards,
    addCard,
    getOrCreateDailyNote,
  } = useDailyNotesStore()

  const cards = getFilteredCards(currentDate)
  const isToday = currentDate === new Date().toISOString().split('T')[0]

  const handleAddCard = useCallback(() => {
    getOrCreateDailyNote(currentDate)
    addCard(currentDate, {
      title: '',
      content: '',
      icon: '📝',
      pinned: false,
      tags: [],
    })
  }, [currentDate, addCard, getOrCreateDailyNote])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        handleAddCard()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrevDay()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNextDay()
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        goToToday()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleAddCard, goToPrevDay, goToNextDay, goToToday])

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const locale = language === 'tr' ? 'tr-TR' : 'en-US'
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-np-border bg-np-bg-secondary px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-np-text-primary font-medium">{t('dailyNotes.title')}</h2>
          <button
            onClick={handleAddCard}
            className="np-btn text-xs flex items-center gap-1"
            title={`${t('dailyNotes.newCard')} (N)`}
          >
            <span>+</span>
            <span>{t('dailyNotes.newCard')}</span>
          </button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={goToPrevDay}
            className="text-np-text-secondary hover:text-np-text-primary px-2 py-1"
            title={`${t('common.previous')} (←)`}
          >
            ←
          </button>
          <div className="text-center">
            <div className="text-np-text-primary font-medium">
              {formatDate(currentDate)}
            </div>
            {!isToday && (
              <button
                onClick={goToToday}
                className="text-xs text-np-blue hover:underline"
              >
                {t('common.today')} (T)
              </button>
            )}
          </div>
          <button
            onClick={goToNextDay}
            className="text-np-text-secondary hover:text-np-text-primary px-2 py-1"
            title={`${t('common.next')} (→)`}
          >
            →
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(['all', 'pinned', 'newest'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs border transition-colors ${
                  filter === f
                    ? 'border-np-blue text-np-blue bg-np-blue/10'
                    : 'border-np-border text-np-text-secondary hover:text-np-text-primary'
                }`}
              >
                {f === 'all' ? t('tasks.all') : f === 'pinned' ? `📌 ${t('dailyNotes.pinned')}` : `🕐 ${language === 'tr' ? 'En Yeni' : 'Newest'}`}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search') + '...'}
            className="bg-np-bg-primary border border-np-border text-np-text-primary text-xs px-3 py-1 w-48 focus:outline-none focus:border-np-blue"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-np-text-secondary">
            <div className="text-4xl mb-4">📝</div>
            <div className="text-sm mb-2">{language === 'tr' ? 'Bu gün için not yok' : 'No notes for this day'}</div>
            <button
              onClick={handleAddCard}
              className="text-np-blue hover:underline text-sm"
            >
              + {language === 'tr' ? 'İlk kartını ekle' : 'Add your first card'}
            </button>
            <div className="text-xs mt-4 text-np-text-secondary/50">
              {language === 'tr' ? 'Yeni kart için N bas' : 'Press N to add a new card'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <DailyNoteCard key={card.id} card={card} date={currentDate} />
            ))}
            {/* Add Card Button */}
            <button
              onClick={handleAddCard}
              className="border-2 border-dashed border-np-border hover:border-np-blue min-h-[150px] flex flex-col items-center justify-center text-np-text-secondary hover:text-np-blue transition-colors"
            >
              <span className="text-2xl mb-2">+</span>
              <span className="text-sm">{t('dailyNotes.newCard')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-np-border bg-np-bg-tertiary px-4 py-1 text-xs text-np-text-secondary flex justify-between">
        <span>{cards.length} {language === 'tr' ? 'kart' : (cards.length !== 1 ? 'cards' : 'card')}</span>
        <span>← → {language === 'tr' ? 'Gezin' : 'Navigate'} | N {language === 'tr' ? 'Yeni' : 'New'} | T {t('common.today')}</span>
      </div>
    </div>
  )
}
