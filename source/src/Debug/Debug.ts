module es {
    export enum LogType {
        error,
        warn,
        log,
        info,
        trace
    }

    export class Debug {
        /**
         * 如果条件为true，则在控制台中以警告方式打印消息。
         * @param condition 是否应该打印消息的条件
         * @param format 要打印的消息格式
         * @param args 与消息格式相对应的参数列表
         */
        public static warnIf(condition: boolean, format: string, ...args: any[]) {
            if (condition)
                this.log(LogType.warn, format, args);
        }

        /**
         * 在控制台中以警告方式打印消息。
         * @param format 要打印的消息格式
         * @param args 与消息格式相对应的参数列表
         */
        public static warn(format: string, ...args: any[]) {
            this.log(LogType.warn, format, args);
        }

        /**
         * 在控制台中以错误方式打印消息。
         * @param format 要打印的消息格式
         * @param args 与消息格式相对应的参数列表
         */
        public static error(format: string, ...args: any[]) {
            this.log(LogType.error, format, args);
        }

        /**
         * 在控制台中以标准日志方式打印消息。
         * @param type 要打印的日志类型
         * @param format 要打印的消息格式
         * @param args 与消息格式相对应的参数列表
         */
        public static log(type: LogType, format: string, ...args: any[]) {
            switch (type) {
                case LogType.error:
                    console.error(`${type}: ${StringUtils.format(format, args)}`);
                    break;
                case LogType.warn:
                    console.warn(`${type}: ${StringUtils.format(format, args)}`);
                    break;
                case LogType.log:
                    console.log(`${type}: ${StringUtils.format(format, args)}`);
                    break;
                case LogType.info:
                    console.info(`${type}: ${StringUtils.format(format, args)}`);
                    break;
                case LogType.trace:
                    console.trace(`${type}: ${StringUtils.format(format, args)}`);
                    break;
                default:
                    throw new Error('argument out of range');
            }
        }
    }
}