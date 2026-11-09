import type { ReactNode } from 'react';
import { Component } from 'react';

type ErrorBoundaryProps = {
   fallback: (error: Error, retry: () => void) => ReactNode;
   onRetry?: () => void;
   children: ReactNode;
};

type ErrorBoundaryState = { error: Error | undefined };

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
   state: ErrorBoundaryState = { error: undefined };

   static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
      return { error: error instanceof Error ? error : new Error(String(error)) };
   }

   retry = () => {
      this.props.onRetry?.();
      this.setState({ error: undefined });
   };

   render() {
      const { error } = this.state;
      return error === undefined ? this.props.children : this.props.fallback(error, this.retry);
   }
}

export default ErrorBoundary;
