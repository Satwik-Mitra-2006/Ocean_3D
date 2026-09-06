import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global Error Caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#070d19',
          color: '#f87171',
          padding: '2rem',
          fontFamily: 'monospace',
          minHeight: '100vh',
          boxSizing: 'border-box'
        }}>
          <h1 style={{ fontSize: '1.5rem', color: '#ef4444', marginBottom: '1rem' }}>
            Application Runtime Error Caught
          </h1>
          <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '8px', color: '#fca5a5', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
          </div>
          <pre style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px', color: '#94a3b8', fontSize: '0.85rem', overflowX: 'auto' }}>
            {this.state.errorInfo?.componentStack || this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '0.6rem 1.2rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

