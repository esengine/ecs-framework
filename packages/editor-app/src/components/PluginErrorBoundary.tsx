import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { PluginError } from '../domain/errors';

interface PluginErrorBoundaryProps {
    pluginId: string;
    pluginName: string;
    children: React.ReactNode;
    onPluginError?: (pluginId: string, error: Error) => void;
}

export function PluginErrorBoundary({
    pluginId,
    pluginName,
    children,
    onPluginError
}: PluginErrorBoundaryProps): JSX.Element {
    const handleError = (error: Error) => {
        onPluginError?.(pluginId, error);
    };

    const renderFallback = (error: Error) => {
        const pluginError =
            error instanceof PluginError ? error : new PluginError(error.message, pluginId, pluginName, 'execute', error);

        return (
            <div
                style={{
                    padding: '16px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '4px',
                    margin: '10px'
                }}
            >
                <h3 style={{ margin: '0 0 8px 0', color: '#856404' }}>插件错误</h3>
                <p style={{ margin: '0 0 8px 0' }}>{pluginError.getUserMessage()}</p>
                <small style={{ color: '#666' }}>插件ID: {pluginId}</small>
            </div>
        );
    };

    return (
        <ErrorBoundary fallback={renderFallback} onError={handleError}>
            {children}
        </ErrorBoundary>
    );
}
