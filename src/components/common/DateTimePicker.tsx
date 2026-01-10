import { useState, useRef, useEffect } from 'react'

interface DateTimePickerProps {
  value: string // YYYY-MM-DD or YYYY-MM-DDTHH:mm format
  onChange: (value: string) => void
  type?: 'date' | 'time' | 'datetime'
  placeholder?: string
  className?: string
}

export function DateTimePicker({ 
  value, 
  onChange, 
  type = 'date',
  placeholder,
  className = ''
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState({ hours: 9, minutes: 0 })
  const [viewMonth, setViewMonth] = useState(new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse initial value
  useEffect(() => {
    if (value) {
      if (type === 'time') {
        const [h, m] = value.split(':').map(Number)
        setSelectedTime({ hours: h || 9, minutes: m || 0 })
      } else {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          setSelectedDate(date)
          setViewMonth(date)
          if (type === 'datetime' && value.includes('T')) {
            const timePart = value.split('T')[1]
            if (timePart) {
              const [h, m] = timePart.split(':').map(Number)
              setSelectedTime({ hours: h || 9, minutes: m || 0 })
            }
          }
        }
      }
    }
  }, [value, type])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDisplayValue = () => {
    if (type === 'time') {
      return `${selectedTime.hours.toString().padStart(2, '0')}:${selectedTime.minutes.toString().padStart(2, '0')}`
    }
    if (!selectedDate) return ''
    const dateStr = selectedDate.toLocaleDateString('tr-TR')
    if (type === 'datetime') {
      return `${dateStr} ${selectedTime.hours.toString().padStart(2, '0')}:${selectedTime.minutes.toString().padStart(2, '0')}`
    }
    return dateStr
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)
    setSelectedDate(newDate)
    
    if (type === 'date') {
      onChange(newDate.toISOString().split('T')[0])
      setIsOpen(false)
    } else if (type === 'datetime') {
      const dateStr = newDate.toISOString().split('T')[0]
      const timeStr = `${selectedTime.hours.toString().padStart(2, '0')}:${selectedTime.minutes.toString().padStart(2, '0')}`
      onChange(`${dateStr}T${timeStr}`)
    }
  }

  const handleTimeChange = (hours: number, minutes: number) => {
    setSelectedTime({ hours, minutes })
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    
    if (type === 'time') {
      onChange(timeStr)
    } else if (type === 'datetime' && selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0]
      onChange(`${dateStr}T${timeStr}`)
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return day === 0 ? 6 : day - 1 // Monday = 0
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(viewMonth)
    const firstDay = getFirstDayOfMonth(viewMonth)
    const days = []
    const today = new Date()
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-7 h-7" />)
    }
    
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === viewMonth.getMonth() &&
        selectedDate.getFullYear() === viewMonth.getFullYear()
      const isToday = 
        today.getDate() === day && 
        today.getMonth() === viewMonth.getMonth() &&
        today.getFullYear() === viewMonth.getFullYear()
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`w-7 h-7 text-xs font-mono rounded transition-colors
            ${isSelected 
              ? 'bg-np-blue text-white' 
              : isToday 
                ? 'bg-np-bg-tertiary text-np-cyan border border-np-cyan' 
                : 'text-np-text-primary hover:bg-np-bg-hover'
            }`}
        >
          {day}
        </button>
      )
    }
    
    return days
  }

  const renderTimePicker = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const minutes = [0, 15, 30, 45]
    
    return (
      <div className="flex gap-2 p-2 border-t border-np-border">
        <div className="flex-1">
          <div className="text-xs text-np-text-secondary mb-1">Hour</div>
          <div className="h-32 overflow-y-auto scrollbar-thin">
            {hours.map(h => (
              <button
                key={h}
                onClick={() => handleTimeChange(h, selectedTime.minutes)}
                className={`w-full px-2 py-1 text-xs font-mono text-left transition-colors
                  ${selectedTime.hours === h 
                    ? 'bg-np-blue text-white' 
                    : 'text-np-text-primary hover:bg-np-bg-hover'
                  }`}
              >
                {h.toString().padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs text-np-text-secondary mb-1">Min</div>
          <div className="h-32 overflow-y-auto scrollbar-thin">
            {minutes.map(m => (
              <button
                key={m}
                onClick={() => handleTimeChange(selectedTime.hours, m)}
                className={`w-full px-2 py-1 text-xs font-mono text-left transition-colors
                  ${selectedTime.minutes === m 
                    ? 'bg-np-blue text-white' 
                    : 'text-np-text-primary hover:bg-np-bg-hover'
                  }`}
              >
                {m.toString().padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="np-input text-left flex items-center gap-2 min-w-[120px]"
      >
        <span className={value ? 'text-np-text-primary' : 'text-np-text-secondary'}>
          {formatDisplayValue() || placeholder || (type === 'time' ? 'Select time' : 'Select date')}
        </span>
        <span className="ml-auto text-np-text-secondary">
          {type === 'time' ? '⏰' : '📅'}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-np-bg-secondary border border-np-border shadow-lg z-50 min-w-[220px]">
          {/* Calendar for date/datetime */}
          {type !== 'time' && (
            <>
              {/* Month navigation */}
              <div className="flex items-center justify-between p-2 border-b border-np-border">
                <button
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))}
                  className="text-np-text-secondary hover:text-np-text-primary px-2"
                >
                  ◀
                </button>
                <span className="text-np-text-primary text-sm font-mono">
                  {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </span>
                <button
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))}
                  className="text-np-text-secondary hover:text-np-text-primary px-2"
                >
                  ▶
                </button>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 p-2 border-b border-np-border">
                {dayNames.map(day => (
                  <div key={day} className="w-7 h-5 text-xs text-np-text-secondary text-center font-mono">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 p-2">
                {renderCalendar()}
              </div>
            </>
          )}

          {/* Time picker for time/datetime */}
          {(type === 'time' || type === 'datetime') && renderTimePicker()}

          {/* Actions */}
          <div className="flex justify-between p-2 border-t border-np-border">
            <button
              onClick={() => {
                setSelectedDate(null)
                setSelectedTime({ hours: 9, minutes: 0 })
                onChange('')
                setIsOpen(false)
              }}
              className="text-xs text-np-text-secondary hover:text-np-error"
            >
              Clear
            </button>
            {type === 'datetime' && (
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-np-green hover:text-np-cyan"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
