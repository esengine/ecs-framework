/**
 * 世界状态适配器接口
 * 
 * 负责将世界的可模拟状态编码为字节流和从字节流恢复
 */

/**
 * 世界适配器接口
 */
export interface WorldAdapter {
    /**
     * 将世界可模拟状态编码为ArrayBuffer
     * 包括SoA列、实体池、索引等所有关键状态
     */
    encode(options?: EncodeOptions): ArrayBuffer;

    /**
     * 从ArrayBuffer恢复世界状态
     * @param buf 状态字节流
     * @param options 解码选项
     */
    decode(buf: ArrayBuffer, options?: DecodeOptions): void;

    /**
     * 获取世界状态版本号
     */
    getVersion(): number;

    /**
     * 设置解码后回调
     * 便于解除耦合，替代构造器传参
     */
    onAfterDecode(callback: AfterDecodeCallback): void;
}

/**
 * 编码选项
 */
export interface EncodeOptions {
    /** 确定性模式 */
    deterministic?: boolean;
    /** 帧号（用于回放对齐校验） */
    frame?: number;
    /** 随机种子（用于可复现PRNG） */
    seed?: number;
    /** 断言命令缓冲区为空（默认true） */
    assertCleanCB?: boolean;
    /** 是否包含调试信息 */
    includeDebugInfo?: boolean;
    /** 压缩级别 */
    compressionLevel?: number;
}

/**
 * 解码选项
 */
export interface DecodeOptions {
    /** 是否清空现有状态（默认true） */
    clearExisting?: boolean;
    /** 严格Schema检查模式 */
    strictSchema?: boolean;
    /** 确定性模式，用于控制错误处理策略 */
    deterministic?: boolean;
    /** 缺失组件处理策略：throw抛异常，skip跳过并计数 */
    onMissingComponent?: MissingComponentStrategy;
    /** 是否验证数据完整性 */
    validateIntegrity?: boolean;
}


/**
 * 组件缺失处理策略
 */
export type MissingComponentStrategy = 'throw' | 'skip';

/**
 * 解码后回调函数类型
 */
export type AfterDecodeCallback = (info: { frame?: number; seed?: number }) => void;