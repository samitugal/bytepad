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
import { useTranslation } from '../../i18n'
import type { Task } from '../../types'

const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKDAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

const PRIORITY_COLORS: Record<string, string> = {
  P1: 'bg-np-error',
  P2: 'bg-np-warning', 
  P3: 'bg-np-blue',
  P4: 'bg-np-text-secondary'
}

export function CalendarModule() {
  const { t, language } = useTranslation()
  const PRIORITY_LABELS: Record<string, string> = {
    P1: t('calendar.priority.P1'),
    P2: t('calendar.priority.P2'),
    P3: t('calendar.priority.P3'),
    P4: t('calendar.priority.P4')
  }

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
  const toggleTask = useTaskStore((state) => state.toggleTask)
  const deleteTask = useTaskStore((state) => state.deleteTask)

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'P1' | 'P2' | 'P3' | 'P4'>('P3')
  const [newTaskEndDate, setNewTaskEndDate] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Handle task click (show detail popup)
  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedTask(task)
  }

  // Handle task complete toggle
  const handleToggleTask = () => {
    if (selectedTask) {
      toggleTask(selectedTask.id)
      setSelectedTask(null)
    }
  }

  // Handle task delete
  const handleDeleteTask = () => {
    if (selectedTask && confirm(t('calendar.deleteConfirm', { title: selectedTask.title }))) {
      deleteTask(selectedTask.id)
      setSelectedTask(null)
    }
  }

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Handle Escape to close modals
    if (e.key === 'Escape') {
      setSelectedTask(null)
      setShowTaskForm(false)
      return
    }

    // Skip other shortcuts if user is typing in an input or modal is open
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement ||
      showTaskForm ||
      selectedTask
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
      case 'n': {
        e.preventDefault()
        // Open task form for current date or selected date
        const targetDate = selectedDate || currentDate
        setSelectedDate(targetDate)
        setShowTaskForm(true)
        break
      }
    }
  }, [showTaskForm, selectedTask, goToPrevious, goToNext, goToToday, setView, selectedDate, currentDate, setSelectedDate])

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
            {t('calendar.today')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation */}
          <button
            onClick={goToPrevious}
            className="np-btn px-2"
            title={t('common.previous')}
          >
            ←
          </button>
          <button
            onClick={goToNext}
            className="np-btn px-2"
            title={t('common.next')}
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
                title={`${t(`calendar.${view}`)} (${view[0].toUpperCase()})`}
              >
                {t(`calendar.${view}`)}
              </button>
            ))}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="text-[10px] text-np-text-secondary ml-2 hidden lg:block" title={t('calendar.keyboardHints')}>
            ←→ T M W D N
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
            onTaskClick={handleTaskClick}
          />
        )}
        {currentView === 'week' && (
          <WeekView
            currentDate={currentDate}
            selectedDate={selectedDate}
            getTasksForDate={getTasksForDate}
            onDateClick={handleDateClick}
            onTaskClick={handleTaskClick}
          />
        )}
        {currentView === 'day' && (
          <DayView
            currentDate={currentDate}
            tasks={getTasksForDate(currentDate)}
            onDateClick={() => handleDateClick(currentDate)}
            onTaskClick={handleTaskClick}
          />
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 right-4 text-[10px] text-np-text-secondary opacity-60">
        {t('calendar.keyboardHints')}
      </div>

      {/* Task Creation Modal */}
      {showTaskForm && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-np-bg-secondary border border-np-border p-4 w-96">
            <h3 className="text-np-text-primary font-semibold mb-4">
              {t('calendar.newTask')} - {selectedDate.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}
            </h3>

            <div className="space-y-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={t('calendar.taskTitle')}
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
                  <option value="P1">P1 - {t('calendar.priority.P1')}</option>
                  <option value="P2">P2 - {t('calendar.priority.P2')}</option>
                  <option value="P3">P3 - {t('calendar.priority.P3')}</option>
                  <option value="P4">P4 - {t('calendar.priority.P4')}</option>
                </select>

                <input
                  type="date"
                  value={newTaskEndDate}
                  onChange={(e) => setNewTaskEndDate(e.target.value)}
                  className="flex-1 bg-np-bg-primary border border-np-border text-np-text-primary
                             px-2 py-2 focus:outline-none focus:border-np-blue"
                  placeholder={t('calendar.endDate')}
                  min={selectedDate.toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowTaskForm(false)}
                className="np-btn"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreateTask}
                className="np-btn bg-np-blue text-white"
                disabled={!newTaskTitle.trim()}
              >
                {t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Popup */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-np-bg-secondary border border-np-border p-4 w-96 max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className={`text-np-text-primary font-semibold flex-1 ${selectedTask.completed ? 'line-through opacity-60' : ''}`}>
                {selectedTask.title}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded ${PRIORITY_COLORS[selectedTask.priority]} text-white ml-2`}>
                {selectedTask.priority} - {PRIORITY_LABELS[selectedTask.priority]}
              </span>
            </div>

            {selectedTask.description && (
              <p className="text-sm text-np-text-secondary mb-3">
                {selectedTask.description}
              </p>
            )}

            <div className="text-xs text-np-text-secondary space-y-1 mb-4">
              {/* Time block info */}
              {(selectedTask.startTime || selectedTask.deadlineTime) && (
                <div>
                  🕐 {t('common.time')}: {selectedTask.startTime || '--:--'} - {selectedTask.deadlineTime || '--:--'}
                </div>
              )}
              {/* Date info */}
              {selectedTask.deadline && (
                <div>
                  📅 {t('common.date')}: {new Date(selectedTask.deadline).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}
                </div>
              )}
              <div>
                {selectedTask.completed ? `✅ ${t('common.completed')}` : `⏳ ${t('common.pending')}`}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleDeleteTask}
                className="np-btn text-np-error hover:bg-np-error/20"
              >
                {t('common.delete')}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="np-btn"
                >
                  {t('common.close')}
                </button>
                <button
                  onClick={handleToggleTask}
                  className={`np-btn ${selectedTask.completed ? 'bg-np-warning' : 'bg-np-green'} text-white`}
                >
                  {selectedTask.completed ? t('common.undo') : t('common.done')}
                </button>
              </div>
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
  onTaskClick: (task: Task, e: React.MouseEvent) => void
}

function MonthView({ currentDate, selectedDate, getTasksForDate, onDateClick, onTaskClick }: MonthViewProps) {
  const { t, language } = useTranslation()
  const WEEKDAYS = language === 'tr' ? WEEKDAYS_TR : WEEKDAYS_EN
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
                    onClick={(e) => onTaskClick(task, e)}
                    className={`
                      text-[10px] px-1 py-0.5 truncate rounded-sm cursor-pointer
                      ${PRIORITY_COLORS[task.priority]} text-white
                      ${task.completed ? 'opacity-50 line-through' : ''}
                      hover:ring-1 hover:ring-white/50
                    `}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {tasks.length > 3 && (
                  <div className="text-[10px] text-np-text-secondary">
                    +{tasks.length - 3} {t('common.more')}
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

// Helper to parse time string to hour
function parseTimeToHour(time: string | undefined): number | null {
  if (!time) return null
  const parts = time.split(':')
  return parseInt(parts[0])
}

// Helper to check if a task spans a specific hour
function taskSpansHour(task: Task, hour: number): { spans: boolean; isStart: boolean; isEnd: boolean; duration: number } {
  const startHour = parseTimeToHour(task.startTime)
  const endHour = parseTimeToHour(task.deadlineTime)

  // If no start time, use deadlineTime as single hour
  if (startHour === null && endHour !== null) {
    return {
      spans: endHour === hour,
      isStart: true,
      isEnd: true,
      duration: 1
    }
  }

  // If only start time, show at that hour
  if (startHour !== null && endHour === null) {
    return {
      spans: startHour === hour,
      isStart: true,
      isEnd: true,
      duration: 1
    }
  }

  // If both start and end time
  if (startHour !== null && endHour !== null) {
    const duration = endHour - startHour
    return {
      spans: hour >= startHour && hour < endHour,
      isStart: hour === startHour,
      isEnd: hour === endHour - 1,
      duration: Math.max(1, duration)
    }
  }

  return { spans: false, isStart: false, isEnd: false, duration: 0 }
}

// Week View Component
interface WeekViewProps {
  currentDate: Date
  selectedDate: Date | null
  getTasksForDate: (date: Date) => Task[]
  onDateClick: (date: Date) => void
  onTaskClick: (task: Task, e: React.MouseEvent) => void
}

function WeekView({ currentDate, selectedDate, getTasksForDate, onDateClick, onTaskClick }: WeekViewProps) {
  const { language } = useTranslation()
  const WEEKDAYS = language === 'tr' ? WEEKDAYS_TR : WEEKDAYS_EN
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
              // Get tasks that start at this hour OR span this hour (for time blocks)
              const allDayTasks = getTasksForDate(date).filter(t => t.allDay && hour === 8)
              const timedTasks = getTasksForDate(date).filter(t => {
                if (t.allDay) return false
                const { spans, isStart } = taskSpansHour(t, hour)
                // Only show task at its start hour (to avoid duplicates)
                return spans && isStart
              })
              const tasks = [...allDayTasks, ...timedTasks]

              return (
                <div
                  key={i}
                  onClick={() => onDateClick(date)}
                  className={`
                    border-r border-np-border p-0.5 cursor-pointer relative
                    hover:bg-np-bg-tertiary
                    ${isWeekend(date) ? 'bg-np-bg-primary/30' : ''}
                  `}
                >
                  {tasks.map((task) => {
                    const { duration } = taskSpansHour(task, hour)
                    const heightMultiplier = Math.min(duration, 4) // Cap at 4 hours for display
                    const showDuration = duration > 1

                    return (
                      <div
                        key={task.id}
                        onClick={(e) => onTaskClick(task, e)}
                        className={`
                          text-[10px] px-1 py-0.5 mb-0.5 truncate rounded-sm cursor-pointer
                          ${PRIORITY_COLORS[task.priority]} text-white
                          ${task.completed ? 'opacity-50 line-through' : ''}
                          hover:ring-1 hover:ring-white/50
                        `}
                        style={showDuration ? {
                          minHeight: `${heightMultiplier * 56}px`,
                          position: 'relative',
                          zIndex: 5
                        } : undefined}
                        title={`${task.title}${task.startTime ? ` (${task.startTime}` : ''}${task.deadlineTime ? ` - ${task.deadlineTime})` : task.startTime ? ')' : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          {task.startTime && <span className="opacity-75">{task.startTime}</span>}
                          {task.deadlineTime && task.startTime && <span className="opacity-75">-{task.deadlineTime}</span>}
                        </div>
                        <div className="truncate">{task.title}</div>
                      </div>
                    )
                  })}
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
  onTaskClick: (task: Task, e: React.MouseEvent) => void
}

function DayView({ tasks, onDateClick, onTaskClick }: DayViewProps) {
  const { t } = useTranslation()
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const allDayTasks = tasks.filter(t => t.allDay)
  // Include tasks that have either startTime or deadlineTime (or both)
  const timedTasks = tasks.filter(t => !t.allDay && (t.startTime || t.deadlineTime))

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* All-day tasks section */}
      {allDayTasks.length > 0 && (
        <div className="border-b border-np-border p-2 bg-np-bg-primary">
          <div className="text-xs text-np-text-secondary mb-1">{t('common.allDay')}</div>
          <div className="space-y-1">
            {allDayTasks.map((task) => (
              <div
                key={task.id}
                onClick={(e) => onTaskClick(task, e)}
                className={`
                  text-sm px-2 py-1 rounded cursor-pointer
                  ${PRIORITY_COLORS[task.priority]} text-white
                  ${task.completed ? 'opacity-50 line-through' : ''}
                  hover:ring-1 hover:ring-white/50
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
          // Only show tasks at their START hour (to avoid duplicates)
          const hourTasks = timedTasks.filter(t => {
            const { spans, isStart } = taskSpansHour(t, hour)
            return spans && isStart
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
              <div className="flex-1 p-1 relative">
                {hourTasks.map((task) => {
                  const { duration } = taskSpansHour(task, hour)
                  const heightMultiplier = Math.min(duration, 6) // Cap at 6 hours for display
                  const showDuration = duration > 1

                  return (
                    <div
                      key={task.id}
                      onClick={(e) => onTaskClick(task, e)}
                      className={`
                        text-sm px-2 py-1 mb-1 rounded cursor-pointer
                        ${PRIORITY_COLORS[task.priority]} text-white
                        ${task.completed ? 'opacity-50 line-through' : ''}
                        hover:ring-1 hover:ring-white/50
                      `}
                      style={showDuration ? {
                        minHeight: `${heightMultiplier * 56}px`,
                        position: 'relative',
                        zIndex: 5
                      } : undefined}
                    >
                      <div className="flex items-center gap-2 opacity-75 text-xs">
                        {task.startTime && <span>{task.startTime}</span>}
                        {task.startTime && task.deadlineTime && <span>-</span>}
                        {task.deadlineTime && <span>{task.deadlineTime}</span>}
                      </div>
                      <div>{task.title}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarModule
