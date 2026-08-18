import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error Boundary Exception:", error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <div className="p-4 rounded-2xl border border-border bg-card shadow-lg max-w-md w-full space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground">
                Something went wrong
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An unexpected UI rendering error occurred. This often happens if the app was updated while your browser tab was open.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-2.5 rounded-lg bg-muted/60 border border-border text-[11px] font-mono text-rose-400 truncate text-left select-all">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reload Page to Update
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
