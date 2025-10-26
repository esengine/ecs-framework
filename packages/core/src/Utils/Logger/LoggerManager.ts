import { ConsoleLogger } from "./ConsoleLogger";
import { LogLevel } from "./Constants";
import { ILogger, LoggerColorConfig } from "./Types";

/**
 * 日志管理器
 */
export class LoggerManager {
    private static _instance: LoggerManager;
    private _loggers = new Map<string, ILogger>();
    private _defaultLogger: ILogger;
    private _defaultLevel = LogLevel.Info;

    private constructor() {
        this._defaultLogger = new ConsoleLogger({
            level: this._defaultLevel,
        });
    }

    /**
     * 获取日志管理器实例
     * @returns 日志管理器实例
     */
    public static getInstance(): LoggerManager {
        if (!LoggerManager._instance) {
            LoggerManager._instance = new LoggerManager();
        }
        return LoggerManager._instance;
    }

    /**
     * 获取或创建日志器
     * @param name 日志器名称
     * @returns 日志器实例
     */
    public getLogger(name?: string): ILogger {
        if (!name) {
            return this._defaultLogger;
        }

        if (!this._loggers.has(name)) {
            const logger = new ConsoleLogger({
                prefix: name,
                level: this._defaultLevel,
            });
            this._loggers.set(name, logger);
        }

        return this._loggers.get(name)!;
    }

    /**
     * 设置日志器
     * @param name 日志器名称
     * @param logger 日志器实例
     */
    public setLogger(name: string, logger: ILogger): void {
        this._loggers.set(name, logger);
    }

    /**
     * 设置全局日志级别
     * @param level 日志级别
     */
    public setGlobalLevel(level: LogLevel): void {
        this._defaultLevel = level;

        if (this._defaultLogger instanceof ConsoleLogger) {
            this._defaultLogger.setLevel(level);
        }

        for (const logger of this._loggers.values()) {
            if (logger instanceof ConsoleLogger) {
                logger.setLevel(level);
            }
        }
    }

    /**
     * 创建子日志器
     * @param parentName 父日志器名称
     * @param childName 子日志器名称
     * @returns 子日志器实例
     */
    public createChildLogger(parentName: string, childName: string): ILogger {
        const fullName = `${parentName}.${childName}`;
        return this.getLogger(fullName);
    }

    /**
     * 设置全局颜色配置
     * @param colors 颜色配置
     */
    public setGlobalColors(colors: LoggerColorConfig): void {
        if (this._defaultLogger instanceof ConsoleLogger) {
            this._defaultLogger.setColors(colors);
        }

        for (const logger of this._loggers.values()) {
            if (logger instanceof ConsoleLogger) {
                logger.setColors(colors);
            }
        }
    }

    /**
     * 重置为默认颜色配置
     */
    public resetColors(): void {
        if (this._defaultLogger instanceof ConsoleLogger) {
            this._defaultLogger.setColors({});
        }

        for (const logger of this._loggers.values()) {
            if (logger instanceof ConsoleLogger) {
                logger.setColors({});
            }
        }
    }
}

/**
 * 默认日志器实例
 */
export const Logger = LoggerManager.getInstance().getLogger();

/**
 * 创建命名日志器
 * @param name 日志器名称
 * @returns 日志器实例
 */
export function createLogger(name: string): ILogger {
    return LoggerManager.getInstance().getLogger(name);
}

/**
 * 设置全局日志颜色配置
 * @param colors 颜色配置
 */
export function setLoggerColors(colors: LoggerColorConfig): void {
    LoggerManager.getInstance().setGlobalColors(colors);
}

/**
 * 重置日志颜色为默认配置
 */
export function resetLoggerColors(): void {
    LoggerManager.getInstance().resetColors();
}

/**
 * 设置全局日志级别
 * @param level 日志级别
 */
export function setGlobalLogLevel(level: LogLevel): void {
    LoggerManager.getInstance().setGlobalLevel(level);
}
