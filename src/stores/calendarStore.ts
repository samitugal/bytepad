import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CalendarView = 'month' | 'week' | 'day'

interface CalendarState {
  currentView: CalendarView
  currentDate: Date
  selectedDate: Date | null
  
  // Actions
  setView: (view: CalendarView) => void
  setCurrentDate: (date: Date) => void
  setSelectedDate: (date: Date | null) => void
  goToToday: () => void
  goToPrevious: () => void
  goToNext: () => void
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      currentView: 'month',
      currentDate: new Date(),
      selectedDate: null,

      setView: (view) => set({ currentView: view }),
      
      setCurrentDate: (date) => set({ currentDate: date }),
      
      setSelectedDate: (date) => set({ selectedDate: date }),
      
      goToToday: () => set({ currentDate: new Date(), selectedDate: new Date() }),
      
      goToPrevious: () => {
        const { currentView, currentDate } = get()
        const newDate = new Date(currentDate)
        
        switch (currentView) {
          case 'month':
            newDate.setMonth(newDate.getMonth() - 1)
            break
          case 'week':
            newDate.setDate(newDate.getDate() - 7)
            break
          case 'day':
            newDate.setDate(newDate.getDate() - 1)
            break
        }
        
        set({ currentDate: newDate })
      },
      
      goToNext: () => {
        const { currentView, currentDate } = get()
        const newDate = new Date(currentDate)
        
        switch (currentView) {
          case 'month':
            newDate.setMonth(newDate.getMonth() + 1)
            break
          case 'week':
            newDate.setDate(newDate.getDate() + 7)
            break
          case 'day':
            newDate.setDate(newDate.getDate() + 1)
            break
        }
        
        set({ currentDate: newDate })
      },
    }),
    {
      name: 'myflowspace-calendar',
      partialize: (state) => ({
        currentView: state.currentView,
      }),
    }
  )
)

// Helper functions for calendar calculations
export function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  let startDay = firstDay.getDay()
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  startDay = startDay === 0 ? 6 : startDay - 1
  
  // Add days from previous month to fill the first week
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push(date)
  }
  
  // Add all days of the current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i))
  }
  
  // Add days from next month to complete the grid (6 rows x 7 days = 42)
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i))
  }
  
  return days
}

export function getWeekDays(date: Date): Date[] {
  const days: Date[] = []
  const current = new Date(date)
  
  // Get Monday of the current week
  const dayOfWeek = current.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  current.setDate(current.getDate() + diff)
  
  // Add 7 days starting from Monday
  for (let i = 0; i < 7; i++) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return days
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
}

export function formatWeekRange(date: Date): string {
  const weekDays = getWeekDays(date)
  const start = weekDays[0]
  const end = weekDays[6]
  
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}`
  }
  
  return `${start.getDate()} ${start.toLocaleDateString('tr-TR', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}`
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return d >= s && d <= e
}
