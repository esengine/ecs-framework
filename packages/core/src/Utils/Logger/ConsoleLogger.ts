import { Colors, LogLevel } from './Constants';
import { ILogger, LoggerColorConfig, LoggerConfig } from './Types';


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
     * 设置颜色配置
     * @param colors 颜色配置
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
