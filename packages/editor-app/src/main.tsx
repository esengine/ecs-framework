import 'reflect-metadata';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { setGlobalLogLevel, LogLevel } from '@esengine/ecs-framework';
import { invoke } from '@tauri-apps/api/core';
import App from './App';
import './styles/global.css';
import './styles/index.css';
import './i18n/config';

// Set log level to Warn in production to reduce console noise
setGlobalLogLevel(LogLevel.Warn);

// 写入错误日志到文件
// Write error log to file
async function logErrorToFile(type: string, error: unknown) {
    try {
        const timestamp = new Date().toISOString();
        const errorStr = error instanceof Error
            ? `${error.message}\n${error.stack || ''}`
            : String(error);
        const logEntry = `[${timestamp}] [${type}]\n${errorStr}\n${'='.repeat(80)}\n`;

        // 写入用户目录下的日志文件
        // Write to log file in user directory
        const tempDir = await invoke<string>('get_temp_dir');
        const logPath = `${tempDir}/esengine-editor-crash.log`;
        await invoke('append_to_log', { path: logPath, content: logEntry });
        console.log(`[Error logged to ${logPath}]`);
    } catch (e) {
        console.error('Failed to write error log:', e);
    }
}

// Global error handlers to prevent silent crashes
// 全局错误处理器，防止静默崩溃
window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.error || event.message);
    logErrorToFile('Global Error', event.error || event.message);
    // Prevent default to stop page reload on uncaught errors
    // 阻止默认行为，防止未捕获错误导致页面刷新
    event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason);
    logErrorToFile('Unhandled Promise Rejection', event.reason);
    // Prevent default to stop potential page reload
    // 阻止默认行为，防止潜在的页面刷新
    event.preventDefault();
});

// 记录应用启动，方便判断是否发生了刷新
// Log app start to help detect refreshes
logErrorToFile('App Start', `Editor started at ${new Date().toISOString()}`);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
