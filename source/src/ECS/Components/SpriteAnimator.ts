///<reference path="./SpriteRenderer.ts" />
class SpriteAnimator extends SpriteRenderer implements IUpdatable {
    /** 在动画完成时触发，包括动画名称; */
    public onAnimationCompletedEvent: Function;
    /** 动画播放速度 */
    public speed = 1;
    /** 动画的当前状态 */
    public animationState = State.none;
    /** 当前动画 */
    public currentAnimation: SpriteAnimation;
    /** 当前动画的名称 */
    public currentAnimationName: string;
    /** 当前动画的精灵数组中当前帧的索引 */
    public currentFrame: number;
    /** 检查当前动画是否正在运行 */
    public get isRunning(): boolean{
        return this.animationState == State.running;
    }

    private _animations: Map<string, SpriteAnimation> = new Map<string, SpriteAnimation>();
    private _elapsedTime: number = 0;
    private _loopMode: LoopMode;

    constructor(sprite?: Sprite){
        super();

        if (sprite) this.setSprite(sprite);
    }

    /**
     * 添加一个SpriteAnimation
     * @param name 
     * @param animation 
     */
    public addAnimation(name: string, animation: SpriteAnimation): SpriteAnimator{
        if (!this.sprite && animation.sprites.length > 0)
            this.setSprite(animation.sprites[0]);
        this._animations[name] = animation;
        return this;
    }

    /**
     * 以给定的名称放置动画。如果没有指定循环模式，则默认为循环
     * @param name 
     * @param loopMode 
     */
    public play(name: string, loopMode: LoopMode = null){
        this.currentAnimation = this._animations[name];
        this.currentAnimationName = name;
        this.currentFrame = 0;
        this.animationState = State.running;

        this.sprite = this.currentAnimation.sprites[0];
        this._elapsedTime = 0;
        this._loopMode = loopMode ? loopMode : LoopMode.loop;
    }

    /**
     * 检查动画是否正在播放(即动画是活动的)。它可能仍然处于暂停状态)
     * @param name 
     */
    public isAnimationActive(name: string): boolean{
        return this.currentAnimation && this.currentAnimationName == name;
    }

    /**
     * 暂停动画
     */
    public pause(){
        this.animationState = State.paused;
    }

    /**
     * 继续动画
     */
    public unPause(){
        this.animationState = State.running;
    }

    /**
     * 停止当前动画并将其设为null
     */
    public stop(){
        this.currentAnimation = null;
        this.currentAnimationName = null;
        this.currentFrame = 0;
        this.animationState = State.none;
    }

    public update(){
        if (this.animationState != State.running || !this.currentAnimation) return;

        let animation = this.currentAnimation;
        let secondsPerFrame = 1 / (animation.frameRate * this.speed);
        let iterationDuration = secondsPerFrame * animation.sprites.length;

        this._elapsedTime += Time.deltaTime;
        let time = Math.abs(this._elapsedTime);

        if (this._loopMode == LoopMode.once && time > iterationDuration ||
            this._loopMode == LoopMode.pingPongOnce && time > iterationDuration * 2){
                this.animationState = State.completed;
                this._elapsedTime = 0;
                this.currentFrame = 0;
                this.sprite = animation.sprites[this.currentFrame];
                return;
            }

            // 弄清楚我们在哪个坐标系上
            let i = Math.floor(time / secondsPerFrame);
            let n = animation.sprites.length;
            if (n > 2 && (this._loopMode == LoopMode.pingPong || this._loopMode == LoopMode.pingPongOnce)){
                // pingpong
                let maxIndex = n - 1;
                this.currentFrame = maxIndex - Math.abs(maxIndex - i % (maxIndex * 2));
            }else{
                this.currentFrame = i % n;
            }

            this.sprite = animation.sprites[this.currentFrame];
    }
}

enum LoopMode {
    /** 在一个循环序列[A][B][C][A][B][C][A][B][C]... */
    loop,
    /** [A][B][C]然后暂停，设置时间为0 [A] */
    once,
    /** [A][B][C]。当它到达终点时，它会继续播放最后一帧，并且不会停止播放 */
    clampForever,
    /** 以一个乒乓循环的方式永远播放这个序列 [A][B][C][B][A][B][C][B]... */
    pingPong,
    /** 将顺序向前播放一次，然后返回到开始[A][B][C][B][A]，然后暂停并设置时间为0 */
    pingPongOnce,
}

enum State {
    none,
    running,
    paused,
    completed,
}