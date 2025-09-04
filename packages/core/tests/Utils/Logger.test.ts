import { ConsoleLogger, LogLevel, createLogger, LoggerManager, setLoggerColors, resetLoggerColors, Colors } from '../../src/Utils/Logger';

describe('Logger', () => {
    describe('ConsoleLogger', () => {
        let consoleSpy: jest.SpyInstance;
        
        beforeEach(() => {
            consoleSpy = jest.spyOn(console, 'info').mockImplementation();
        });
        
        afterEach(() => {
            consoleSpy.mockRestore();
        });

        it('应该使用绿色(green)颜色输出INFO级别日志', () => {
            const logger = new ConsoleLogger({
                level: LogLevel.Info,
                enableColors: true,
                enableTimestamp: false
            });

            logger.info('测试消息');

            expect(consoleSpy).toHaveBeenCalledWith(
                '\x1b[32m[INFO] 测试消息\x1b[0m'
            );
        });

        it('应该在颜色禁用时输出纯文本', () => {
            const logger = new ConsoleLogger({
                level: LogLevel.Info,
                enableColors: false,
                enableTimestamp: false
            });

            logger.info('测试消息');

            expect(consoleSpy).toHaveBeenCalledWith('[INFO] 测试消息');
        });

        it('应该正确设置不同日志级别的颜色', () => {
            const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const errorSpy = jest.spyOn(console, 'error').mockImplementation();

            const logger = new ConsoleLogger({
                level: LogLevel.Debug,
                enableColors: true,
                enableTimestamp: false
            });

            logger.debug('调试消息');
            logger.info('信息消息');
            logger.warn('警告消息');
            logger.error('错误消息');

            expect(debugSpy).toHaveBeenCalledWith('\x1b[90m[DEBUG] 调试消息\x1b[0m');
            expect(consoleSpy).toHaveBeenCalledWith('\x1b[32m[INFO] 信息消息\x1b[0m');
            expect(warnSpy).toHaveBeenCalledWith('\x1b[33m[WARN] 警告消息\x1b[0m');
            expect(errorSpy).toHaveBeenCalledWith('\x1b[31m[ERROR] 错误消息\x1b[0m');

            debugSpy.mockRestore();
            warnSpy.mockRestore();
            errorSpy.mockRestore();
        });

        it('应该正确添加前缀和时间戳', () => {
            const logger = new ConsoleLogger({
                level: LogLevel.Info,
                enableColors: false,
                enableTimestamp: true,
                prefix: 'TestLogger'
            });

            logger.info('测试消息');

            const call = consoleSpy.mock.calls[0][0];
            expect(call).toMatch(/\[INFO\] \[TestLogger\] \[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] 测试消息/);
        });

        it('应该支持自定义颜色配置', () => {
            const logger = new ConsoleLogger({
                level: LogLevel.Info,
                enableColors: true,
                enableTimestamp: false,
                colors: {
                    info: Colors.CYAN
                }
            });

            logger.info('测试消息');

            expect(consoleSpy).toHaveBeenCalledWith(
                '\x1b[36m[INFO] 测试消息\x1b[0m'
            );
        });

        it('应该支持运行时修改颜色配置', () => {
            const logger = new ConsoleLogger({
                level: LogLevel.Info,
                enableColors: true,
                enableTimestamp: false
            });

            logger.setColors({
                info: Colors.BRIGHT_BLUE
            });

            logger.info('测试消息');

            expect(consoleSpy).toHaveBeenCalledWith(
                '\x1b[94m[INFO] 测试消息\x1b[0m'
            );
        });
    });

    describe('createLogger', () => {
        it('应该创建具有指定名称的logger', () => {
            const logger = createLogger('TestLogger');
            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

            logger.info('测试消息');

            const call = consoleSpy.mock.calls[0][0];
            expect(call).toContain('[TestLogger]');
            expect(call).toContain('[INFO]');
            expect(call).toContain('测试消息');

            consoleSpy.mockRestore();
        });
    });

    describe('LoggerManager', () => {
        it('应该返回相同名称的相同logger实例', () => {
            const manager = LoggerManager.getInstance();
            const logger1 = manager.getLogger('TestLogger');
            const logger2 = manager.getLogger('TestLogger');

            expect(logger1).toBe(logger2);
        });

        it('应该正确创建子logger', () => {
            const manager = LoggerManager.getInstance();
            const childLogger = manager.createChildLogger('Parent', 'Child');
            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

            childLogger.info('测试消息');

            const call = consoleSpy.mock.calls[0][0];
            expect(call).toContain('[Parent.Child]');

            consoleSpy.mockRestore();
        });
    });

    describe('全局颜色配置', () => {
        let consoleSpy: jest.SpyInstance;
        
        beforeEach(() => {
            consoleSpy = jest.spyOn(console, 'info').mockImplementation();
        });
        
        afterEach(() => {
            consoleSpy.mockRestore();
            resetLoggerColors();
        });

        it('应该支持全局设置颜色配置', () => {
            setLoggerColors({
                info: Colors.MAGENTA
            });

            const logger = createLogger('TestLogger');
            logger.info('测试消息');

            const call = consoleSpy.mock.calls[0][0];
            expect(call).toContain('\x1b[35m');
            expect(call).toContain('\x1b[0m');
        });

        it('应该支持重置颜色配置为默认值', () => {
            setLoggerColors({
                info: Colors.MAGENTA
            });

            resetLoggerColors();

            const logger = createLogger('TestLogger');
            logger.info('测试消息');

            const call = consoleSpy.mock.calls[0][0];
            expect(call).toContain('\x1b[32m');
        });
    });
});