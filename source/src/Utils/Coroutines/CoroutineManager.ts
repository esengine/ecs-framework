module es {
    /**
     * CoroutineManager用于隐藏Coroutine所需数据的内部类
     */
    export class CoroutineImpl implements ICoroutine, IPoolable {
        public enumerator: any;

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
         * 将IEnumerator添加到CoroutineManager中
         * Coroutine在每一帧调用Update之前被执行
         * @param enumerator 
         */
        public startCoroutine(enumerator: any) {
            // 找到或创建一个CoroutineImpl
            let coroutine = Pool.obtain<CoroutineImpl>(CoroutineImpl);
            coroutine.prepareForUse();

            // 设置coroutine并添加它
            coroutine.enumerator = enumerator;
            let shouldContinueCoroutine = this.tickCoroutine(coroutine);

            if (!shouldContinueCoroutine)
                return null;

            if (this._isInUpdate)
                this._shouldRunNextFrame.push(coroutine);
            else
                this._unblockedCoroutines.push(coroutine);

            return coroutine;
        }

        public update() {
            this._isInUpdate = true;
            for (let i = 0; i < this._unblockedCoroutines.length; i++) {
                let coroutine = this._unblockedCoroutines[i];

                if (coroutine.isDone) {
                    Pool.free(coroutine);
                    continue;
                }

                if (coroutine.waitForCoroutine != null) {
                    if (coroutine.waitForCoroutine.isDone) {
                        coroutine.waitForCoroutine = null;
                    } else {
                        this._shouldRunNextFrame.push(coroutine);
                        continue;
                    }
                }

                if (coroutine.waitTimer > 0) {
                    // 递减，然后再运行下一帧，确保用适当的deltaTime递减
                    coroutine.waitTimer -= coroutine.useUnscaledDeltaTime ? Time.unscaledDeltaTime : Time.deltaTime;
                    this._shouldRunNextFrame.push(coroutine);
                    continue;
                }

                if (this.tickCoroutine(coroutine))
                    this._shouldRunNextFrame.push(coroutine);
            }

            let linqCoroutines = new linq.List(this._unblockedCoroutines);
            linqCoroutines.clear();
            linqCoroutines.addRange(this._shouldRunNextFrame);
            this._shouldRunNextFrame.length = 0;

            this._isInUpdate = false;
        }

        /**
         * 勾选一个coroutine，如果该coroutine应该在下一帧继续运行，则返回true。本方法会将完成的coroutine放回Pool
         * @param coroutine 
         */
        public tickCoroutine(coroutine: CoroutineImpl) {
            let chain = coroutine.enumerator.next();
            if (chain.done || coroutine.isDone) {
                Pool.free(coroutine);
                return false;
            }

            if (chain.value == null) {
                // 下一帧再运行
                return true;
            }

            if (chain.value instanceof WaitForSeconds) {
                coroutine.waitTimer = chain.value.waitTime;
                return true;
            }

            if (typeof chain.value == 'number') {
                coroutine.waitTimer = chain.value;
                return true;
            }

            if (chain.value instanceof CoroutineImpl) {
                coroutine.waitForCoroutine = chain.value;
                return true;
            } else {
                return true;
            }
        }
    }
}