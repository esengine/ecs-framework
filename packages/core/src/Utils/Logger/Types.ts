import type { LogLevel } from './Constants';

/**
 * 日志接口
 */
export interface ILogger {
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    fatal(...args: unknown[]): void;
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
