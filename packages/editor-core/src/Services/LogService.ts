import type { IService } from '@esengine/ecs-framework';
import { Injectable, LogLevel } from '@esengine/ecs-framework';

export interface LogEntry {
    id: number;
    timestamp: Date;
    level: LogLevel;
    source: string;
    message: string;
    args: unknown[];
}

export type LogListener = (entry: LogEntry) => void;

/**
 * 编辑器日志服务
 *
 * 捕获框架和用户代码的所有日志输出，并提供给UI层展示
 */
@Injectable()
export class LogService implements IService {
    private logs: LogEntry[] = [];
    private listeners: Set<LogListener> = new Set();
    private nextId = 0;
    private maxLogs = 1000;

    private originalConsole = {
        log: console.log.bind(console),
        debug: console.debug.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };

    constructor() {
        this.interceptConsole();
    }

    /**
     * 拦截控制台输出
     */
    private interceptConsole(): void {
        console.log = (...args: unknown[]) => {
            this.addLog(LogLevel.Info, 'console', this.formatMessage(args), args);
            this.originalConsole.log(...args);
        };

        console.debug = (...args: unknown[]) => {
            this.addLog(LogLevel.Debug, 'console', this.formatMessage(args), args);
            this.originalConsole.debug(...args);
        };

        console.info = (...args: unknown[]) => {
            this.addLog(LogLevel.Info, 'console', this.formatMessage(args), args);
            this.originalConsole.info(...args);
        };

        console.warn = (...args: unknown[]) => {
            this.addLog(LogLevel.Warn, 'console', this.formatMessage(args), args);
            this.originalConsole.warn(...args);
        };

        console.error = (...args: unknown[]) => {
            this.addLog(LogLevel.Error, 'console', this.formatMessage(args), args);
            this.originalConsole.error(...args);
        };

        window.addEventListener('error', (event) => {
            this.addLog(
                LogLevel.Error,
                'error',
                event.message,
                [event.error]
            );
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.addLog(
                LogLevel.Error,
                'promise',
                `Unhandled Promise Rejection: ${event.reason}`,
                [event.reason]
            );
        });
    }

    /**
     * 格式化消息
     */
    private formatMessage(args: unknown[]): string {
        return args.map(arg => {
            if (typeof arg === 'string') return arg;
            if (arg instanceof Error) return arg.message;
            try {
                return JSON.stringify(arg);
            } catch {
                return String(arg);
            }
        }).join(' ');
    }

    /**
     * 添加日志
     */
    private addLog(level: LogLevel, source: string, message: string, args: unknown[]): void {
        const entry: LogEntry = {
            id: this.nextId++,
            timestamp: new Date(),
            level,
            source,
            message,
            args
        };

        this.logs.push(entry);

        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        this.notifyListeners(entry);
    }

    /**
     * 添加远程日志（从远程游戏接收）
     */
    public addRemoteLog(level: LogLevel, message: string, timestamp?: Date): void {
        const entry: LogEntry = {
            id: this.nextId++,
            timestamp: timestamp || new Date(),
            level,
            source: 'remote',
            message,
            args: []
        };

        this.logs.push(entry);

        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        this.notifyListeners(entry);
    }

    /**
     * 通知监听器
     */
    private notifyListeners(entry: LogEntry): void {
        for (const listener of this.listeners) {
            try {
                listener(entry);
            } catch (error) {
                this.originalConsole.error('Error in log listener:', error);
            }
        }
    }

    /**
     * 获取所有日志
     */
    public getLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * 清空日志
     */
    public clear(): void {
        this.logs = [];
        this.notifyListeners({
            id: -1,
            timestamp: new Date(),
            level: LogLevel.Info,
            source: 'system',
            message: 'Logs cleared',
            args: []
        });
    }

    /**
     * 订阅日志更新
     */
    public subscribe(listener: LogListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * 设置最大日志数量
     */
    public setMaxLogs(max: number): void {
        this.maxLogs = max;
        while (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    public dispose(): void {
        console.log = this.originalConsole.log;
        console.debug = this.originalConsole.debug;
        console.info = this.originalConsole.info;
        console.warn = this.originalConsole.warn;
        console.error = this.originalConsole.error;

        this.listeners.clear();
        this.logs = [];
    }
}
