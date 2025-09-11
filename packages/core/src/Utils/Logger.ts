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
 * 日志颜色配置接口
 */
export interface LoggerColorConfig {
    debug?: string;
    info?: string;
    warn?: string;
    error?: string;
    fatal?: string;
    reset?: string;
}

/**
 * 预定义的颜色常量
 */
export const Colors = {
    // 基础颜色
    BLACK: '\x1b[30m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    WHITE: '\x1b[37m',
    
    // 亮色版本
    BRIGHT_BLACK: '\x1b[90m',
    BRIGHT_RED: '\x1b[91m',
    BRIGHT_GREEN: '\x1b[92m',
    BRIGHT_YELLOW: '\x1b[93m',
    BRIGHT_BLUE: '\x1b[94m',
    BRIGHT_MAGENTA: '\x1b[95m',
    BRIGHT_CYAN: '\x1b[96m',
    BRIGHT_WHITE: '\x1b[97m',
    
    // 特殊
    RESET: '\x1b[0m',
    BOLD: '\x1b[1m',
    UNDERLINE: '\x1b[4m'
} as const;

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
    /** 自定义颜色配置 */
    colors?: LoggerColorConfig;
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
     * @param message - 日志消息
     * @param args - 附加参数
     */
    public debug(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Debug, message, ...args);
    }

    /**
     * 输出信息级别日志
     * @param message - 日志消息
     * @param args - 附加参数
     */
    public info(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Info, message, ...args);
    }

    /**
     * 输出警告级别日志
     * @param message - 日志消息
     * @param args - 附加参数
     */
    public warn(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Warn, message, ...args);
    }

    /**
     * 输出错误级别日志
     * @param message - 日志消息
     * @param args - 附加参数
     */
    public error(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Error, message, ...args);
    }

    /**
     * 输出致命错误级别日志
     * @param message - 日志消息
     * @param args - 附加参数
     */
    public fatal(message: string, ...args: unknown[]): void {
        this.log(LogLevel.Fatal, message, ...args);
    }

    /**
     * 设置日志级别
     * @param level - 日志级别
     */
    public setLevel(level: LogLevel): void {
        this._config.level = level;
    }

    /**
     * 设置颜色配置
     * @param colors - 颜色配置
     */
    public setColors(colors: LoggerColorConfig): void {
        if (Object.keys(colors).length === 0) {
            // 重置为默认颜色
            delete this._config.colors;
        } else {
            this._config.colors = {
                ...this._config.colors,
                ...colors
            };
        }
    }

    /**
     * 设置日志前缀
     * @param prefix - 前缀字符串
     */
    public setPrefix(prefix: string): void {
        this._config.prefix = prefix;
    }

    /**
     * 内部日志输出方法
     * @param level - 日志级别
     * @param message - 日志消息
     * @param args - 附加参数
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
     * @param level - 日志级别
     * @param message - 格式化后的消息
     * @param args - 附加参数
     */
    private outputToConsole(level: LogLevel, message: string, ...args: unknown[]): void {
        const colors = this._config.enableColors ? this.getColors() : null;
        
        switch (level) {
            case LogLevel.Debug:
                if (colors) {
                    console.debug(`${colors.debug}${message}${colors.reset}`, ...args);
                } else {
                    console.debug(message, ...args);
                }
                break;
            case LogLevel.Info:
                if (colors) {
                    console.info(`${colors.info}${message}${colors.reset}`, ...args);
                } else {
                    console.info(message, ...args);
                }
                break;
            case LogLevel.Warn:
                if (colors) {
                    console.warn(`${colors.warn}${message}${colors.reset}`, ...args);
                } else {
                    console.warn(message, ...args);
                }
                break;
            case LogLevel.Error:
                if (colors) {
                    console.error(`${colors.error}${message}${colors.reset}`, ...args);
                } else {
                    console.error(message, ...args);
                }
                break;
            case LogLevel.Fatal:
                if (colors) {
                    console.error(`${colors.fatal}${message}${colors.reset}`, ...args);
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
        // 默认颜色配置
        const defaultColors = {
            debug: Colors.BRIGHT_BLACK,     // 灰色
            info: Colors.GREEN,             // 绿色
            warn: Colors.YELLOW,            // 黄色
            error: Colors.RED,              // 红色
            fatal: Colors.BRIGHT_RED,       // 亮红色
            reset: Colors.RESET             // 重置
        };

        // 合并用户自定义颜色
        return {
            ...defaultColors,
            ...this._config.colors
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
     * @param name - 日志器名称
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
     * @param name - 日志器名称
     * @param logger - 日志器实例
     */
    public setLogger(name: string, logger: ILogger): void {
        this._loggers.set(name, logger);
    }

    /**
     * 设置全局日志级别
     * @param level - 日志级别
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
     * @param parentName - 父日志器名称
     * @param childName - 子日志器名称
     * @returns 子日志器实例
     */
    public createChildLogger(parentName: string, childName: string): ILogger {
        const fullName = `${parentName}.${childName}`;
        return this.getLogger(fullName);
    }

    /**
     * 设置全局颜色配置
     * @param colors - 颜色配置
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
 * @param name - 日志器名称
 * @returns 日志器实例
 */
export function createLogger(name: string): ILogger {
    return LoggerManager.getInstance().getLogger(name);
}

/**
 * 设置全局日志颜色配置
 * @param colors - 颜色配置
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
 * @param level - 日志级别
 */
export function setGlobalLogLevel(level: LogLevel): void {
    LoggerManager.getInstance().setGlobalLevel(level);
}