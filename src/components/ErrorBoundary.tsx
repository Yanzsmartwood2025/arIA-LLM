import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-red-500 bg-[#111] rounded-xl border border-red-900/30">
          <h2 className="mb-2 text-xl font-bold">Ocurrió un error inesperado</h2>
          <p className="text-sm text-red-400">El módulo falló al cargar. Por favor, intenta de nuevo.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
