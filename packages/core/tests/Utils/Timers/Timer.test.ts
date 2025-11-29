import { Timer } from '../../../src/Utils/Timers/Timer';
import { ITimer } from '../../../src/Utils/Timers/ITimer';
import { Time } from '../../../src/Utils/Time';

// Mock Time.deltaTime
jest.mock('../../../src/Utils/Time', () => ({
    Time: {
        deltaTime: 0.016 // 默认16ms，约60FPS
    }
}));

describe('Timer - 定时器测试', () => {
    let timer: Timer;
    let mockCallback: jest.Mock;
    let mockContext: any;

    beforeEach(() => {
        timer = new Timer();
        mockCallback = jest.fn();
        mockContext = { id: 'test-context' };
        
        // 重置deltaTime
        (Time as any).deltaTime = 0.016;
    });

    afterEach(() => {
        timer.unload();
    });

    describe('基本初始化和属性', () => {
        it('应该能够创建定时器实例', () => {
            expect(timer).toBeInstanceOf(Timer);
            expect(timer.isDone).toBe(false);
            expect(timer.elapsedTime).toBe(0);
        });

        it('应该能够初始化定时器', () => {
            timer.initialize(1.0, false, mockContext, mockCallback);

            expect(timer.context).toBe(mockContext);
            expect(timer.isDone).toBe(false);
            expect(timer.elapsedTime).toBe(0);
        });

        it('应该能够获取泛型上下文', () => {
            interface TestContext {
                id: string;
                value: number;
            }
            
            const testContext: TestContext = { id: 'test', value: 42 };
            timer.initialize(1.0, false, testContext, mockCallback);
            
            const context = timer.getContext<TestContext>();
            expect(context.id).toBe('test');
            expect(context.value).toBe(42);
        });
    });

    describe('定时器tick逻辑', () => {
        beforeEach(() => {
            timer.initialize(1.0, false, mockContext, mockCallback);
        });

        it('应该正确累加经过时间', () => {
            (Time as any).deltaTime = 0.5;
            timer.tick(); // 先累加时间
            expect(timer.elapsedTime).toBe(0.5);
            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('当经过时间超过目标时间时应该触发回调', () => {
            // 第一次tick：累加时间到1.1，但还没检查触发条件
            (Time as any).deltaTime = 1.1;
            timer.tick();
            expect(timer.elapsedTime).toBe(1.1);
            expect(mockCallback).not.toHaveBeenCalled();
            
            // 第二次tick：检查条件并触发
            (Time as any).deltaTime = 0.1;
            timer.tick();
            expect(mockCallback).toHaveBeenCalledWith(timer);
            expect(mockCallback).toHaveBeenCalledTimes(1);
            expect(timer.isDone).toBe(true); // 非重复定时器应该完成
        });

        it('应该在触发后调整剩余时间', () => {
            // 第一次累加到1.5
            (Time as any).deltaTime = 1.5;
            timer.tick();
            expect(timer.elapsedTime).toBe(1.5);
            
            // 第二次检查并触发：1.5 - 1.0 = 0.5，然后加上当前的deltaTime
            (Time as any).deltaTime = 0.3;
            timer.tick();
            expect(timer.elapsedTime).toBe(0.8); // 0.5 + 0.3
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });
    });

    describe('重复定时器', () => {
        beforeEach(() => {
            timer.initialize(1.0, true, mockContext, mockCallback);
        });

        it('重复定时器不应该自动标记为完成', () => {
            // 累加时间超过目标
            (Time as any).deltaTime = 1.1;
            timer.tick();
            
            // 检查并触发，但不应该标记为完成
            (Time as any).deltaTime = 0.1;
            const isDone = timer.tick();
            
            expect(isDone).toBe(false);
            expect(timer.isDone).toBe(false);
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('重复定时器可以多次触发', () => {
            // 第一次触发
            (Time as any).deltaTime = 1.1;
            timer.tick(); // 累加时间
            (Time as any).deltaTime = 0.1;
            timer.tick(); // 触发
            expect(mockCallback).toHaveBeenCalledTimes(1);
            
            // 第二次触发 - 从剩余的0.1开始
            (Time as any).deltaTime = 0.9; // 0.1 + 0.9 = 1.0
            timer.tick(); // 累加到1.0
            (Time as any).deltaTime = 0.1;
            timer.tick(); // 检查并触发
            expect(mockCallback).toHaveBeenCalledTimes(2);
        });
    });

    describe('定时器控制方法', () => {
        beforeEach(() => {
            timer.initialize(1.0, false, mockContext, mockCallback);
        });

        it('reset应该重置经过时间', () => {
            (Time as any).deltaTime = 0.5;
            timer.tick();
            expect(timer.elapsedTime).toBe(0.5);
            
            timer.reset();
            expect(timer.elapsedTime).toBe(0);
            expect(timer.isDone).toBe(false);
        });

        it('stop应该标记定时器为完成', () => {
            timer.stop();
            expect(timer.isDone).toBe(true);
        });

        it('停止的定时器不应该触发回调', () => {
            timer.stop();
            (Time as any).deltaTime = 2.0;
            const isDone = timer.tick();
            
            expect(isDone).toBe(true);
            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    describe('上下文绑定', () => {
        it('回调应该正确绑定到上下文', () => {
            let contextValue = 0;
            const testContext = {
                value: 42,
                callback: function(this: any, timer: ITimer) {
                    contextValue = this.value;
                }
            };
            
            timer.initialize(1.0, false, testContext, testContext.callback);
            
            // 触发定时器
            (Time as any).deltaTime = 1.1;
            timer.tick(); // 累加时间
            (Time as any).deltaTime = 0.1;
            timer.tick(); // 触发
            
            expect(contextValue).toBe(42);
        });
    });

    describe('内存管理', () => {
        it('unload应该清空对象引用', () => {
            timer.initialize(1.0, false, mockContext, mockCallback);

            timer.unload();

            expect(timer.context).toBeNull();
        });
    });

    describe('边界情况', () => {
        it('零秒定时器应该立即触发', () => {
            timer.initialize(0, false, mockContext, mockCallback);
            
            // 第一次累加时间
            (Time as any).deltaTime = 0.001;
            timer.tick();
            expect(timer.elapsedTime).toBe(0.001);
            
            // 第二次检查并触发（elapsedTime > 0）
            timer.tick();
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('负数时间定时器应该立即触发', () => {
            timer.initialize(-1, false, mockContext, mockCallback);
            
            (Time as any).deltaTime = 0.001;
            timer.tick(); // 累加时间，elapsedTime = 0.001 > -1
            timer.tick(); // 检查并触发
            
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('极小deltaTime应该正确累积', () => {
            timer.initialize(0.1, false, mockContext, mockCallback);
            (Time as any).deltaTime = 0.05;
            
            // 第一次不触发
            timer.tick();
            expect(mockCallback).not.toHaveBeenCalled();
            expect(timer.elapsedTime).toBe(0.05);
            
            // 第二次累加到0.1，但条件是 > 0.1 才触发，所以不触发
            timer.tick();
            expect(timer.elapsedTime).toBe(0.1);
            expect(mockCallback).not.toHaveBeenCalled();
            
            // 第三次累加到0.11，但在检查之前elapsedTime还是0.1，所以不触发
            (Time as any).deltaTime = 0.01; // 0.1 + 0.01 = 0.11 > 0.1
            timer.tick();
            expect(timer.elapsedTime).toBe(0.11);
            expect(mockCallback).not.toHaveBeenCalled();
            
            // 第四次检查并触发（elapsedTime = 0.11 > 0.1）
            (Time as any).deltaTime = 0.01; // 保持相同的deltaTime
            timer.tick();
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });
    });

    describe('性能测试', () => {
        it('大量tick调用应该高效', () => {
            timer.initialize(1000, false, mockContext, mockCallback);
            (Time as any).deltaTime = 0.016;
            
            const startTime = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                timer.tick();
            }
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100);
        });
    });

    describe('实际使用场景', () => {
        it('延迟执行功能', () => {
            let executed = false;
            
            timer.initialize(1.0, false, null, () => {
                executed = true;
            });
            
            // 累加时间但不触发
            (Time as any).deltaTime = 0.9;
            timer.tick();
            expect(executed).toBe(false);
            
            // 继续累加到超过目标时间
            (Time as any).deltaTime = 0.2; // 总共1.1 > 1.0
            timer.tick();
            expect(executed).toBe(false); // 还没检查触发条件
            
            // 下一次tick才会检查并触发
            timer.tick();
            expect(executed).toBe(true);
        });

        it('重复任务执行', () => {
            let counter = 0;
            timer.initialize(0.5, true, null, () => {
                counter++;
            });
            
            // 第一次触发 - 需要超过0.5
            (Time as any).deltaTime = 0.6;
            timer.tick(); // 累加到0.6，检查 0.6 > 0.5，触发，剩余0.1
            timer.tick(); // 再加0.6变成0.7，检查 0.1 <= 0.5不触发，最后加0.6变成0.7
            expect(counter).toBe(1);
            
            // 第二次触发条件
            (Time as any).deltaTime = 0.3; // 0.7 + 0.3 = 1.0 > 0.5 应该触发
            timer.tick(); // 检查并触发第二次
            expect(counter).toBe(2);
        });
    });
});