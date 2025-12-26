'use client';

// Error boundary to catch React errors and show friendly fallback UI

import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console
    console.error('Error Boundary caught an error:', error, errorInfo);

    // In production, you could send this to an error reporting service
    // Example: Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-hole-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-hole-surface border border-hole-border rounded-2xl p-6 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-hole-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-hole-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h2 className="text-xl font-semibold mb-2">
              Something went wrong
            </h2>
            <p className="text-hole-muted mb-6">
              We're sorry, but something unexpected happened. Please try again.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-hole-bg border border-hole-border rounded-lg text-left">
                <p className="text-xs text-hole-muted font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Try Again Button */}
            <button
              onClick={this.handleReset}
              className="w-full bg-hole-accent hover:bg-hole-accent-hover text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Try Again
            </button>

            {/* Reload Page Link */}
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-hole-muted hover:text-white transition-colors"
            >
              Or reload the page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
