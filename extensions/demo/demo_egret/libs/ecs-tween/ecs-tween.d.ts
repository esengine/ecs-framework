declare module es {
    abstract class AbstractTweenable implements ITweenable {
        protected _isPaused: boolean;
        protected _isCurrentlyManagedByTweenManager: boolean;
        abstract tick(): boolean;
        recycleSelf(): void;
        isRunning(): boolean;
        start(): void;
        pause(): void;
        resume(): void;
        stop(bringToCompletion?: boolean): void;
    }
}
declare module es {
    class PropertyTweens {
        static NumberPropertyTo(self: any, memberName: string, to: number, duration: number): ITween<number>;
        static Vector2PropertyTo(self: any, memeberName: string, to: Vector2, duration: number): ITween<Vector2>;
    }
}
declare module es {
    class TransformSpringTween extends AbstractTweenable {
        readonly targetType: TransformTargetType;
        private _transform;
        private _targetType;
        private _targetValue;
        private _velocity;
        dampingRatio: number;
        angularFrequency: number;
        constructor(transform: Transform, targetType: TransformTargetType, targetValue: Vector2);
        setTargetValue(targetValue: Vector2): void;
        updateDampingRatioWithHalfLife(lambda: number): void;
        tick(): boolean;
        private setTweenedValue;
        private getCurrentValueOfTweenedTargetType;
    }
}
declare module es {
    enum LoopType {
        none = 0,
        restartFromBeginning = 1,
        pingpong = 2
    }
    enum TweenState {
        running = 0,
        paused = 1,
        complete = 2
    }
    abstract class Tween<T> implements ITweenable, ITween<T> {
        protected _target: ITweenTarget<T>;
        protected _isFromValueOverridden: boolean;
        protected _fromValue: T;
        protected _toValue: T;
        protected _easeType: EaseType;
        protected _shouldRecycleTween: boolean;
        protected _isRelative: boolean;
        protected _completionHandler: (tween: ITween<T>) => void;
        protected _loopCompleteHandler: (tween: ITween<T>) => void;
        protected _nextTween: ITweenable;
        protected _tweenState: TweenState;
        private _isTimeScaleIndependent;
        protected _delay: number;
        protected _duration: number;
        protected _timeScale: number;
        protected _elapsedTime: number;
        protected _loopType: LoopType;
        protected _loops: number;
        protected _delayBetweenLoops: number;
        private _isRunningInReverse;
        context: any;
        setEaseType(easeType: EaseType): ITween<T>;
        setDelay(delay: number): ITween<T>;
        setDuration(duration: number): ITween<T>;
        setTimeScale(timeSclae: number): ITween<T>;
        setIsTimeScaleIndependent(): ITween<T>;
        setCompletionHandler(completeHandler: (tween: ITween<T>) => void): ITween<T>;
        setLoops(loopType: LoopType, loops?: number, delayBetweenLoops?: number): ITween<T>;
        setLoopCompletionHanlder(loopCompleteHandler: (tween: ITween<T>) => void): ITween<T>;
        setFrom(from: T): ITween<T>;
        prepareForReuse(from: T, to: T, duration: number): ITween<T>;
        setRecycleTween(shouldRecycleTween: boolean): ITween<T>;
        abstract setIsRelative(): ITween<T>;
        setContext(context: any): ITween<T>;
        setNextTween(nextTween: ITweenable): ITween<T>;
        tick(): boolean;
        recycleSelf(): void;
        isRunning(): boolean;
        start(): void;
        pause(): void;
        resume(): void;
        stop(bringToCompletion?: boolean): void;
        jumpToElapsedTime(elapsedTime: any): void;
        reverseTween(): void;
        waitForCompletion(): IterableIterator<any>;
        getTargetObject(): any;
        private resetState;
        initialize(target: ITweenTarget<T>, to: T, duration: number): void;
        private handleLooping;
        protected abstract updateValue(): any;
    }
}
declare module es {
    class NumberTween extends Tween<number> {
        static create(): NumberTween;
        constructor(target?: ITweenTarget<number>, to?: number, duration?: number);
        setIsRelative(): ITween<number>;
        protected updateValue(): void;
        recycleSelf(): void;
    }
    class Vector2Tween extends Tween<Vector2> {
        static create(): Vector2Tween;
        constructor(target?: ITweenTarget<Vector2>, to?: Vector2, duration?: number);
        setIsRelative(): ITween<Vector2>;
        protected updateValue(): void;
        recycleSelf(): void;
    }
    class RectangleTween extends Tween<Rectangle> {
        static create(): RectangleTween;
        constructor(target?: ITweenTarget<Rectangle>, to?: Rectangle, duration?: number);
        setIsRelative(): ITween<Rectangle>;
        protected updateValue(): void;
        recycleSelf(): void;
    }
}
declare module es {
    enum TransformTargetType {
        position = 0,
        localPosition = 1,
        scale = 2,
        localScale = 3,
        rotationDegrees = 4,
        localRotationDegrees = 5
    }
    class TransformVector2Tween extends Vector2Tween implements ITweenTarget<Vector2> {
        private _transform;
        private _targetType;
        setTweenedValue(value: Vector2): void;
        getTweenedValue(): Vector2;
        getTargetObject(): Transform;
        setTargetAndType(transform: Transform, targetType: TransformTargetType): void;
        protected updateValue(): void;
        recycleSelf(): void;
    }
}
declare module es {
    enum EaseType {
        linear = 0,
        sineIn = 1,
        sineOut = 2,
        sineInOut = 3,
        quadIn = 4,
        quadOut = 5,
        quadInOut = 6,
        quintIn = 7,
        quintOut = 8,
        quintInOut = 9,
        cubicIn = 10,
        cubicOut = 11,
        cubicInOut = 12,
        quartIn = 13,
        quartOut = 14,
        quartInOut = 15,
        expoIn = 16,
        expoOut = 17,
        expoInOut = 18,
        circleIn = 19,
        circleOut = 20,
        circleInOut = 21,
        elasticIn = 22,
        elasticOut = 23,
        elasticInOut = 24,
        punch = 25,
        backIn = 26,
        backOut = 27,
        backInOut = 28,
        bounceIn = 29,
        bounceOut = 30,
        bounceInOut = 31
    }
    class EaseHelper {
        static oppositeEaseType(easeType: EaseType): EaseType.linear | EaseType.sineIn | EaseType.sineOut | EaseType.sineInOut | EaseType.quadIn | EaseType.quadOut | EaseType.quadInOut | EaseType.quintIn | EaseType.quintOut | EaseType.quintInOut | EaseType.cubicIn | EaseType.cubicOut | EaseType.cubicInOut | EaseType.quartIn | EaseType.quartInOut | EaseType.expoIn | EaseType.expoOut | EaseType.expoInOut | EaseType.circleIn | EaseType.circleOut | EaseType.circleInOut | EaseType.elasticIn | EaseType.elasticOut | EaseType.elasticInOut | EaseType.punch | EaseType.backIn | EaseType.backOut | EaseType.backInOut | EaseType.bounceIn | EaseType.bounceOut | EaseType.bounceInOut;
        static ease(easeType: EaseType, t: number, duration: number): number;
    }
}
declare module es {
    class TweenManager extends GlobalManager {
        static defaultEaseType: EaseType;
        static removeAllTweensOnLevelLoad: boolean;
        static cacheNumberTweens: boolean;
        static cacheVector2Tweens: boolean;
        static cacheRectTweens: boolean;
        private _activeTweens;
        private _tempTweens;
        private _isUpdating;
        private static _instance;
        constructor();
        update(): void;
        static addTween(tween: ITweenable): void;
        static removeTween(tween: ITweenable): void;
        static stopAllTweens(bringToCompletion?: boolean): void;
        static allTweensWithContext(context: any): ITweenable[];
        static stopAllTweensWithContext(context: any, bringToCompletion?: boolean): void;
        static allTweenWithTarget(target: any): ITweenable[];
        static stopAllTweensWithTarget(target: any, bringToCompletion?: boolean): void;
    }
}
declare module es {
    module Easing {
        class Linear {
            static easeNone(t: number, d: number): number;
        }
        class Quadratic {
            static easeIn(t: number, d: number): number;
            static easeOut(t: number, d: number): number;
            static easeInOut(t: number, d: number): number;
        }
        class Back {
            static easeIn(t: number, d: number): number;
            static easeOut(t: number, d: number): number;
            static easeInOut(t: number, d: number): number;
        }
        class Bounce {
            static easeOut(t: number, d: number): number;
            static easeIn(t: number, d: number): number;
            static easeInOut(t: number, d: number): number;
        }
        class Circular {
            static easeIn(t: number, d: number): number;
            static easeOut(t: number, d: number): number;
            static easeInOut(t: number, d: number): number;
        }
        class Cubic {
            static easeIn(t: number, d: number): number;
            static easeOut(t: number, d: number): number;
            static easeInOut(t: number, d: number): number;
        }
        class Elastic {
            static easeIn(t: number, d: number): number;
            static easeOut(t: number, d: number): number;
            static easeInOut(t: number, d: number): number;
            static punch(t: number, d: number): number;
        }
        class Exponential {
            static easeIn(t: number, d: number): number;
            static easeOut(t: number, d: number): number;
            static easeInOut(t: number, d: number): number;
        }
        class Quartic {
            static easeIn(t: number, d: number): number;
            static easeOut(t: number, d: number): number;
            static easeInOut(t: number, d: number): number;
        }
        class Quintic {
            static easeIn(t: number, d: number): number;
            static easeOut(t: number, d: number): number;
            static easeInOut(t: number, d: number): number;
        }
        class Sinusoidal {
            static easeIn(t: number, d: number): number;
            static easeOut(t: number, d: number): number;
            static easeInOut(t: number, d: number): number;
        }
    }
}
declare module es {
    class Lerps {
        static lerp(from: number, to: number, t: number): number;
        static lerpVector2(from: Vector2, to: Vector2, t: number): Vector2;
        static lerpRectangle(from: Rectangle, to: Rectangle, t: number): Rectangle;
        static angleLerp(from: Vector2, to: Vector2, t: number): Vector2;
        static ease(easeType: EaseType, from: number, to: number, t: number, duration: number): number;
        static easeVector2(easeType: EaseType, from: Vector2, to: Vector2, t: number, duration: number): Vector2;
        static easeRectangle(easeType: EaseType, from: Rectangle, to: Rectangle, t: number, duration: number): Rectangle;
        static easeAngle(easeType: EaseType, from: Vector2, to: Vector2, t: number, duration: number): Vector2;
        static fastSpring(currentValue: Vector2, targetValue: Vector2, velocity: Vector2, dampingRatio: number, angularFrequency: number): Vector2;
    }
}
declare module es {
    interface ITween<T> extends ITweenControl {
        setEaseType(easeType: EaseType): ITween<T>;
        setDelay(delay: number): ITween<T>;
        setDuration(duration: number): ITween<T>;
        setTimeScale(timeScale: number): ITween<T>;
        setIsTimeScaleIndependent(): ITween<T>;
        setCompletionHandler(completionHandler: (tween: ITween<T>) => void): ITween<T>;
        setLoops(loopType: LoopType, loops: number, delayBetweenLoops: number): ITween<T>;
        setFrom(from: T): ITween<T>;
        prepareForReuse(from: T, to: T, duration: number): ITween<T>;
        setRecycleTween(shouldRecycleTween: boolean): ITween<T>;
        setIsRelative(): ITween<T>;
        setContext(context: any): ITween<T>;
        setNextTween(nextTween: ITweenable): ITween<T>;
    }
}
declare module es {
    interface ITweenControl extends ITweenable {
        context: any;
        jumpToElapsedTime(elapsedTime: number): any;
        waitForCompletion(): any;
        getTargetObject(): any;
    }
}
declare module es {
    interface ITweenTarget<T> {
        setTweenedValue(value: T): any;
        getTweenedValue(): T;
        getTargetObject(): any;
    }
}
declare module es {
    interface ITweenable {
        tick(): boolean;
        recycleSelf(): any;
        isRunning(): boolean;
        start(): any;
        pause(): any;
        resume(): any;
        stop(bringToCompletion: boolean): any;
    }
}
