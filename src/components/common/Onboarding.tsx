import { useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'

const STEPS = [
  {
    title: 'Welcome to bytepad',
    subtitle: 'Your keyboard-first productivity companion',
    content: (
      <div className="space-y-4">
        <p className="text-np-text-secondary">
          bytepad is designed for focused productivity. It combines notes, tasks, habits,
          journal, and an AI coach - all with a keyboard-first approach.
        </p>
        <div className="bg-np-bg-tertiary p-4 border border-np-border">
          <div className="text-np-green font-mono text-sm mb-2">// Key Features</div>
          <ul className="space-y-2 text-sm text-np-text-secondary">
            <li>~ Notes with markdown support</li>
            <li>~ Tasks with priority & deadlines</li>
            <li>~ Habits with streak tracking</li>
            <li>~ Daily journal with mood tracking</li>
            <li>~ AI coach (FlowBot) for guidance</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: 'Keyboard-First Design',
    subtitle: 'Speed through your workflow',
    content: (
      <div className="space-y-4">
        <p className="text-np-text-secondary">
          Everything is accessible via keyboard shortcuts. Here are the essentials:
        </p>
        <div className="grid gap-2">
          {[
            { key: 'Ctrl+K', desc: 'Command Palette - quick access to everything' },
            { key: 'Ctrl+1-5', desc: 'Switch between modules' },
            { key: 'Ctrl+/', desc: 'Open AI Coach (FlowBot)' },
            { key: 'Ctrl+Shift+F', desc: 'Focus Mode - hide distractions' },
            { key: 'Ctrl+Shift+N', desc: 'Notification Center' },
            { key: 'Escape', desc: 'Close any modal or panel' },
          ].map(({ key, desc }) => (
            <div key={key} className="flex items-center gap-3 bg-np-bg-tertiary p-2 border border-np-border">
              <kbd className="np-kbd text-np-blue">{key}</kbd>
              <span className="text-np-text-secondary text-sm">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    title: 'Your Modules',
    subtitle: 'Everything you need, organized',
    content: (
      <div className="space-y-4">
        <div className="grid gap-3">
          {[
            { icon: '>', name: 'Notes', desc: 'Quick capture with markdown', key: 'Ctrl+1' },
            { icon: '~', name: 'Habits', desc: 'Track daily routines', key: 'Ctrl+2' },
            { icon: '*', name: 'Tasks', desc: 'Prioritized todo lists', key: 'Ctrl+3' },
            { icon: '#', name: 'Journal', desc: 'Daily reflection & mood', key: 'Ctrl+4' },
            { icon: '%', name: 'Analysis', desc: 'Weekly insights & patterns', key: 'Ctrl+5' },
          ].map(({ icon, name, desc, key }) => (
            <div key={name} className="flex items-center gap-3 bg-np-bg-tertiary p-3 border border-np-border">
              <span className="text-np-green font-mono text-lg w-6">{icon}</span>
              <div className="flex-1">
                <div className="text-np-text-primary text-sm font-medium">{name}</div>
                <div className="text-np-text-secondary text-xs">{desc}</div>
              </div>
              <kbd className="np-kbd text-xs">{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    title: 'FlowBot AI Coach',
    subtitle: 'Your productivity assistant',
    content: (
      <div className="space-y-4">
        <p className="text-np-text-secondary">
          FlowBot helps you stay on track and boost your productivity.
          Access it anytime with <kbd className="np-kbd">Ctrl+/</kbd>
        </p>
        <div className="bg-np-bg-tertiary p-4 border border-np-border">
          <div className="text-np-blue font-mono text-sm mb-3">// Quick Commands</div>
          <div className="space-y-2 text-sm">
            {[
              { cmd: '/plan', desc: 'Break down overwhelming tasks' },
              { cmd: '/motivate', desc: 'Get a boost when stuck' },
              { cmd: '/stuck', desc: 'Help with executive dysfunction' },
              { cmd: '/celebrate', desc: 'Acknowledge your wins!' },
            ].map(({ cmd, desc }) => (
              <div key={cmd} className="flex gap-2">
                <span className="text-np-purple font-mono">{cmd}</span>
                <span className="text-np-text-secondary">{desc}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-np-text-secondary text-sm">
          Configure your API key in Settings to enable FlowBot.
        </p>
      </div>
    )
  },
  {
    title: "You're All Set!",
    subtitle: 'Start your productivity journey',
    content: (
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="text-4xl mb-4">F</div>
          <p className="text-np-text-secondary">
            Your workspace is ready. Start by creating a note, adding a task,
            or saying hi to FlowBot!
          </p>
        </div>
        <div className="bg-np-bg-tertiary p-4 border border-np-border">
          <div className="text-np-green font-mono text-sm mb-2">// Pro Tips</div>
          <ul className="space-y-1 text-sm text-np-text-secondary">
            <li>~ Press <kbd className="np-kbd text-xs">Ctrl+K</kbd> to search anything</li>
            <li>~ Your data is stored locally - it's private</li>
            <li>~ Use Focus Mode when you need to concentrate</li>
            <li>~ Check Analysis weekly for insights</li>
          </ul>
        </div>
      </div>
    )
  }
]

export function Onboarding() {
  const { onboardingCompleted, completeOnboarding } = useSettingsStore()
  const [currentStep, setCurrentStep] = useState(0)

  if (onboardingCompleted) return null

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1
  const isFirst = currentStep === 0

  const handleNext = () => {
    if (isLast) {
      completeOnboarding()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-np-bg-primary/95">
      <div className="w-full max-w-lg mx-4">
        {/* Progress */}
        <div className="flex gap-1 mb-4">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded ${
                idx <= currentStep ? 'bg-np-green' : 'bg-np-border'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-np-bg-secondary border border-np-border shadow-xl">
          {/* Header */}
          <div className="p-6 border-b border-np-border">
            <div className="text-np-text-secondary text-xs font-mono mb-1">
              // Step {currentStep + 1} of {STEPS.length}
            </div>
            <h2 className="text-xl text-np-text-primary font-mono">
              {step.title}
            </h2>
            <p className="text-np-text-secondary text-sm mt-1">
              {step.subtitle}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[50vh] overflow-y-auto">
            {step.content}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-np-border bg-np-bg-tertiary flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-np-text-secondary hover:text-np-text-primary text-sm"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="np-btn"
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleNext}
                className="np-btn text-np-green"
              >
                {isLast ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="text-center mt-4 text-np-text-secondary text-xs">
          Press <kbd className="np-kbd">Enter</kbd> to continue or <kbd className="np-kbd">Escape</kbd> to skip
        </div>
      </div>
    </div>
  )
}
