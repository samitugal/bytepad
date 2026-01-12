import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductivityReport } from '../types'

interface ReportState {
  reports: ProductivityReport[]
  isGenerating: boolean
  generationProgress: string
  lastError: string | null

  // Actions
  addReport: (report: ProductivityReport) => void
  deleteReport: (id: string) => void
  setIsGenerating: (value: boolean) => void
  setGenerationProgress: (message: string) => void
  setLastError: (error: string | null) => void
  clearReports: () => void

  // Getters
  getReportById: (id: string) => ProductivityReport | undefined
  getReportsByPeriod: (period: 'daily' | 'weekly') => ProductivityReport[]
  getLatestReport: (period?: 'daily' | 'weekly') => ProductivityReport | undefined
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useReportStore = create<ReportState>()(
  persist(
    (set, get) => ({
      reports: [],
      isGenerating: false,
      generationProgress: '',
      lastError: null,

      addReport: (report) => {
        set((state) => ({
          reports: [
            { ...report, id: report.id || generateId() },
            ...state.reports,
          ].slice(0, 50), // Keep max 50 reports
        }))
      },

      deleteReport: (id) => {
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        }))
      },

      setIsGenerating: (value) => {
        set({ isGenerating: value })
      },

      setGenerationProgress: (message) => {
        set({ generationProgress: message })
      },

      setLastError: (error) => {
        set({ lastError: error })
      },

      clearReports: () => {
        set({ reports: [] })
      },

      getReportById: (id) => {
        return get().reports.find((r) => r.id === id)
      },

      getReportsByPeriod: (period) => {
        return get().reports.filter((r) => r.period === period)
      },

      getLatestReport: (period) => {
        const reports = period
          ? get().reports.filter((r) => r.period === period)
          : get().reports
        return reports[0]
      },
    }),
    {
      name: 'bytepad-reports',
      partialize: (state) => ({
        reports: state.reports,
      }),
    }
  )
)
