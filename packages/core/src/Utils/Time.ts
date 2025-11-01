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

        // 更新帧数
        this.frameCount++;
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
