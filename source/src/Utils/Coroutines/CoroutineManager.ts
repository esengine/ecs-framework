module es {
    /**
     * CoroutineManager使用的内部类，用于隐藏协同程序所需的数据
     */
    export class CoroutineImpl implements ICoroutine, IPoolable {
        public enumerator: IEnumerator;
        /**
         * 每当产生延迟时，它就被添加到跟踪延迟的waitTimer中
         */
        public waitTimer: number;
        public isDone: boolean;
        public waitForCoroutine: CoroutineImpl;
        public useUnscaledDeltaTime: boolean = false;

        public stop(){
            this.isDone = true;
        }

        public setUseUnscaledDeltaTime(useUnscaledDeltaTime): es.ICoroutine {
            this.useUnscaledDeltaTime = useUnscaledDeltaTime;
            return this;
        }

        public prepareForuse(){
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

    export interface IEnumerator {
        current: any;
        moveNext(): boolean;
        reset();
    }

    /**
     * 基本CoroutineManager。协同程序可以做以下事情:
     * - return null(在下一帧继续执行)
     * - return Coroutine.waitForSeconds(3)。等待3秒(延时3秒后再次执行)
     * - return startCoroutine(another())(在再次执行之前等待另一个协程)
     */
    export class CoroutineManager extends GlobalManager {
        /**
         * 标记来跟踪何时处于更新循环中。
         * 如果一个新的协程在更新循环期间启动，我们必须将其插入到shouldRunNextFrame列表中，以避免在迭代时修改列表。
         */
        public _isInUpdate: boolean;

        public _unblockedCoroutines: CoroutineImpl[] = [];
        public _shouldRunNextFrame: CoroutineImpl[] = [];

        /**
         * 将i枚举器添加到CoroutineManager。协程在每一帧调用更新之前被执行。
         * @param enumerator
         */
        public startCoroutine(enumerator: IEnumerator) {
            // 查找或创建CoroutineImpl
            let coroutine = Pool.obtain<CoroutineImpl>(CoroutineImpl);
            coroutine.prepareForuse();

            // 设置协程并添加它
            coroutine.enumerator = enumerator;
            let shouldContinueCoroutine = this.tickCoroutine(coroutine);

            // 防止空协程
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
            for (let i = 0; i < this._unblockedCoroutines.length; i ++){
                let coroutine = this._unblockedCoroutines[i];

                // 检查已停止的协程
                if (coroutine.isDone){
                    Pool.free<CoroutineImpl>(coroutine);
                    continue;
                }

                // 我们是否在等待其他协程完成
                if (coroutine.waitForCoroutine != null){
                    if (coroutine.waitForCoroutine.isDone){
                        coroutine.waitForCoroutine = null;
                    }else{
                        this._shouldRunNextFrame.push(coroutine);
                        continue;
                    }
                }

                // 如果我们有计时器，就用它
                if (coroutine.waitTimer > 0){
                    // 还有时间。递减，并再次运行下一帧，确保递减与适当的deltaTime。
                    coroutine.waitTimer -= coroutine.useUnscaledDeltaTime ? Time.unscaledDeltaTime : Time.deltaTime;
                    this._shouldRunNextFrame.push(coroutine);
                    continue;
                }

                if (this.tickCoroutine(coroutine))
                    this._shouldRunNextFrame.push(coroutine);
            }

            this._unblockedCoroutines.length = 0;
            this._unblockedCoroutines.concat(this._shouldRunNextFrame);
            this._shouldRunNextFrame.length = 0;

            this._isInUpdate = false;
        }

        /**
         * 如果协同程序在下一帧继续运行，则返回true。此方法将把完成的协程放回池中!
         * @param coroutine
         */
        public tickCoroutine(coroutine: CoroutineImpl){
            // 这个协同程序已经完成了
            if (!coroutine.enumerator.moveNext() || coroutine.isDone){
                Pool.free<CoroutineImpl>(coroutine);
                return false;
            }

            if (coroutine.enumerator.current == null){
                // 再运行下一帧
                return true;
            }

            if (coroutine.enumerator.current instanceof WaitForSeconds){
                coroutine.waitTimer = (coroutine.enumerator.current as WaitForSeconds).waitTime;
                return true;
            }

            if (coroutine.enumerator.current instanceof Number){
                console.warn("协同程序检查返回一个Number类型，请不要在生产环境使用");
                coroutine.waitTimer = Number(coroutine.enumerator.current);
                return true;
            }

            if (coroutine.enumerator.current instanceof  CoroutineImpl){
                coroutine.waitForCoroutine = coroutine.enumerator.current as CoroutineImpl;
                return true;
            }else {
                return true;
            }
        }
    }
}