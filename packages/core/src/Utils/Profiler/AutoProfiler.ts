/**
 * 自动性能分析器
 *
 * 提供自动函数包装和采样分析功能，无需手动埋点即可收集性能数据。
 *
 * 支持三种分析模式：
 * 1. 自动包装模式 - 使用 Proxy 自动包装类的所有方法
 * 2. 采样分析模式 - 定时采样调用栈（需要浏览器支持）
 * 3. 装饰器模式 - 使用 @Profile() 装饰器手动标记方法
 */

import { ProfilerSDK } from './ProfilerSDK';
import { ProfileCategory } from './ProfilerTypes';

/**
 * 自动分析配置
 */
export interface AutoProfilerConfig {
    /** 是否启用自动包装 */
    enabled: boolean;
    /** 采样间隔（毫秒），用于采样分析器 */
    sampleInterval: number;
    /** 最小记录耗时（毫秒），低于此值的调用不记录 */
    minDuration: number;
    /** 是否追踪异步方法 */
    trackAsync: boolean;
    /** 排除的方法名模式 */
    excludePatterns: RegExp[];
    /** 最大采样缓冲区大小 */
    maxBufferSize: number;
}

const DEFAULT_CONFIG: AutoProfilerConfig = {
    enabled: true,
    sampleInterval: 10,
    minDuration: 0.1, // 0.1ms
    trackAsync: true,
    excludePatterns: [
        /^_/,           // 私有方法
        /^get[A-Z]/,    // getter 方法
        /^set[A-Z]/,    // setter 方法
        /^is[A-Z]/,     // 布尔检查方法
        /^has[A-Z]/,    // 存在检查方法
    ],
    maxBufferSize: 10000
};

/**
 * 采样数据
 */
interface SampleData {
    timestamp: number;
    stack: string[];
    duration?: number;
}

/**
 * 包装信息
 */
interface WrapInfo {
    className: string;
    methodName: string;
    category: ProfileCategory;
    original: Function;
}

/**
 * 自动性能分析器
 */
export class AutoProfiler {
    private static instance: AutoProfiler | null = null;
    private config: AutoProfilerConfig;
    private wrappedObjects: WeakMap<object, Map<string, WrapInfo>> = new WeakMap();
    private samplingProfiler: SamplingProfiler | null = null;
    private registeredClasses: Map<string, { constructor: Function; category: ProfileCategory }> = new Map();

    private constructor(config?: Partial<AutoProfilerConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * 获取单例实例
     */
    public static getInstance(config?: Partial<AutoProfilerConfig>): AutoProfiler {
        if (!AutoProfiler.instance) {
            AutoProfiler.instance = new AutoProfiler(config);
        }
        return AutoProfiler.instance;
    }

    /**
     * 重置实例
     */
    public static resetInstance(): void {
        if (AutoProfiler.instance) {
            AutoProfiler.instance.dispose();
            AutoProfiler.instance = null;
        }
    }

    /**
     * 启用/禁用自动分析
     */
    public static setEnabled(enabled: boolean): void {
        AutoProfiler.getInstance().setEnabled(enabled);
    }

    /**
     * 注册类以进行自动分析
     * 该类的所有实例方法都会被自动包装
     */
    public static registerClass<T extends new (...args: any[]) => any>(
        constructor: T,
        category: ProfileCategory = ProfileCategory.Custom,
        className?: string
    ): T {
        return AutoProfiler.getInstance().registerClass(constructor, category, className);
    }

    /**
     * 包装对象实例的所有方法
     */
    public static wrapInstance<T extends object>(
        instance: T,
        className: string,
        category: ProfileCategory = ProfileCategory.Custom
    ): T {
        return AutoProfiler.getInstance().wrapInstance(instance, className, category);
    }

    /**
     * 包装单个函数
     */
    public static wrapFunction<T extends (...args: any[]) => any>(
        fn: T,
        name: string,
        category: ProfileCategory = ProfileCategory.Custom
    ): T {
        return AutoProfiler.getInstance().wrapFunction(fn, name, category);
    }

    /**
     * 启动采样分析器
     */
    public static startSampling(): void {
        AutoProfiler.getInstance().startSampling();
    }

    /**
     * 停止采样分析器
     */
    public static stopSampling(): SampleData[] {
        return AutoProfiler.getInstance().stopSampling();
    }

    /**
     * 设置启用状态
     */
    public setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
        if (!enabled && this.samplingProfiler) {
            this.samplingProfiler.stop();
        }
    }

    /**
     * 注册类以进行自动分析
     */
    public registerClass<T extends new (...args: any[]) => any>(
        constructor: T,
        category: ProfileCategory = ProfileCategory.Custom,
        className?: string
    ): T {
        const name = className || constructor.name;
        this.registeredClasses.set(name, { constructor, category });

        // eslint-disable-next-line @typescript-eslint/no-this-alias -- Required for Proxy construct handler
        const self = this;

        // 创建代理类
        const ProxiedClass = new Proxy(constructor, {
            construct(target, args, newTarget) {
                const instance = Reflect.construct(target, args, newTarget);
                if (self.config.enabled) {
                    self.wrapInstance(instance, name, category);
                }
                return instance;
            }
        });

        return ProxiedClass;
    }

    /**
     * 包装对象实例的所有方法
     */
    public wrapInstance<T extends object>(
        instance: T,
        className: string,
        category: ProfileCategory = ProfileCategory.Custom
    ): T {
        if (!this.config.enabled) {
            return instance;
        }

        // 检查是否已经包装过
        if (this.wrappedObjects.has(instance)) {
            return instance;
        }

        const wrapInfoMap = new Map<string, WrapInfo>();
        this.wrappedObjects.set(instance, wrapInfoMap);

        // 获取所有方法（包括原型链上的）
        const methodNames = this.getAllMethodNames(instance);

        for (const methodName of methodNames) {
            if (this.shouldExcludeMethod(methodName)) {
                continue;
            }

            const descriptor = this.getPropertyDescriptor(instance, methodName);
            if (!descriptor || typeof descriptor.value !== 'function') {
                continue;
            }

            const original = descriptor.value as Function;
            const wrapped = this.createWrappedMethod(original, className, methodName, category);

            wrapInfoMap.set(methodName, {
                className,
                methodName,
                category,
                original
            });

            try {
                (instance as any)[methodName] = wrapped;
            } catch {
                // 某些属性可能是只读的
            }
        }

        return instance;
    }

    /**
     * 包装单个函数
     */
    public wrapFunction<T extends (...args: any[]) => any>(
        fn: T,
        name: string,
        category: ProfileCategory = ProfileCategory.Custom
    ): T {
        if (!this.config.enabled) return fn;

        // eslint-disable-next-line @typescript-eslint/no-this-alias -- Required for wrapped function closure
        const self = this;

        const wrapped = function(this: any, ...args: any[]): any {
            const handle = ProfilerSDK.beginSample(name, category);
            try {
                const result = fn.apply(this, args);

                // 处理 Promise
                if (self.config.trackAsync && result instanceof Promise) {
                    return result.finally(() => {
                        ProfilerSDK.endSample(handle);
                    });
                }

                // 同步函数，立即结束采样
                ProfilerSDK.endSample(handle);
                return result;
            } catch (error) {
                // 发生错误时也要结束采样
                ProfilerSDK.endSample(handle);
                throw error;
            }
        } as T;

        // 保留原函数的属性
        Object.defineProperty(wrapped, 'name', { value: fn.name || name });
        Object.defineProperty(wrapped, 'length', { value: fn.length });

        return wrapped;
    }

    /**
     * 启动采样分析器
     */
    public startSampling(): void {
        if (!this.samplingProfiler) {
            this.samplingProfiler = new SamplingProfiler(this.config);
        }
        this.samplingProfiler.start();
    }

    /**
     * 停止采样分析器
     */
    public stopSampling(): SampleData[] {
        if (!this.samplingProfiler) {
            return [];
        }
        return this.samplingProfiler.stop();
    }

    /**
     * 释放资源
     */
    public dispose(): void {
        if (this.samplingProfiler) {
            this.samplingProfiler.stop();
            this.samplingProfiler = null;
        }
        this.registeredClasses.clear();
    }

    /**
     * 创建包装后的方法
     */
    private createWrappedMethod(
        original: Function,
        className: string,
        methodName: string,
        category: ProfileCategory
    ): Function {
        // eslint-disable-next-line @typescript-eslint/no-this-alias -- Required for wrapped method closure
        const self = this;
        const fullName = `${className}.${methodName}`;
        const minDuration = this.config.minDuration;

        return function(this: any, ...args: any[]): any {
            if (!self.config.enabled || !ProfilerSDK.isEnabled()) {
                return original.apply(this, args);
            }

            const startTime = performance.now();
            const handle = ProfilerSDK.beginSample(fullName, category);

            try {
                const result = original.apply(this, args);

                // 处理异步方法
                if (self.config.trackAsync && result instanceof Promise) {
                    return result.then(
                        (value) => {
                            const duration = performance.now() - startTime;
                            if (duration >= minDuration) {
                                ProfilerSDK.endSample(handle);
                            }
                            return value;
                        },
                        (error) => {
                            ProfilerSDK.endSample(handle);
                            throw error;
                        }
                    );
                }

                // 同步方法，检查最小耗时后结束采样
                const duration = performance.now() - startTime;
                if (duration >= minDuration) {
                    ProfilerSDK.endSample(handle);
                }
                return result;
            } catch (error) {
                // 发生错误时也要结束采样
                ProfilerSDK.endSample(handle);
                throw error;
            }
        };
    }

    /**
     * 获取对象的所有方法名
     */
    private getAllMethodNames(obj: object): string[] {
        const methods = new Set<string>();
        let current = obj;

        while (current && current !== Object.prototype) {
            for (const name of Object.getOwnPropertyNames(current)) {
                if (name !== 'constructor') {
                    methods.add(name);
                }
            }
            current = Object.getPrototypeOf(current);
        }

        return Array.from(methods);
    }

    /**
     * 获取属性描述符
     */
    private getPropertyDescriptor(obj: object, name: string): PropertyDescriptor | undefined {
        let current = obj;
        while (current && current !== Object.prototype) {
            const descriptor = Object.getOwnPropertyDescriptor(current, name);
            if (descriptor) return descriptor;
            current = Object.getPrototypeOf(current);
        }
        return undefined;
    }

    /**
     * 判断是否应该排除该方法
     */
    private shouldExcludeMethod(methodName: string): boolean {
        // 排除构造函数和内置方法
        if (methodName === 'constructor' || methodName.startsWith('__')) {
            return true;
        }

        // 检查排除模式
        for (const pattern of this.config.excludePatterns) {
            if (pattern.test(methodName)) {
                return true;
            }
        }

        return false;
    }
}

/**
 * 采样分析器
 * 使用定时器定期采样调用栈信息
 */
class SamplingProfiler {
    private config: AutoProfilerConfig;
    private samples: SampleData[] = [];
    private intervalId: number | null = null;
    private isRunning = false;

    constructor(config: AutoProfilerConfig) {
        this.config = config;
    }

    /**
     * 开始采样
     */
    public start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.samples = [];

        // 使用 requestAnimationFrame 或 setInterval 进行采样
        const sample = () => {
            if (!this.isRunning) return;

            const stack = this.captureStack();
            if (stack.length > 0) {
                this.samples.push({
                    timestamp: performance.now(),
                    stack
                });

                // 限制缓冲区大小
                if (this.samples.length > this.config.maxBufferSize) {
                    this.samples.shift();
                }
            }

            // 继续采样
            if (this.config.sampleInterval < 16) {
                // 高频采样使用 setTimeout
                this.intervalId = setTimeout(sample, this.config.sampleInterval) as any;
            } else {
                this.intervalId = setTimeout(sample, this.config.sampleInterval) as any;
            }
        };

        sample();
    }

    /**
     * 停止采样并返回数据
     */
    public stop(): SampleData[] {
        this.isRunning = false;
        if (this.intervalId !== null) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        return [...this.samples];
    }

    /**
     * 捕获当前调用栈
     */
    private captureStack(): string[] {
        try {
            // 创建 Error 对象获取调用栈
            const error = new Error();
            const stack = error.stack || '';

            // 解析调用栈
            const lines = stack.split('\n').slice(3); // 跳过 Error 和 captureStack/sample
            const frames: string[] = [];

            for (const line of lines) {
                const frame = this.parseStackFrame(line);
                if (frame && !this.isInternalFrame(frame)) {
                    frames.push(frame);
                }
            }

            return frames;
        } catch {
            return [];
        }
    }

    /**
     * 解析调用栈帧
     */
    private parseStackFrame(line: string): string | null {
        // Chrome/Edge 格式: "    at functionName (file:line:col)"
        // Firefox 格式: "functionName@file:line:col"
        // Safari 格式: "functionName@file:line:col"

        line = line.trim();

        // Chrome 格式
        let match = line.match(/at\s+(.+?)\s+\(/);
        if (match && match[1]) {
            return match[1];
        }

        // Chrome 匿名函数格式
        match = line.match(/at\s+(.+)/);
        if (match && match[1]) {
            const name = match[1];
            if (!name.includes('(')) {
                return name;
            }
        }

        // Firefox/Safari 格式
        match = line.match(/^(.+?)@/);
        if (match && match[1]) {
            return match[1];
        }

        return null;
    }

    /**
     * 判断是否是内部帧（应该过滤掉）
     */
    private isInternalFrame(frame: string): boolean {
        const internalPatterns = [
            'SamplingProfiler',
            'AutoProfiler',
            'ProfilerSDK',
            'setTimeout',
            'setInterval',
            'requestAnimationFrame',
            '<anonymous>',
            'eval'
        ];

        return internalPatterns.some(pattern => frame.includes(pattern));
    }
}

/**
 * @Profile 装饰器
 * 用于标记需要性能分析的方法
 *
 * @example
 * ```typescript
 * class MySystem extends System {
 *     @Profile()
 *     update() {
 *         // 方法执行时间会被自动记录
 *     }
 *
 *     @Profile('customName', ProfileCategory.Physics)
 *     calculatePhysics() {
 *         // 使用自定义名称和分类
 *     }
 * }
 * ```
 */
export function Profile(
    name?: string,
    category: ProfileCategory = ProfileCategory.Custom
): MethodDecorator {
    return function(
        target: object,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ): PropertyDescriptor {
        const original = descriptor.value;
        const methodName = name || `${target.constructor.name}.${String(propertyKey)}`;

        descriptor.value = function(this: any, ...args: any[]): any {
            if (!ProfilerSDK.isEnabled()) {
                return original.apply(this, args);
            }

            const handle = ProfilerSDK.beginSample(methodName, category);
            try {
                const result = original.apply(this, args);

                // 处理异步方法
                if (result instanceof Promise) {
                    return result.finally(() => {
                        ProfilerSDK.endSample(handle);
                    });
                }

                // 同步方法，立即结束采样
                ProfilerSDK.endSample(handle);
                return result;
            } catch (error) {
                // 发生错误时也要结束采样
                ProfilerSDK.endSample(handle);
                throw error;
            }
        };

        return descriptor;
    };
}

/**
 * @ProfileClass 装饰器
 * 用于自动包装类的所有方法
 *
 * @example
 * ```typescript
 * @ProfileClass(ProfileCategory.Physics)
 * class PhysicsSystem extends System {
 *     update() { ... }      // 自动被包装
 *     calculate() { ... }   // 自动被包装
 * }
 * ```
 */
export function ProfileClass(category: ProfileCategory = ProfileCategory.Custom): ClassDecorator {
    return function<T extends Function>(constructor: T): T {
        return AutoProfiler.registerClass(constructor as any, category) as any;
    };
}
