module es {
    /**
     * startCoroutine返回的接口，它提供了中途停止coroutine的能力。
     */
    export interface ICoroutine {
        /**
         * 停止Coroutine
         */
        stop();
        /**
         * 设置Coroutine是否应该使用deltaTime或unscaledDeltaTime进行计时
         * @param useUnscaledDeltaTime 
         */
        setUseUnscaledDeltaTime(useUnscaledDeltaTime: boolean): ICoroutine;
    }

    export class Coroutine {
        /**
         * 导致Coroutine在指定的时间内暂停。在Coroutine.waitForSeconds的基础上，在Coroutine中使用Yield
         * @param seconds 
         */
        public static waitForSeconds(seconds: number) {
            return WaitForSeconds.waiter.wait(seconds);
        }
    }

    /**
     * 帮助类，用于当一个coroutine想要暂停一段时间时。返回Coroutine.waitForSeconds返回其中一个
     */
    export class WaitForSeconds {
        public static waiter: WaitForSeconds = new WaitForSeconds();
        public waitTime: number = 0;

        public wait(seconds: number): WaitForSeconds {
            WaitForSeconds.waiter.waitTime = seconds;
            return WaitForSeconds.waiter;
        }
    }
}