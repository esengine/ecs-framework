import React, { Component, ErrorInfo, ReactNode } from 'react';
import { DomainError } from '../domain/errors';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: (error: Error) => ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.error);
            }

            return <DefaultErrorFallback error={this.state.error} />;
        }

        return this.props.children;
    }
}

function DefaultErrorFallback({ error }: { error: Error }): JSX.Element {
    const message = error instanceof DomainError ? error.getUserMessage() : error.message;

    return (
        <div
            style={{
                padding: '20px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '4px',
                margin: '20px'
            }}
        >
            <h2 style={{ color: '#c00', marginTop: 0 }}>出错了</h2>
            <p>{message}</p>
            <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer' }}>技术详情</summary>
                <pre
                    style={{
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        overflow: 'auto'
                    }}
                >
                    {error.stack}
                </pre>
            </details>
        </div>
    );
}
