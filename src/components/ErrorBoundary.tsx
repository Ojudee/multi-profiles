import React, { Component, ErrorInfo, ReactNode } from 'react';
import { clearPartnersFromStorage } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = async () => {
    try {
      await clearPartnersFromStorage();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '540px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#f1f5f9' }}>
              Company Partner Profile Generator
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
              An unexpected issue occurred while rendering the application. You can reload the app or restore default partner dossiers.
            </p>
            {this.state.error && (
              <pre style={{
                background: '#090d16',
                color: '#f87171',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '20px',
              }}>
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  background: '#334155',
                  color: '#e2e8f0',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
