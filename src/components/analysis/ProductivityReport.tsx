import { useState } from 'react'
import { useTranslation } from '../../i18n'
import { useReportStore } from '../../stores/reportStore'
import { generateProductivityReport } from '../../services/productivityReportService'
import { ReportSummary } from './ReportSummary'
import { StrengthsWeaknesses } from './StrengthsWeaknesses'
import { AchievementsMissed } from './AchievementsMissed'
import { PersonalizedAdvice } from './PersonalizedAdvice'
import { ADHDInsights } from './ADHDInsights'
import { ReportHistory } from './ReportHistory'
import type { ProductivityReport as ReportType } from '../../types'

interface ProductivityReportProps {
  onClose?: () => void
}

export function ProductivityReport({ onClose }: ProductivityReportProps) {
  const { t } = useTranslation()
  const { isGenerating, generationProgress, lastError, getLatestReport, reports } =
    useReportStore()

  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily')
  const [showHistory, setShowHistory] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)

  const currentReport = selectedReport || getLatestReport(period)

  const handleGenerate = async () => {
    try {
      await generateProductivityReport(period)
      setSelectedReport(null)
    } catch (error) {
      console.error('Report generation failed:', error)
    }
  }

  const handleSelectReport = (report: ReportType) => {
    setSelectedReport(report)
    setShowHistory(false)
  }

  if (showHistory) {
    return (
      <ReportHistory
        reports={reports}
        onSelect={handleSelectReport}
        onBack={() => setShowHistory(false)}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg text-np-text-primary">
            <span className="text-np-purple">{'//'} </span>
            {t('report.title')}
          </h2>
          {onClose && (
            <button onClick={onClose} className="np-btn text-xs">
              {t('common.close')}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="np-btn text-xs"
            disabled={reports.length === 0}
          >
            {t('report.history')} ({reports.length})
          </button>
        </div>
      </div>

      {/* Period Selector & Generate Button */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex border border-np-border">
          <button
            onClick={() => setPeriod('daily')}
            className={`px-4 py-2 text-sm ${
              period === 'daily'
                ? 'bg-np-purple text-white'
                : 'bg-np-bg-secondary text-np-text-secondary hover:text-np-text-primary'
            }`}
          >
            {t('report.daily')}
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-4 py-2 text-sm ${
              period === 'weekly'
                ? 'bg-np-purple text-white'
                : 'bg-np-bg-secondary text-np-text-secondary hover:text-np-text-primary'
            }`}
          >
            {t('report.weekly')}
          </button>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="np-btn bg-np-purple hover:bg-np-purple/80 text-white flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">{'*'}</span>
              {generationProgress || t('report.generating')}
            </>
          ) : (
            <>{'*'} {t('report.generate')}</>
          )}
        </button>
      </div>

      {/* Error */}
      {lastError && (
        <div className="bg-np-error/20 border border-np-error text-np-error px-4 py-3 mb-6">
          {lastError}
        </div>
      )}

      {/* Report Content */}
      {currentReport ? (
        <div className="space-y-6">
          <ReportSummary report={currentReport} />
          <StrengthsWeaknesses report={currentReport} />
          <AchievementsMissed report={currentReport} />
          <PersonalizedAdvice report={currentReport} />
          <ADHDInsights report={currentReport} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-np-text-secondary">
            <div className="text-4xl mb-4">{'*'}</div>
            <div className="text-lg">{t('report.noData')}</div>
            <div className="text-sm mt-2">{t('report.generateFirst')}</div>
          </div>
        </div>
      )}
    </div>
  )
}
