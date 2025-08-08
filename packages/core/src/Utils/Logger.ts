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
    private _config: LoggerConfig;

    constructor(config: Partial<LoggerConfig> = {}) {
        this._config = {
            level: LogLevel.Info,
            enableTimestamp: true,
            enableColors: typeof window === 'undefined',
            ...config
        };
    }

    /**
     * 输出调试级别日志
     * @param message 日志消息
     * @param args 附加参数
     */
    public debug(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Debug, message, ...args);
    }

    /**
     * 输出信息级别日志
     * @param message 日志消息
     * @param args 附加参数
     */
    public info(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Info, message, ...args);
    }

    /**
     * 输出警告级别日志
     * @param message 日志消息
     * @param args 附加参数
     */
    public warn(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Warn, message, ...args);
    }

    /**
     * 输出错误级别日志
     * @param message 日志消息
     * @param args 附加参数
     */
    public error(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Error, message, ...args);
    }

    /**
     * 输出致命错误级别日志
     * @param message 日志消息
     * @param args 附加参数
     */
    public fatal(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Fatal, message, ...args);
    }

    /**
     * 设置日志级别
     * @param level 日志级别
     */
    public setLevel(level: LogLevel): void {
        this._config.level = level;
    }

    /**
     * 设置日志前缀
     * @param prefix 前缀字符串
     */
    public setPrefix(prefix: string): void {
        this._config.prefix = prefix;
    }

    /**
     * 内部日志输出方法
     * @param level 日志级别
     * @param message 日志消息
     * @param args 附加参数
     */
    private log(level: LogLevel, message: string, ...args: unknown[]): void {
        if (level < this._config.level) {
            return;
        }

        let formattedMessage = message;

        // 添加时间戳
        if (this._config.enableTimestamp) {
            const timestamp = new Date().toISOString();
            formattedMessage = `[${timestamp}] ${formattedMessage}`;
        }

        // 添加前缀
        if (this._config.prefix) {
            formattedMessage = `[${this._config.prefix}] ${formattedMessage}`;
        }

        // 添加日志级别
        const levelName = LogLevel[level].toUpperCase();
        formattedMessage = `[${levelName}] ${formattedMessage}`;

        // 使用自定义输出或默认控制台输出
        if (this._config.output) {
            this._config.output(level, formattedMessage);
        } else {
            this.outputToConsole(level, formattedMessage, ...args);
        }
    }

    /**
     * 输出到控制台
     * @param level 日志级别
     * @param message 格式化后的消息
     * @param args 附加参数
     */
    private outputToConsole(level: LogLevel, message: string, ...args: unknown[]): void {
        const colors = this._config.enableColors ? this.getColors() : null;
        
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

    /**
     * 获取控制台颜色配置
     * @returns 颜色配置对象
     */
    private getColors() {
        return {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            gray: '\x1b[90m'
        };
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
                level: LogLevel.Info
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
 * 设置全局日志级别
 * @param level 日志级别
 */
export function setGlobalLogLevel(level: LogLevel): void {
    LoggerManager.getInstance().setGlobalLevel(level);
}