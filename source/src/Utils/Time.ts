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
     * 上一帧的时间戳
     */
    private static _lastTime: number = 0;
    
    /**
     * 是否为第一次更新
     */
    private static _isFirstUpdate: boolean = true;

    /**
     * 更新时间信息
     * @param currentTime 当前时间戳（毫秒）
     */
    public static update(currentTime: number = -1): void {
        if (currentTime === -1) {
            currentTime = Date.now();
        }

        if (this._isFirstUpdate) {
            this._lastTime = currentTime;
            this._isFirstUpdate = false;
            return;
        }

        // 计算帧时间间隔（转换为秒）
        this.unscaledDeltaTime = (currentTime - this._lastTime) / 1000;
        this.deltaTime = this.unscaledDeltaTime * this.timeScale;

        // 更新总时间
        this.unscaledTotalTime += this.unscaledDeltaTime;
        this.totalTime += this.deltaTime;

        // 更新帧数
        this.frameCount++;

        // 记录当前时间
        this._lastTime = currentTime;
    }

    /**
     * 场景改变时重置时间
     */
    public static sceneChanged(): void {
        this._isFirstUpdate = true;
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