import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Canvas error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-background p-8 text-center">
          <p className="text-lg font-semibold text-text-primary">Graph failed to render</p>
          <p className="max-w-md text-sm text-text-muted">
            {this.state.message || 'An unexpected error occurred in the canvas.'}
          </p>
          <Button onClick={() => this.setState({ hasError: false, message: '' })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
