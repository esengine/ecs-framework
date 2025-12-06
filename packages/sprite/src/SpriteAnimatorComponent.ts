import { Component, ECSComponent, Serializable, Serialize, Property } from '@esengine/ecs-framework';

/**
 * 动画帧数据
 * Animation frame data
 */
export interface AnimationFrame {
    /**
     * 纹理资产 GUID
     * Texture asset GUID
     */
    textureGuid: string;
    /** 帧持续时间(秒) | Frame duration in seconds */
    duration: number;
    /** UV坐标 [u0, v0, u1, v1] | UV coordinates */
    uv?: [number, number, number, number];
}

/**
 * 动画剪辑数据
 * Animation clip data
 */
export interface AnimationClip {
    /** 动画名称 | Animation name */
    name: string;
    /** 动画帧列表 | Animation frames */
    frames: AnimationFrame[];
    /** 是否循环 | Whether to loop */
    loop: boolean;
    /** 播放速度倍数 | Playback speed multiplier */
    speed: number;
}

/**
 * 精灵动画组件 - 管理精灵帧动画
 * Sprite animator component - manages sprite frame animation
 */
@ECSComponent('SpriteAnimator', { requires: ['Sprite'] })
@Serializable({ version: 1, typeId: 'SpriteAnimator' })
export class SpriteAnimatorComponent extends Component {
    /**
     * 动画剪辑列表
     * Animation clips
     */
    @Serialize()
    @Property({
        type: 'animationClips',
        label: 'Animation Clips',
        controls: [{ component: 'Sprite', property: 'textureGuid' }]
    })
    public clips: AnimationClip[] = [];

    /**
     * 当前播放的动画名称
     * Currently playing animation name
     */
    @Serialize()
    @Property({ type: 'string', label: 'Default Animation' })
    public defaultAnimation: string = '';

    /**
     * 是否自动播放
     * Auto play on start
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Auto Play' })
    public autoPlay: boolean = true;

    /**
     * 全局播放速度
     * Global playback speed
     */
    @Serialize()
    @Property({ type: 'number', label: 'Speed', min: 0, max: 10, step: 0.1 })
    public speed: number = 1;

    // Runtime state (not serialized)
    private _currentClip: AnimationClip | null = null;
    private _currentFrameIndex: number = 0;
    private _frameTimer: number = 0;
    private _isPlaying: boolean = false;
    private _isPaused: boolean = false;

    // Callbacks
    private _onAnimationComplete?: (clipName: string) => void;
    private _onFrameChange?: (frameIndex: number, frame: AnimationFrame) => void;

    constructor() {
        super();
    }

    /**
     * 添加动画剪辑
     * Add animation clip
     */
    addClip(clip: AnimationClip): void {
        // Remove existing clip with same name
        this.clips = this.clips.filter((c) => c.name !== clip.name);
        this.clips.push(clip);
    }

    /**
     * 从精灵图集创建动画剪辑
     * Create animation clip from sprite atlas
     *
     * @param name - 动画名称 | Animation name
     * @param textureGuid - 纹理资产 GUID | Texture asset GUID
     * @param frameCount - 帧数 | Number of frames
     * @param frameWidth - 每帧宽度 | Frame width
     * @param frameHeight - 每帧高度 | Frame height
     * @param atlasWidth - 图集宽度 | Atlas width
     * @param atlasHeight - 图集高度 | Atlas height
     * @param fps - 帧率 | Frames per second
     * @param loop - 是否循环 | Whether to loop
     */
    createClipFromAtlas(
        name: string,
        textureGuid: string,
        frameCount: number,
        frameWidth: number,
        frameHeight: number,
        atlasWidth: number,
        atlasHeight: number,
        fps: number = 12,
        loop: boolean = true
    ): AnimationClip {
        const frames: AnimationFrame[] = [];
        const duration = 1 / fps;
        const cols = Math.floor(atlasWidth / frameWidth);

        for (let i = 0; i < frameCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * frameWidth;
            const y = row * frameHeight;

            frames.push({
                textureGuid,
                duration,
                uv: [
                    x / atlasWidth,
                    y / atlasHeight,
                    (x + frameWidth) / atlasWidth,
                    (y + frameHeight) / atlasHeight
                ]
            });
        }

        const clip: AnimationClip = {
            name,
            frames,
            loop,
            speed: 1
        };

        this.addClip(clip);
        return clip;
    }

    /**
     * 从帧序列创建动画剪辑
     * Create animation clip from frame sequence
     *
     * @param name - 动画名称 | Animation name
     * @param textureGuids - 纹理资产 GUID 数组 | Array of texture asset GUIDs
     * @param fps - 帧率 | Frames per second
     * @param loop - 是否循环 | Whether to loop
     */
    createClipFromSequence(
        name: string,
        textureGuids: string[],
        fps: number = 12,
        loop: boolean = true
    ): AnimationClip {
        const duration = 1 / fps;
        const frames: AnimationFrame[] = textureGuids.map((textureGuid) => ({
            textureGuid,
            duration
        }));

        const clip: AnimationClip = {
            name,
            frames,
            loop,
            speed: 1
        };

        this.addClip(clip);
        return clip;
    }

    /**
     * 播放动画
     * Play animation
     */
    play(clipName?: string): void {
        const name = clipName || this.defaultAnimation;
        if (!name) return;

        const clip = this.clips.find((c) => c.name === name);
        if (!clip || clip.frames.length === 0) {
            console.warn(`Animation clip not found: ${name}`);
            return;
        }

        this._currentClip = clip;
        this._currentFrameIndex = 0;
        this._frameTimer = 0;
        this._isPlaying = true;
        this._isPaused = false;

        this._notifyFrameChange();
    }

    /**
     * 停止动画
     * Stop animation
     */
    stop(): void {
        this._isPlaying = false;
        this._isPaused = false;
        this._currentFrameIndex = 0;
        this._frameTimer = 0;
    }

    /**
     * 暂停动画
     * Pause animation
     */
    pause(): void {
        if (this._isPlaying) {
            this._isPaused = true;
        }
    }

    /**
     * 恢复动画
     * Resume animation
     */
    resume(): void {
        if (this._isPlaying && this._isPaused) {
            this._isPaused = false;
        }
    }

    /**
     * 更新动画（由系统调用）
     * Update animation (called by system)
     */
    update(deltaTime: number): void {
        if (!this._isPlaying || this._isPaused || !this._currentClip) return;

        const clip = this._currentClip;
        const frame = clip.frames[this._currentFrameIndex];
        if (!frame) return;

        this._frameTimer += deltaTime * this.speed * clip.speed;

        if (this._frameTimer >= frame.duration) {
            this._frameTimer -= frame.duration;
            this._currentFrameIndex++;

            if (this._currentFrameIndex >= clip.frames.length) {
                if (clip.loop) {
                    this._currentFrameIndex = 0;
                } else {
                    this._currentFrameIndex = clip.frames.length - 1;
                    this._isPlaying = false;
                    this._onAnimationComplete?.(clip.name);
                    return;
                }
            }

            this._notifyFrameChange();
        }
    }

    /**
     * 获取当前帧
     * Get current frame
     */
    getCurrentFrame(): AnimationFrame | null {
        if (!this._currentClip) return null;
        return this._currentClip.frames[this._currentFrameIndex] || null;
    }

    /**
     * 获取当前帧索引
     * Get current frame index
     */
    getCurrentFrameIndex(): number {
        return this._currentFrameIndex;
    }

    /**
     * 设置当前帧
     * Set current frame
     */
    setFrame(index: number): void {
        if (!this._currentClip) return;
        this._currentFrameIndex = Math.max(0, Math.min(index, this._currentClip.frames.length - 1));
        this._frameTimer = 0;
        this._notifyFrameChange();
    }

    /**
     * 是否正在播放
     * Whether animation is playing
     */
    isPlaying(): boolean {
        return this._isPlaying && !this._isPaused;
    }

    /**
     * 获取当前动画名称
     * Get current animation name
     */
    getCurrentClipName(): string | null {
        return this._currentClip?.name || null;
    }

    /**
     * 设置动画完成回调
     * Set animation complete callback
     */
    onAnimationComplete(callback: (clipName: string) => void): void {
        this._onAnimationComplete = callback;
    }

    /**
     * 设置帧变化回调
     * Set frame change callback
     */
    onFrameChange(callback: (frameIndex: number, frame: AnimationFrame) => void): void {
        this._onFrameChange = callback;
    }

    private _notifyFrameChange(): void {
        const frame = this.getCurrentFrame();
        if (frame) {
            this._onFrameChange?.(this._currentFrameIndex, frame);
        }
    }

    /**
     * 获取动画剪辑
     * Get animation clip by name
     */
    getClip(name: string): AnimationClip | undefined {
        return this.clips.find((c) => c.name === name);
    }

    /**
     * 移除动画剪辑
     * Remove animation clip
     */
    removeClip(name: string): void {
        this.clips = this.clips.filter((c) => c.name !== name);
        if (this._currentClip?.name === name) {
            this.stop();
            this._currentClip = null;
        }
    }

    /**
     * 获取所有动画名称
     * Get all animation names
     */
    getClipNames(): string[] {
        return this.clips.map((c) => c.name);
    }
}
