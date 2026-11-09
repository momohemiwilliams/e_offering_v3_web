import React, { Component, type ErrorInfo, type ReactNode } from 'react';

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
        console.error('Uncaught React render error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-svh flex-col items-center justify-center p-6 text-center bg-background text-foreground">
                    <div className="max-w-md space-y-4">
                        <div className="rounded-full bg-destructive/10 text-destructive size-12 mx-auto flex items-center justify-center text-xl font-bold">
                            !
                        </div>
                        <h1 className="text-xl font-semibold">Something went wrong</h1>
                        <p className="text-sm text-muted-foreground">
                            {this.state.error?.message || 'An unexpected client-side error occurred.'}
                        </p>
                        <div className="pt-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                            >
                                Reload page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

