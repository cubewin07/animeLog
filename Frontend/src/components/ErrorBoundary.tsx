import React from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

/** Keeps a crash in one screen from blanking the whole app. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Screen crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8 }}>Something went wrong on this screen</h2>
        <p style={{ marginBottom: 16, color: 'var(--text-2)' }}>Your journal is safe. Reload to continue.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
