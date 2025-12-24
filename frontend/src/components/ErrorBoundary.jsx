import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Generate error report for debugging
 */
function generateErrorReport(error, errorInfo, context = 'App') {
  return {
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    },
    componentStack: errorInfo?.componentStack,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown'
  };
}

/**
 * Log error to console and optionally to external service
 */
function logError(error, errorInfo, context) {
  const report = generateErrorReport(error, errorInfo, context);

  // Always log to console in development
  if (import.meta.env.DEV) {
    console.group(`🚨 ErrorBoundary [${context}]`);
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo?.componentStack);
    console.groupEnd();
  }

  // In production, you would send to error tracking service (Sentry, etc.)
  if (import.meta.env.PROD) {
    // Example: sendToErrorTracking(report);
    console.error('[Error Report]', JSON.stringify(report, null, 2));
  }

  return report;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const context = this.props.context || 'App';
    const report = logError(error, errorInfo, context);

    this.setState({
      errorInfo,
      errorId: `err-${Date.now()}`
    });

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo, report);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  copyErrorReport = () => {
    const report = generateErrorReport(this.state.error, this.state.errorInfo, this.props.context || 'App');
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.handleReset
        });
      }

      // Default error UI
      const isCompact = this.props.compact;

      if (isCompact) {
        return (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-destructive">Erreur de chargement</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ce composant n'a pas pu être affiché.
                </p>
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-foreground">
                Une erreur s'est produite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center">
                L'application a rencontré un problème inattendu.
                Vos données sont sauvegardées localement.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <div className="space-y-2">
                  <div className="bg-muted rounded-lg p-3 text-sm font-mono text-muted-foreground overflow-auto max-h-32">
                    <strong className="text-destructive">{this.state.error.name}:</strong>{' '}
                    {this.state.error.message}
                  </div>
                  {this.state.errorId && (
                    <p className="text-xs text-muted-foreground text-center">
                      ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  Réessayer
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recharger
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={this.handleGoHome}
                  variant="ghost"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Accueil
                </Button>
                {import.meta.env.DEV && (
                  <Button
                    onClick={this.copyErrorReport}
                    variant="ghost"
                    className="flex-1"
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Copier le rapport
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Si le problème persiste, essayez de vider le cache du navigateur.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Page-level error boundary with navigation
 * Use this to wrap individual pages
 */
export function PageErrorBoundary({ children, pageName }) {
  return (
    <ErrorBoundary
      context={`Page:${pageName}`}
      compact={false}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Component-level error boundary (compact)
 * Use this to wrap individual components
 */
export function ComponentErrorBoundary({ children, componentName, fallback }) {
  return (
    <ErrorBoundary
      context={`Component:${componentName}`}
      compact={true}
      fallback={fallback}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
