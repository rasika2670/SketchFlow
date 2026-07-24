import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-sf-deep flex items-center justify-center p-sf-8">
          <div className="text-center max-w-md">
            <div className="mb-sf-6 flex justify-center">
              <div className="p-sf-4 rounded-full bg-error/10">
                <AlertTriangle size={40} className="text-error" />
              </div>
            </div>
            <h1 className="text-sf-2xl font-bold text-slate-50 mb-sf-3">
              Something went wrong
            </h1>
            <p className="text-sf-base text-slate-400 mb-sf-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <pre className="text-sf-xs text-slate-500 bg-slate-800 rounded-sf-md p-sf-3 mb-sf-6 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleRetry}
              className="sf-btn-primary"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
