import React, {Component, ReactNode, ErrorInfo} from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by boundary:", error, errorInfo)
    // You can log to error reporting service here
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div
          style={{padding: "20px", background: "#fee", border: "1px solid red"}}
        >
          <h3>⚠️ This section encountered an error</h3>
          <details style={{whiteSpace: "pre-wrap"}}>
            {this.state.error?.message}
          </details>
          <button onClick={this.handleReset}>Retry</button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
