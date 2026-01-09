import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="h-screen bg-np-bg-primary flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-np-bg-secondary border border-np-error p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">💥</div>
              <h1 className="text-xl text-np-error font-mono mb-2">
                // Something went wrong
              </h1>
              <p className="text-np-text-secondary text-sm mb-4">
                An unexpected error occurred. Your data is safe in localStorage.
              </p>
              
              {this.state.error && (
                <div className="bg-np-bg-tertiary border border-np-border p-3 mb-4 text-left">
                  <code className="text-xs text-np-text-secondary break-all">
                    {this.state.error.message}
                  </code>
                </div>
              )}
              
              <div className="flex gap-2 justify-center">
                <button
                  onClick={this.handleReset}
                  className="np-btn text-np-green"
                >
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="np-btn text-np-blue"
                >
                  Reload Page
                </button>
              </div>
              
              <p className="text-xs text-np-text-secondary mt-4">
                If this keeps happening, try clearing your browser cache.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
