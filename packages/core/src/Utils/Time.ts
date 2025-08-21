/**
 * 时间管理工具类
 * 提供游戏时间相关的功能，包括帧时间、总时间、时间缩放等
 */
export class Time {
    /**
     * 上一帧到当前帧的时间间隔（秒）
     */
    public static deltaTime: number = 0;
    
    /**
     * 未缩放的帧时间间隔（秒）
     */
    public static unscaledDeltaTime: number = 0;
    
    /**
     * 游戏开始以来的总时间（秒）
     */
    public static totalTime: number = 0;
    
    /**
     * 未缩放的总时间（秒）
     */
    public static unscaledTotalTime: number = 0;
    
    /**
     * 时间缩放比例
     */
    public static timeScale: number = 1;
    
    /**
     * 当前帧数
     */
    public static frameCount: number = 0;

    /**
     * 固定时间步长（秒）
     * 默认值为1/30秒，适合大多数游戏的物理更新频率
     */
    public static fixedDeltaTime: number = 1 / 30;
    
    /**
     * 时间累积器
     * 累积变长的deltaTime，用于固定步长更新
     */
    public static accumulator: number = 0;
    
    /**
     * 固定更新的帧计数
     */
    public static fixedFrameCount: number = 0;
    
    /**
     * 插值系数
     * 用于渲染插值，范围0-1
     */
    public static interpolationFactor: number = 0;
    
    /**
     * 固定更新的总时间
     */
    public static fixedTotalTime: number = 0;
    
    /**
     * 最大允许的固定更新步数
     * 防止长时间卡顿导致的追赶更新过多
     */
    public static maxFixedStepsPerFrame: number = 5;

    /**
     * 使用外部引擎提供的deltaTime更新时间信息
     * @param deltaTime 外部引擎提供的帧时间间隔（秒）
     */
    public static update(deltaTime: number): void {
        // 设置未缩放的帧时间
        this.unscaledDeltaTime = deltaTime;
        this.deltaTime = deltaTime * this.timeScale;

        // 更新总时间
        this.unscaledTotalTime += this.unscaledDeltaTime;
        this.totalTime += this.deltaTime;

        // 更新累积器（用于固定步长更新）
        this.accumulator += this.deltaTime;

        // 计算插值系数
        this.interpolationFactor = Math.min(this.accumulator / this.fixedDeltaTime, 1.0);

        // 更新帧数
        this.frameCount++;
    }

    /**
     * 执行固定步长更新
     * 返回实际执行的固定步长次数
     */
    public static executeFixedSteps(): number {
        let fixedSteps = 0;
        
        while (this.accumulator >= this.fixedDeltaTime && fixedSteps < this.maxFixedStepsPerFrame) {
            this.accumulator -= this.fixedDeltaTime;
            this.fixedTotalTime += this.fixedDeltaTime;
            this.fixedFrameCount++;
            fixedSteps++;
        }

        // 重新计算插值系数
        this.interpolationFactor = this.accumulator / this.fixedDeltaTime;
        
        return fixedSteps;
    }

    /**
     * 设置固定时间步长
     * @param fixedDelta 固定时间步长（秒）
     */
    public static setFixedDeltaTime(fixedDelta: number): void {
        if (fixedDelta <= 0) {
            throw new Error('固定时间步长必须大于0');
        }
        this.fixedDeltaTime = fixedDelta;
    }

    /**
     * 获取当前是否需要执行固定更新
     */
    public static get shouldFixedUpdate(): boolean {
        return this.accumulator >= this.fixedDeltaTime;
    }

    /**
     * 场景改变时重置时间
     */
    public static sceneChanged(): void {
        this.frameCount = 0;
        this.totalTime = 0;
        this.unscaledTotalTime = 0;
        this.deltaTime = 0;
        this.unscaledDeltaTime = 0;
        
        // 重置固定步长相关状态
        this.accumulator = 0;
        this.fixedFrameCount = 0;
        this.interpolationFactor = 0;
        this.fixedTotalTime = 0;
    }

    /**
     * 检查指定的时间间隔是否已经过去
     * @param interval 时间间隔（秒）
     * @param lastTime 上次检查的时间
     * @returns 是否已经过去指定时间
     */
    public static checkEvery(interval: number, lastTime: number): boolean {
        return this.totalTime - lastTime >= interval;
    }
} 