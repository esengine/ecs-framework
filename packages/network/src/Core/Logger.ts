/**
 * 日志级别
 */
export enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3,
    Fatal = 4,
    None = 5
}

/**
 * 日志接口
 */
export interface ILogger {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    fatal(message: string, ...args: unknown[]): void;
}

/**
 * 日志配置
 */
export interface LoggerConfig {
    /** 日志级别 */
    level: LogLevel;
    /** 是否启用时间戳 */
    enableTimestamp: boolean;
    /** 是否启用颜色 */
    enableColors: boolean;
    /** 日志前缀 */
    prefix?: string;
    /** 自定义输出函数 */
    output?: (level: LogLevel, message: string) => void;
}

/**
 * 默认控制台日志实现
 */
export class ConsoleLogger implements ILogger {
    private config: LoggerConfig;

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = {
            level: LogLevel.Info,
            enableTimestamp: true,
            enableColors: typeof window === 'undefined', // Node.js环境默认启用颜色
            ...config
        };
    }

    public debug(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Debug, message, ...args);
    }

    public info(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Info, message, ...args);
    }

    public warn(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Warn, message, ...args);
    }

    public error(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Error, message, ...args);
    }

    public fatal(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Fatal, message, ...args);
    }

    private log(level: LogLevel, message: string, ...args: unknown[]): void {
        if (level < this.config.level) {
            return;
        }

        let formattedMessage = message;

        // 添加时间戳
        if (this.config.enableTimestamp) {
            const timestamp = new Date().toISOString();
            formattedMessage = `[${timestamp}] ${formattedMessage}`;
        }

        // 添加前缀
        if (this.config.prefix) {
            formattedMessage = `[${this.config.prefix}] ${formattedMessage}`;
        }

        // 添加日志级别
        const levelName = LogLevel[level].toUpperCase();
        formattedMessage = `[${levelName}] ${formattedMessage}`;

        // 使用自定义输出或默认控制台输出
        if (this.config.output) {
            this.config.output(level, formattedMessage);
        } else {
            this.outputToConsole(level, formattedMessage, ...args);
        }
    }

    private outputToConsole(level: LogLevel, message: string, ...args: unknown[]): void {
        const colors = this.config.enableColors ? this.getColors() : null;
        
        switch (level) {
            case LogLevel.Debug:
                if (colors) {
                    console.debug(`${colors.gray}${message}${colors.reset}`, ...args);
                } else {
                    console.debug(message, ...args);
                }
                break;
            case LogLevel.Info:
                if (colors) {
                    console.info(`${colors.blue}${message}${colors.reset}`, ...args);
                } else {
                    console.info(message, ...args);
                }
                break;
            case LogLevel.Warn:
                if (colors) {
                    console.warn(`${colors.yellow}${message}${colors.reset}`, ...args);
                } else {
                    console.warn(message, ...args);
                }
                break;
            case LogLevel.Error:
            case LogLevel.Fatal:
                if (colors) {
                    console.error(`${colors.red}${message}${colors.reset}`, ...args);
                } else {
                    console.error(message, ...args);
                }
                break;
        }
    }

    private getColors() {
        return {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            gray: '\x1b[90m'
        };
    }

    public setLevel(level: LogLevel): void {
        this.config.level = level;
    }

    public setPrefix(prefix: string): void {
        this.config.prefix = prefix;
    }
}

/**
 * 日志管理器
 */
export class LoggerManager {
    private static _instance: LoggerManager;
    private _loggers = new Map<string, ILogger>();
    private _defaultLogger: ILogger;

    private constructor() {
        this._defaultLogger = new ConsoleLogger();
    }

    public static getInstance(): LoggerManager {
        if (!LoggerManager._instance) {
            LoggerManager._instance = new LoggerManager();
        }
        return LoggerManager._instance;
    }

    /**
     * 获取或创建日志器
     */
    public getLogger(name?: string): ILogger {
        if (!name) {
            return this._defaultLogger;
        }

        if (!this._loggers.has(name)) {
            const logger = new ConsoleLogger({
                prefix: name,
                level: LogLevel.Info
            });
            this._loggers.set(name, logger);
        }

        return this._loggers.get(name)!;
    }

    /**
     * 设置日志器
     */
    public setLogger(name: string, logger: ILogger): void {
        this._loggers.set(name, logger);
    }

    /**
     * 设置全局日志级别
     */
    public setGlobalLevel(level: LogLevel): void {
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
     */
    public createChildLogger(parentName: string, childName: string): ILogger {
        const fullName = `${parentName}.${childName}`;
        return this.getLogger(fullName);
    }
}

/**
 * 默认日志器实例
 */
export const Logger = LoggerManager.getInstance().getLogger();

/**
 * 创建命名日志器
 */
export function createLogger(name: string): ILogger {
    return LoggerManager.getInstance().getLogger(name);
}

/**
 * 设置全局日志级别
 */
export function setGlobalLogLevel(level: LogLevel): void {
    LoggerManager.getInstance().setGlobalLevel(level);
}