module es {
    /**
     * 允许动作的延迟和重复执行
     */
    export class TimerManager extends GlobalManager {
        public _timers: Timer[] = [];

        public update() {
            for (let i = this._timers.length - 1; i >= 0; i --){
                if (this._timers[i].tick()){
                    this._timers[i].unload();
                    new es.List(this._timers).removeAt(i);
                }
            }
        }

        /**
         * 调度一个一次性或重复的计时器，该计时器将调用已传递的动作
         * @param timeInSeconds
         * @param repeats
         * @param context
         * @param onTime
         */
        public schedule(timeInSeconds: number, repeats: boolean, context: any, onTime: (timer: ITimer)=>void){
            let timer = new Timer();
            timer.initialize(timeInSeconds, repeats, context, onTime);
            this._timers.push(timer);

            return timer;
        }
    }
}