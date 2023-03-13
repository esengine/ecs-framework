///<reference path="./Easing/EaseType.ts" />
///<reference path="../Utils/GlobalManager.ts"/>
module es {
    export class TweenManager extends GlobalManager {
        public static defaultEaseType: EaseType = EaseType.quartIn;

        /**
         * 如果为真，当加载新关卡时，活动的tween列表将被清除
         */
        public static removeAllTweensOnLevelLoad: boolean = false;

        /**
         * 这里支持各种类型的自动缓存。请
         * 注意，只有在使用扩展方法启动tweens时，或者在做自定义tweens时从缓存中获取tween时，缓存才会起作用。
         * 关于如何获取缓存的tween，请参见扩展方法的实现
         */
        public static cacheNumberTweens = true;
        public static cacheVector2Tweens = true;
        public static cacheColorTweens = true;
        public static cacheRectTweens = false;

        /**
         * 当前所有活跃用户的内部列表
         */
        private _activeTweens: ITweenable[] = [];
        public static get activeTweens(): ITweenable[] {
            return this._instance._activeTweens;
        }

        // 临时存储已完成的tweens
        private _tempTweens: ITweenable[] = [];
        // 标志表示tween更新循环正在运行
        private _isUpdating: boolean;
        // 便于暴露一个静态的API以方便访问
        private static _instance: TweenManager;

        constructor() {
            super();
            TweenManager._instance = this;
        }

        public update() {
            this._isUpdating = true;

            // 反向循环，这样我们就可以把完成的tweens删除了
            for (let i = this._activeTweens.length - 1; i >= 0; --i) {
                let tween = this._activeTweens[i];
                if (tween.tick()) {
                    // 如果tween还没有完成，将其加入临时列表中
                    this._tempTweens.push(tween);
                }
            }

            this._isUpdating = false;

            // 从临时列表中删除所有已完成的tweens
            for (let i = 0; i < this._tempTweens.length; i++) {
                this._tempTweens[i].recycleSelf();
                new List(this._activeTweens).remove(this._tempTweens[i]);
            }

            // 清空临时列表
            this._tempTweens.length = 0;
        }

        /**
         * 将一个tween添加到活动tweens列表中
         * @param tween
         */
        public static addTween(tween: ITweenable) {
            TweenManager._instance._activeTweens.push(tween);
        }

        /**
         * 从当前的tweens列表中删除一个tween
         * @param tween
         */
        public static removeTween(tween: ITweenable) {
            if (TweenManager._instance._isUpdating) {
                TweenManager._instance._tempTweens.push(tween);
            } else {
                tween.recycleSelf();
                new List(TweenManager._instance._activeTweens).remove(tween);
            }
        }

        /**
         * 停止所有的tween并选择地把他们全部完成
         * @param bringToCompletion
         */
        public static stopAllTweens(bringToCompletion: boolean = false) {
            for (let i = TweenManager._instance._activeTweens.length - 1; i >= 0; --i)
                TweenManager._instance._activeTweens[i].stop(bringToCompletion);
        }

        /**
         * 返回具有特定上下文的所有tweens。
         * Tweens以ITweenable的形式返回，因为这就是TweenManager所知道的所有内容
         * @param context
         */
        public static allTweensWithContext(context): ITweenable[] {
            let foundTweens = [];
            for (let i = 0; i < TweenManager._instance._activeTweens.length; i++) {
                if ((TweenManager._instance._activeTweens[i] as ITweenControl).context == context)
                    foundTweens.push(TweenManager._instance._activeTweens[i]);
            }

            return foundTweens;
        }

        /**
         * 停止所有给定上下文的tweens
         * @param context
         * @param bringToCompletion
         */
        public static stopAllTweensWithContext(context, bringToCompletion: boolean = false) {
            for (let i = TweenManager._instance._activeTweens.length - 1; i >= 0; --i) {
                if ((TweenManager._instance._activeTweens[i] as ITweenControl).context == context)
                    TweenManager._instance._activeTweens[i].stop(bringToCompletion);
            }
        }

        /**
         * 返回具有特定目标的所有tweens。
         * Tweens以ITweenControl的形式返回，因为TweenManager只知道这些
         * @param target
         */
        public static allTweenWithTarget(target): ITweenable[] {
            let foundTweens = [];

            for (let i = 0; i < TweenManager._instance._activeTweens.length; i++) {
                if (TweenManager._instance._activeTweens[i]) {
                    let tweenControl = TweenManager._instance._activeTweens[i] as ITweenControl;
                    if (tweenControl.getTargetObject() == target)
                        foundTweens.push(TweenManager._instance._activeTweens[i]);
                }
            }

            return foundTweens;
        }

        /**
         * 返回以特定实体为目标的所有tween
         * Tween返回为ITweenControl
         * @param target
         */
        public static allTweensWithTargetEntity(target: Entity) {
            let foundTweens = [];

            for (let i = 0; i < this._instance._activeTweens.length; i++) {
                if (this._instance._activeTweens[i].discriminator == "ITweenControl") {
                    let tweenControl = this._instance._activeTweens[i] as ITweenControl;
                    let obj = tweenControl.getTargetObject();
                    if (obj instanceof Entity && obj == target ||
                        obj instanceof Component && obj.entity == target ||
                        obj instanceof Transform && obj.entity == target) {
                        foundTweens.push(this._instance._activeTweens[i]);
                    }
                }
            }

            return foundTweens;
        }

        /**
         * 停止所有具有TweenManager知道的特定目标的tweens
         * @param target
         * @param bringToCompletion
         */
        public static stopAllTweensWithTarget(target, bringToCompletion: boolean = false) {
            for (let i = TweenManager._instance._activeTweens.length - 1; i >= 0; --i) {
                if (TweenManager._instance._activeTweens[i]) {
                    let tweenControl = TweenManager._instance._activeTweens[i] as ITweenControl;
                    if (tweenControl.getTargetObject() == target)
                        tweenControl.stop(bringToCompletion);
                }
            }
        }
    }
}