import React from 'react';
import { KfButton } from '../ui/keyframe';

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
      <div
        role="alert"
        style={{
          padding: 'var(--kf-7) var(--kf-4)',
          textAlign: 'center',
          fontFamily: 'var(--kf-font-ui)',
          color: 'var(--kf-text)',
        }}
      >
        <h2 style={{ marginBottom: 'var(--kf-2)', color: 'var(--kf-text)' }}>
          Something went wrong on this screen
        </h2>
        <p style={{ marginBottom: 'var(--kf-4)', color: 'var(--kf-text-2)' }}>
          Your journal is safe. Reload to continue.
        </p>
        <KfButton variant="primary" onClick={() => window.location.reload()}>
          Reload
        </KfButton>
      </div>
    );
  }
}
