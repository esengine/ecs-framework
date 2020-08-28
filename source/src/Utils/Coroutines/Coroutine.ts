module es {
    /**
     * startCoroutine返回的接口，提供了在执行中停止协同程序的能力
     */
    export interface ICoroutine {
        /**
         * 停止协同程序
         */
        stop();

        /**
         * 设置协程应该使用时间增量还是使用非缩放时间增量来计时
         * @param useUnscaledDeltaTime
         */
        setUseUnscaledDeltaTime(useUnscaledDeltaTime): ICoroutine;
    }

    export class Coroutine {
        public static waitForSeconds(seconds: number){
            return WaitForSeconds.waiter.wait(seconds);
        }
    }

    /**
     * 协作程序需要暂停一段时间时的助手类。
     * 返回协同程序。
     * waitForSeconds返回number。
     */
    export class WaitForSeconds {
        public static waiter: WaitForSeconds = new WaitForSeconds();
        public waitTime: number;

        public wait(seconds: number): WaitForSeconds {
            WaitForSeconds.waiter.waitTime = seconds;
            return WaitForSeconds.waiter;
        }
    }
}