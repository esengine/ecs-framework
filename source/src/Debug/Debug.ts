module es {
    export enum LogType {
        error,
        warn,
        log,
        info,
        trace
    }

    export class Debug {
        public static warnIf(condition: boolean, format: string, ...args: any[]) {
            if (condition)
                this.log(LogType.warn, format, args);
        }

        public static warn(format: string, ...args: any[]) {
            this.log(LogType.warn, format, args);
        }

        public static error(format: string, ...args: any[]) {
            this.log(LogType.error, format, args);
        }

        public static log(type: LogType, format: string, ...args: any[]) {
            switch(type) {
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