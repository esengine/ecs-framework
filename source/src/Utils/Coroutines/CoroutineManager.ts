module es {
    /**
     * CoroutineManager用于隐藏Coroutine所需数据的内部类
     */
    export class CoroutineImpl implements ICoroutine, IPoolable {
        public enumerator;

        /**
         * 每当产生一个延迟，它就会被添加到跟踪延迟的waitTimer中
         */
        public waitTimer: number = 0;

        public isDone: boolean;
        public waitForCoroutine: CoroutineImpl;
        public useUnscaledDeltaTime: boolean = false;

        public stop() {
            this.isDone = true;
        }

        public setUseUnscaledDeltaTime(useUnscaledDeltaTime: boolean) {
            this.useUnscaledDeltaTime = useUnscaledDeltaTime;
            return this;
        }

        public prepareForUse() {
            this.isDone = false;
        }

        public reset() {
            this.isDone = true;
            this.waitTimer = 0;
            this.waitForCoroutine = null;
            this.enumerator = null;
            this.useUnscaledDeltaTime = false;
        }
    }

    export class CoroutineManager extends GlobalManager {
        /**
         * 标志来跟踪我们何时处于更新循环中。
         * 如果在更新循环中启动了一个新的coroutine，我们必须将它贴在shouldRunNextFrame列表中，以避免在迭代时修改一个数组
         */
        public _isInUpdate: boolean;

        public _unblockedCoroutines: CoroutineImpl[] = [];
        public _shouldRunNextFrame: CoroutineImpl[] = [];

        /**
         * 立即停止并清除所有协程
         */
        public clearAllCoroutines() {
            for (let i = 0; i < this._unblockedCoroutines.length; i++) {
                Pool.free(CoroutineImpl, this._unblockedCoroutines[i]);
            }

            for (let i = 0; i < this._shouldRunNextFrame.length; i++) {
                Pool.free(CoroutineImpl, this._shouldRunNextFrame[i]);
            }

            this._unblockedCoroutines.length = 0;
            this._shouldRunNextFrame.length = 0;
        }

        /**
         * 将IEnumerator添加到CoroutineManager中
         * Coroutine在每一帧调用Update之前被执行
         * @param enumerator 
         */
        public startCoroutine<T>(enumerator: Iterator<T> | (() => Iterator<T>)): CoroutineImpl | null {
            const coroutine = this.getOrCreateCoroutine();
            coroutine.prepareForUse();
            coroutine.enumerator = typeof enumerator === 'function' ? enumerator() : enumerator;

            if (this.tickCoroutine(coroutine)) {
                this.addCoroutine(coroutine);
                return coroutine;
            }

            return null;
        }

        private getOrCreateCoroutine(): CoroutineImpl {
            const coroutine = Pool.obtain<CoroutineImpl>(CoroutineImpl);
            coroutine.prepareForUse();
            return coroutine;
        }

        private addCoroutine(coroutine: CoroutineImpl) {
            if (this._isInUpdate)
                this._shouldRunNextFrame.push(coroutine);
            else
                this._unblockedCoroutines.push(coroutine);
        }

        public update() {
            this._isInUpdate = true;

            const unblockedCoroutines = this._unblockedCoroutines;
            const shouldRunNextFrame = this._shouldRunNextFrame;

            for (let i = unblockedCoroutines.length - 1; i >= 0; i--) {
                const coroutine = unblockedCoroutines[i];

                if (coroutine.isDone) {
                    Pool.free(CoroutineImpl, coroutine);
                    unblockedCoroutines.splice(i, 1);
                    continue;
                }

                const waitForCoroutine = coroutine.waitForCoroutine;
                if (waitForCoroutine != null) {
                    if (waitForCoroutine.isDone) {
                        coroutine.waitForCoroutine = null;
                    } else {
                        shouldRunNextFrame.push(coroutine);
                        continue;
                    }
                }

                const waitTimer = coroutine.waitTimer;
                if (waitTimer > 0) {
                    // 递减，然后再运行下一帧，确保用适当的deltaTime递减
                    coroutine.waitTimer = waitTimer - (coroutine.useUnscaledDeltaTime ? Time.unscaledDeltaTime : Time.deltaTime);
                    shouldRunNextFrame.push(coroutine);
                    continue;
                }

                if (this.tickCoroutine(coroutine)) {
                    shouldRunNextFrame.push(coroutine);
                }
            }

            unblockedCoroutines.push(...shouldRunNextFrame);
            shouldRunNextFrame.length = 0;

            this._isInUpdate = false;
        }

        /**
         * 勾选一个coroutine，如果该coroutine应该在下一帧继续运行，则返回true。本方法会将完成的coroutine放回Pool
         * @param coroutine 
         */
        public tickCoroutine(coroutine: CoroutineImpl) {
            const { enumerator } = coroutine;
            const { value, done } = enumerator.next();

            if (done || coroutine.isDone) {
                // 当协程执行完或标记为结束时，回收协程实例并返回 false。
                Pool.free(CoroutineImpl, coroutine);
                return false;
            }

            if (!value) {
                // 如果下一帧没有指定任务，返回 true 让协程继续等待下一帧执行。
                return true;
            }

            if (value instanceof WaitForSeconds) {
                // 如果下一帧需要等待指定时间，则记录等待时间并返回 true。
                coroutine.waitTimer = value.waitTime;
                return true;
            }

            if (typeof value === 'number') {
                // 如果下一帧需要等待指定时间，则记录等待时间并返回 true。
                coroutine.waitTimer = value;
                return true;
            }

            if (typeof value === 'string') {
                // 如果下一帧返回 'break'，标记协程为结束并返回 false。
                if (value === 'break') {
                    Pool.free(CoroutineImpl, coroutine);
                    return false;
                }

                // 否则返回 true 让协程继续等待下一帧执行。
                return true;
            }

            if (typeof value === 'function') {
                // 如果下一帧需要等待另一个协程完成，启动并记录另一个协程实例，并返回 true。
                coroutine.waitForCoroutine = this.startCoroutine(value);
                return true;
            }

            if (value instanceof CoroutineImpl) {
                // 如果下一帧需要等待另一个协程完成，记录另一个协程实例，并返回 true。
                coroutine.waitForCoroutine = value;
                return true;
            }

            // 否则返回 true 让协程继续等待下一帧执行。
            return true;
        }
    }
}