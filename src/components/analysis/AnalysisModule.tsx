import { useState, useMemo } from 'react'
import { useHabitStore } from '../../stores/habitStore'
import { useTaskStore } from '../../stores/taskStore'
import { useJournalStore } from '../../stores/journalStore'
import { calculateWeeklyStats, getWeekRange, generateAIInsights, type WeeklyStats } from '../../services/analysisService'
import { useTranslation } from '../../i18n'
import { ProductivityReport } from './ProductivityReport'

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type ViewMode = 'stats' | 'report'

function MiniChart({ data, color, label }: { data: number[]; color: string; label: string }) {
  const max = Math.max(...data.filter(d => d > 0), 5)

  return (
    <div className="flex-1">
      <div className="text-xs text-np-text-secondary mb-2">{label}</div>
      <div className="flex items-end gap-1 h-16">
        {data.map((value, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full ${color} transition-all`}
              style={{ height: value > 0 ? `${(value / max) * 100}%` : '2px', minHeight: '2px' }}
            />
            <span className="text-xs text-np-text-secondary">{DAYS_SHORT[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, color = 'text-np-text-primary' }: {
  title: string
  value: string | number
  subtitle?: string
  color?: string
}) {
  return (
    <div className="bg-np-bg-secondary border border-np-border p-3">
      <div className="text-xs text-np-text-secondary">{title}</div>
      <div className={`text-2xl font-bold ${color} mt-1`}>{value}</div>
      {subtitle && <div className="text-xs text-np-text-secondary mt-1">{subtitle}</div>}
    </div>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-2 bg-np-bg-tertiary rounded-sm overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
    </div>
  )
}

export function AnalysisModule() {
  const { t } = useTranslation()
  const { habits } = useHabitStore()
  const { tasks } = useTaskStore()
  const { entries } = useJournalStore()

  const [viewMode, setViewMode] = useState<ViewMode>('stats')
  const [weekOffset, setWeekOffset] = useState(0)
  const [aiInsights, setAiInsights] = useState<{
    insights: string[]
    recommendations: string[]
    summary: string
  } | null>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)

  const weekRange = useMemo(() => {
    const now = new Date()
    now.setDate(now.getDate() - weekOffset * 7)
    return getWeekRange(now)
  }, [weekOffset])

  const stats: WeeklyStats = useMemo(() => {
    return calculateWeeklyStats(habits, tasks, entries, weekRange)
  }, [habits, tasks, entries, weekRange])

  const handleGenerateAIInsights = async () => {
    setIsLoadingAI(true)
    setAiInsights(null)
    try {
      const result = await generateAIInsights(stats)
      setAiInsights(result)
    } catch (error) {
      console.error('AI Insights error:', error)
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Use AI insights if available, otherwise use default stats
  const displayInsights = aiInsights?.insights || stats.insights
  const displayRecommendations = aiInsights?.recommendations || stats.recommendations

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  // Show ProductivityReport view
  if (viewMode === 'report') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 p-4 pb-0">
          <button
            onClick={() => setViewMode('stats')}
            className="px-4 py-2 text-sm bg-np-bg-secondary text-np-text-secondary hover:text-np-text-primary border border-np-border"
          >
            {t('analysis.weeklyStats')}
          </button>
          <button
            onClick={() => setViewMode('report')}
            className="px-4 py-2 text-sm bg-np-purple text-white"
          >
            {t('report.title')}
          </button>
        </div>
        <ProductivityReport />
      </div>
    )
  }

  // Stats view (viewMode === 'stats')
  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto">
      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setViewMode('stats')}
          className="px-4 py-2 text-sm bg-np-green text-white"
        >
          {t('analysis.weeklyStats')}
        </button>
        <button
          onClick={() => setViewMode('report')}
          className="px-4 py-2 text-sm bg-np-bg-secondary text-np-text-secondary hover:text-np-text-primary border border-np-border"
        >
          {t('report.title')}
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg text-np-text-primary">
            <span className="text-np-green">// </span>{t('analysis.weeklyStats')}
          </h2>
          <p className="text-sm text-np-text-secondary mt-1">
            {formatDateRange(stats.weekStart, stats.weekEnd)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w + 1)} className="np-btn">{t('common.previous')}</button>
          <button onClick={() => setWeekOffset(0)} className="np-btn" disabled={weekOffset === 0}>
            {t('common.today')}
          </button>
          <button
            onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
            className="np-btn"
            disabled={weekOffset === 0}
          >
            {t('common.next')}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard
          title="Habit Completion"
          value={`${Math.round(stats.habits.avgCompletion)}%`}
          subtitle={`${stats.habits.total} habits tracked`}
          color={stats.habits.avgCompletion >= 70 ? 'text-np-green' : stats.habits.avgCompletion >= 40 ? 'text-np-orange' : 'text-np-error'}
        />
        <StatCard
          title="Tasks Completed"
          value={`${stats.tasks.completed}/${stats.tasks.total}`}
          subtitle={`${Math.round(stats.tasks.completionRate)}% completion`}
          color={stats.tasks.completionRate >= 70 ? 'text-np-green' : 'text-np-orange'}
        />
        <StatCard
          title="Avg Mood"
          value={stats.journal.avgMood > 0 ? stats.journal.avgMood.toFixed(1) : '-'}
          subtitle={`${stats.journal.entries}/7 days logged`}
          color={stats.journal.avgMood >= 4 ? 'text-np-green' : stats.journal.avgMood >= 3 ? 'text-np-blue' : 'text-np-orange'}
        />
        <StatCard
          title="Avg Energy"
          value={stats.journal.avgEnergy > 0 ? stats.journal.avgEnergy.toFixed(1) : '-'}
          subtitle="out of 5"
          color={stats.journal.avgEnergy >= 4 ? 'text-np-green' : stats.journal.avgEnergy >= 3 ? 'text-np-blue' : 'text-np-orange'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-np-bg-secondary border border-np-border p-4">
          <MiniChart data={stats.journal.moodTrend} color="bg-np-purple" label="Mood Trend" />
        </div>
        <div className="bg-np-bg-secondary border border-np-border p-4">
          <MiniChart data={stats.journal.energyTrend} color="bg-np-cyan" label="Energy Trend" />
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="bg-np-bg-secondary border border-np-border p-4 mb-6">
        <div className="text-sm text-np-text-primary mb-3">Task Priority Breakdown</div>
        <div className="space-y-2">
          {Object.entries(stats.tasks.byPriority).map(([priority, data]) => (
            <div key={priority} className="flex items-center gap-3">
              <span className={`text-xs font-bold w-8 ${priority === 'P1' ? 'text-np-error' :
                priority === 'P2' ? 'text-np-orange' :
                  priority === 'P3' ? 'text-np-blue' : 'text-np-text-secondary'
                }`}>{priority}</span>
              <div className="flex-1">
                <ProgressBar
                  value={data.completed}
                  max={data.total || 1}
                  color={
                    priority === 'P1' ? 'bg-np-error' :
                      priority === 'P2' ? 'bg-np-orange' :
                        priority === 'P3' ? 'bg-np-blue' : 'bg-np-text-secondary'
                  }
                />
              </div>
              <span className="text-xs text-np-text-secondary w-12 text-right">
                {data.completed}/{data.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights Button & Summary */}
      <div className="bg-np-bg-secondary border border-np-border p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-np-purple">// AI Analysis</div>
          <button
            onClick={handleGenerateAIInsights}
            disabled={isLoadingAI}
            className="np-btn text-xs flex items-center gap-2"
          >
            {isLoadingAI ? (
              <>
                <span className="animate-spin">⚡</span>
                Analyzing...
              </>
            ) : (
              <>
                <span>🤖</span>
                Generate AI Insights
              </>
            )}
          </button>
        </div>
        {aiInsights?.summary && (
          <div className="text-sm text-np-text-primary bg-np-bg-tertiary p-3 border-l-2 border-np-purple">
            {aiInsights.summary}
          </div>
        )}
      </div>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Insights */}
        <div className="bg-np-bg-secondary border border-np-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-np-green">// Insights</span>
            {aiInsights && <span className="text-xs text-np-purple bg-np-purple/20 px-2 py-0.5">AI</span>}
          </div>
          <div className="space-y-2">
            {displayInsights.map((insight, i) => (
              <div key={i} className="text-sm text-np-text-primary flex gap-2">
                <span className="text-np-purple">→</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-np-bg-secondary border border-np-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-np-orange">// Recommendations</span>
            {aiInsights && <span className="text-xs text-np-purple bg-np-purple/20 px-2 py-0.5">AI</span>}
          </div>
          <div className="space-y-2">
            {displayRecommendations.map((rec, i) => (
              <div key={i} className="text-sm text-np-text-primary flex gap-2">
                <span className="text-np-cyan">•</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Streaks */}
      {stats.habits.streaks.length > 0 && (
        <div className="bg-np-bg-secondary border border-np-border p-4">
          <div className="text-sm text-np-orange mb-3">🔥 Active Streaks</div>
          <div className="flex flex-wrap gap-3">
            {stats.habits.streaks.map((streak, i) => (
              <div key={i} className="bg-np-bg-tertiary px-3 py-2 border border-np-border">
                <div className="text-sm text-np-text-primary">{streak.name}</div>
                <div className="text-lg text-np-orange font-bold">{streak.streak} days</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
