import { useState, useEffect, useCallback } from 'react'
import {
  useCalendarStore,
  getMonthDays,
  getWeekDays,
  isSameDay,
  isToday,
  isWeekend,
  formatMonthYear,
  formatWeekRange,
  isDateInRange
} from '../../stores/calendarStore'
import { useTaskStore } from '../../stores/taskStore'
import type { Task } from '../../types'

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

const PRIORITY_COLORS: Record<string, string> = {
  P1: 'bg-np-error',
  P2: 'bg-np-warning', 
  P3: 'bg-np-blue',
  P4: 'bg-np-text-secondary'
}

export function CalendarModule() {
  const { 
    currentView, 
    currentDate, 
    selectedDate,
    setView, 
    setSelectedDate,
    goToToday,
    goToPrevious,
    goToNext
  } = useCalendarStore()
  
  const tasks = useTaskStore((state) => state.tasks)
  const addTask = useTaskStore((state) => state.addTask)
  
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'P1' | 'P2' | 'P3' | 'P4'>('P3')
  const [newTaskEndDate, setNewTaskEndDate] = useState<string>('')

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if user is typing in an input or modal is open
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement ||
      showTaskForm
    ) {
      return
    }

    switch (e.key.toLowerCase()) {
      case 'arrowleft':
        e.preventDefault()
        goToPrevious()
        break
      case 'arrowright':
        e.preventDefault()
        goToNext()
        break
      case 't':
        e.preventDefault()
        goToToday()
        break
      case 'm':
        e.preventDefault()
        setView('month')
        break
      case 'w':
        e.preventDefault()
        setView('week')
        break
      case 'd':
        e.preventDefault()
        setView('day')
        break
      case 'n':
        e.preventDefault()
        // Open task form for current date or selected date
        const targetDate = selectedDate || currentDate
        setSelectedDate(targetDate)
        setShowTaskForm(true)
        break
    }
  }, [showTaskForm, goToPrevious, goToNext, goToToday, setView, selectedDate, currentDate, setSelectedDate])

  // Register keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => {
      if (!task.deadline) return false
      
      const taskStart = new Date(task.deadline)
      const taskEnd = task.endDate ? new Date(task.endDate) : taskStart
      
      return isDateInRange(date, taskStart, taskEnd)
    })
  }

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowTaskForm(true)
    setNewTaskEndDate('')
  }

  // Handle task creation
  const handleCreateTask = () => {
    if (!newTaskTitle.trim() || !selectedDate) return

    addTask({
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      deadline: selectedDate,
      endDate: newTaskEndDate ? new Date(newTaskEndDate) : undefined,
      allDay: true
    })

    setNewTaskTitle('')
    setNewTaskPriority('P3')
    setNewTaskEndDate('')
    setShowTaskForm(false)
  }

  // Render header with title
  const renderTitle = () => {
    switch (currentView) {
      case 'month':
        return formatMonthYear(currentDate)
      case 'week':
        return formatWeekRange(currentDate)
      case 'day':
        return currentDate.toLocaleDateString('tr-TR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })
    }
  }

  return (
    <div className="h-full flex flex-col bg-np-bg-secondary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-np-border">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-np-text-primary">
            {renderTitle()}
          </h2>
          <button
            onClick={goToToday}
            className="np-btn text-xs"
          >
            Bugün
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation */}
          <button
            onClick={goToPrevious}
            className="np-btn px-2"
            title="Önceki"
          >
            ←
          </button>
          <button
            onClick={goToNext}
            className="np-btn px-2"
            title="Sonraki"
          >
            →
          </button>

          {/* View Switcher */}
          <div className="flex border border-np-border ml-4">
            {(['month', 'week', 'day'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setView(view)}
                className={`px-3 py-1 text-xs ${
                  currentView === view
                    ? 'bg-np-blue text-white'
                    : 'bg-np-bg-primary text-np-text-secondary hover:bg-np-bg-tertiary'
                }`}
                title={`${view === 'month' ? 'Ay (M)' : view === 'week' ? 'Hafta (W)' : 'Gün (D)'}`}
              >
                {view === 'month' ? 'Ay' : view === 'week' ? 'Hafta' : 'Gün'}
              </button>
            ))}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="text-[10px] text-np-text-secondary ml-2 hidden lg:block" title="Klavye kısayolları: ←/→ gezinti, T bugün, M/W/D görünüm, N yeni task">
            ⌨ ←→ T M W D N
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto p-4">
        {currentView === 'month' && (
          <MonthView 
            currentDate={currentDate}
            selectedDate={selectedDate}
            getTasksForDate={getTasksForDate}
            onDateClick={handleDateClick}
          />
        )}
        {currentView === 'week' && (
          <WeekView 
            currentDate={currentDate}
            selectedDate={selectedDate}
            getTasksForDate={getTasksForDate}
            onDateClick={handleDateClick}
          />
        )}
        {currentView === 'day' && (
          <DayView 
            currentDate={currentDate}
            tasks={getTasksForDate(currentDate)}
            onDateClick={() => handleDateClick(currentDate)}
          />
        )}
      </div>

      {/* Task Creation Modal */}
      {showTaskForm && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-np-bg-secondary border border-np-border p-4 w-96">
            <h3 className="text-np-text-primary font-semibold mb-4">
              Yeni Task - {selectedDate.toLocaleDateString('tr-TR')}
            </h3>
            
            <div className="space-y-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task başlığı..."
                className="w-full bg-np-bg-primary border border-np-border text-np-text-primary 
                           px-3 py-2 focus:outline-none focus:border-np-blue"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
              />

              <div className="flex gap-2">
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as 'P1' | 'P2' | 'P3' | 'P4')}
                  className="bg-np-bg-primary border border-np-border text-np-text-primary 
                             px-2 py-2 focus:outline-none focus:border-np-blue"
                >
                  <option value="P1">P1 - Kritik</option>
                  <option value="P2">P2 - Yüksek</option>
                  <option value="P3">P3 - Normal</option>
                  <option value="P4">P4 - Düşük</option>
                </select>

                <input
                  type="date"
                  value={newTaskEndDate}
                  onChange={(e) => setNewTaskEndDate(e.target.value)}
                  className="flex-1 bg-np-bg-primary border border-np-border text-np-text-primary 
                             px-2 py-2 focus:outline-none focus:border-np-blue"
                  placeholder="Bitiş tarihi (opsiyonel)"
                  min={selectedDate.toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowTaskForm(false)}
                className="np-btn"
              >
                İptal
              </button>
              <button
                onClick={handleCreateTask}
                className="np-btn bg-np-blue text-white"
                disabled={!newTaskTitle.trim()}
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Month View Component
interface MonthViewProps {
  currentDate: Date
  selectedDate: Date | null
  getTasksForDate: (date: Date) => Task[]
  onDateClick: (date: Date) => void
}

function MonthView({ currentDate, selectedDate, getTasksForDate, onDateClick }: MonthViewProps) {
  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth())

  return (
    <div className="h-full flex flex-col">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-np-border">
        {WEEKDAYS.map((day, i) => (
          <div 
            key={day} 
            className={`p-2 text-center text-xs font-semibold ${
              i >= 5 ? 'text-np-text-secondary' : 'text-np-text-primary'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentDate.getMonth()
          const tasks = getTasksForDate(date)
          
          return (
            <div
              key={index}
              onClick={() => onDateClick(date)}
              className={`
                border-b border-r border-np-border p-1 min-h-[80px] cursor-pointer
                transition-colors hover:bg-np-bg-tertiary
                ${!isCurrentMonth ? 'bg-np-bg-primary/50' : ''}
                ${isWeekend(date) ? 'bg-np-bg-primary/30' : ''}
                ${isToday(date) ? 'ring-2 ring-inset ring-np-blue' : ''}
                ${selectedDate && isSameDay(date, selectedDate) ? 'bg-np-blue/20' : ''}
              `}
            >
              <div className={`
                text-xs font-medium mb-1
                ${!isCurrentMonth ? 'text-np-text-secondary/50' : ''}
                ${isToday(date) ? 'text-np-blue font-bold' : 'text-np-text-primary'}
              `}>
                {date.getDate()}
              </div>
              
              {/* Task Pills */}
              <div className="space-y-0.5 overflow-hidden">
                {tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={`
                      text-[10px] px-1 py-0.5 truncate rounded-sm
                      ${PRIORITY_COLORS[task.priority]} text-white
                      ${task.completed ? 'opacity-50 line-through' : ''}
                    `}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {tasks.length > 3 && (
                  <div className="text-[10px] text-np-text-secondary">
                    +{tasks.length - 3} daha
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Week View Component
interface WeekViewProps {
  currentDate: Date
  selectedDate: Date | null
  getTasksForDate: (date: Date) => Task[]
  onDateClick: (date: Date) => void
}

function WeekView({ currentDate, selectedDate, getTasksForDate, onDateClick }: WeekViewProps) {
  const days = getWeekDays(currentDate)
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Header with dates */}
      <div className="grid grid-cols-8 border-b border-np-border sticky top-0 bg-np-bg-secondary z-10">
        <div className="p-2 border-r border-np-border" /> {/* Empty corner */}
        {days.map((date, i) => (
          <div 
            key={i}
            onClick={() => onDateClick(date)}
            className={`
              p-2 text-center border-r border-np-border cursor-pointer
              hover:bg-np-bg-tertiary
              ${isToday(date) ? 'bg-np-blue/20' : ''}
              ${selectedDate && isSameDay(date, selectedDate) ? 'bg-np-blue/30' : ''}
            `}
          >
            <div className={`text-xs ${isWeekend(date) ? 'text-np-text-secondary' : 'text-np-text-primary'}`}>
              {WEEKDAYS[i]}
            </div>
            <div className={`text-lg font-semibold ${isToday(date) ? 'text-np-blue' : 'text-np-text-primary'}`}>
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="flex-1">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-np-border min-h-[60px]">
            <div className="p-1 text-xs text-np-text-secondary border-r border-np-border text-right pr-2">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {days.map((date, i) => {
              const tasks = getTasksForDate(date).filter(t => {
                if (t.allDay) return hour === 8 // Show all-day tasks at 8am
                if (t.deadlineTime) {
                  const taskHour = parseInt(t.deadlineTime.split(':')[0])
                  return taskHour === hour
                }
                return false
              })

              return (
                <div 
                  key={i}
                  onClick={() => onDateClick(date)}
                  className={`
                    border-r border-np-border p-0.5 cursor-pointer
                    hover:bg-np-bg-tertiary
                    ${isWeekend(date) ? 'bg-np-bg-primary/30' : ''}
                  `}
                >
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`
                        text-[10px] px-1 py-0.5 mb-0.5 truncate rounded-sm
                        ${PRIORITY_COLORS[task.priority]} text-white
                        ${task.completed ? 'opacity-50 line-through' : ''}
                      `}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// Day View Component
interface DayViewProps {
  currentDate: Date
  tasks: Task[]
  onDateClick: () => void
}

function DayView({ tasks, onDateClick }: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const allDayTasks = tasks.filter(t => t.allDay)
  const timedTasks = tasks.filter(t => !t.allDay && t.deadlineTime)

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* All-day tasks section */}
      {allDayTasks.length > 0 && (
        <div className="border-b border-np-border p-2 bg-np-bg-primary">
          <div className="text-xs text-np-text-secondary mb-1">Tüm gün</div>
          <div className="space-y-1">
            {allDayTasks.map((task) => (
              <div
                key={task.id}
                className={`
                  text-sm px-2 py-1 rounded
                  ${PRIORITY_COLORS[task.priority]} text-white
                  ${task.completed ? 'opacity-50 line-through' : ''}
                `}
              >
                {task.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly grid */}
      <div className="flex-1">
        {hours.map((hour) => {
          const hourTasks = timedTasks.filter(t => {
            if (t.deadlineTime) {
              const taskHour = parseInt(t.deadlineTime.split(':')[0])
              return taskHour === hour
            }
            return false
          })

          return (
            <div 
              key={hour} 
              onClick={onDateClick}
              className="flex border-b border-np-border min-h-[60px] cursor-pointer hover:bg-np-bg-tertiary"
            >
              <div className="w-16 p-2 text-xs text-np-text-secondary border-r border-np-border text-right">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 p-1">
                {hourTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`
                      text-sm px-2 py-1 mb-1 rounded
                      ${PRIORITY_COLORS[task.priority]} text-white
                      ${task.completed ? 'opacity-50 line-through' : ''}
                    `}
                  >
                    {task.deadlineTime && (
                      <span className="opacity-75 mr-2">{task.deadlineTime}</span>
                    )}
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarModule
