namespace stopwatch {
    /**
     * 记录时间的持续时间，一些设计灵感来自物理秒表。
     */
    export class Stopwatch {
        /**
         * 秒表启动的系统时间。
         * undefined，如果秒表尚未启动，或已复位。
         */
        private _startSystemTime: number | undefined;
        /**
         * 秒表停止的系统时间。
         * undefined，如果秒表目前没有停止，尚未开始，或已复位。
         */
        private _stopSystemTime: number | undefined;
        /** 自上次复位以来，秒表已停止的系统时间总数。 */
        private _stopDuration: number = 0;
        /**
         * 用秒表计时，当前等待的切片开始的时间。
         * undefined，如果秒表尚未启动，或已复位。
         */
        private _pendingSliceStartStopwatchTime: number | undefined;
        /**
         * 记录自上次复位以来所有已完成切片的结果。
         */
        private _completeSlices: Slice[] = [];

        constructor(private readonly getSystemTime = _defaultSystemTimeGetter) {
        }

        public getState() {
            if (this._startSystemTime === undefined) {
                return State.IDLE;
            } else if (this._stopSystemTime === undefined) {
                return State.RUNNING;
            } else {
                return State.STOPPED;
            }
        }

        public isIdle() {
            return this.getState() === State.IDLE;
        }

        public isRunning() {
            return this.getState() === State.RUNNING;
        }

        public isStopped() {
            return this.getState() === State.STOPPED;
        }

        /**
         *
         */
        public slice() {
            return this.recordPendingSlice();
        }

        /**
         * 获取自上次复位以来该秒表已完成/记录的所有片的列表。
         */
        public getCompletedSlices(): Slice[] {
            return Array.from(this._completeSlices);
        }

        /**
         * 获取自上次重置以来该秒表已完成/记录的所有片的列表，以及当前挂起的片。
         */
        public getCompletedAndPendingSlices(): Slice[] {
            return [...this._completeSlices, this.getPendingSlice()];
        }

        /**
         * 获取关于这个秒表当前挂起的切片的详细信息。
         */
        public getPendingSlice(): Slice {
            return this.calculatePendingSlice();
        }

        /**
         * 获取当前秒表时间。这是这个秒表自上次复位以来运行的系统时间总数。
         */
        public getTime() {
            return this.caculateStopwatchTime();
        }

        /**
         * 完全重置这个秒表到它的初始状态。清除所有记录的运行持续时间、切片等。
         */
        public reset() {
            this._startSystemTime = this._pendingSliceStartStopwatchTime = this._stopSystemTime = undefined;
            this._stopDuration = 0;
            this._completeSlices = [];
        }

        /**
         * 开始(或继续)运行秒表。
         * @param forceReset
         */
        public start(forceReset: boolean = false) {
            if (forceReset) {
                this.reset();
            }

            if (this._stopSystemTime !== undefined) {
                const systemNow = this.getSystemTime();
                const stopDuration = systemNow - this._stopSystemTime;

                this._stopDuration += stopDuration;
                this._stopSystemTime = undefined;
            } else if (this._startSystemTime === undefined) {
                const systemNow = this.getSystemTime();
                this._startSystemTime = systemNow;
                this._pendingSliceStartStopwatchTime = 0;
            }
        }

        /**
         *
         * @param recordPendingSlice
         */
        public stop(recordPendingSlice: boolean = false) {
            if (this._startSystemTime === undefined) {
                return 0;
            }

            const systemTimeOfStopwatchTime = this.getSystemTimeOfCurrentStopwatchTime();

            if (recordPendingSlice) {
                this.recordPendingSlice(this.caculateStopwatchTime(systemTimeOfStopwatchTime));
            }

            this._stopSystemTime = systemTimeOfStopwatchTime;
            return this.getTime();
        }

        /**
         * 计算指定秒表时间的当前挂起片。
         * @param endStopwatchTime
         */
        private calculatePendingSlice(endStopwatchTime?: number): Slice {
            if (this._pendingSliceStartStopwatchTime === undefined) {
                return Object.freeze({startTime: 0, endTime: 0, duration: 0});
            }

            if (endStopwatchTime === undefined) {
                endStopwatchTime = this.getTime();
            }

            return Object.freeze({
                startTime: this._pendingSliceStartStopwatchTime,
                endTime: endStopwatchTime,
                duration: endStopwatchTime - this._pendingSliceStartStopwatchTime
            });
        }

        /**
         * 计算指定系统时间的当前秒表时间。
         * @param endSystemTime
         */
        private caculateStopwatchTime(endSystemTime?: number) {
            if (this._startSystemTime === undefined)
                return 0;

            if (endSystemTime === undefined)
                endSystemTime = this.getSystemTimeOfCurrentStopwatchTime();

            return endSystemTime - this._startSystemTime - this._stopDuration;
        }

        /**
         * 获取与当前秒表时间等效的系统时间。
         * 如果该秒表当前停止，则返回该秒表停止时的系统时间。
         */
        private getSystemTimeOfCurrentStopwatchTime() {
            return this._stopSystemTime === undefined ? this.getSystemTime() : this._stopSystemTime;
        }

        /**
         * 结束/记录当前挂起的片的私有实现。
         * @param endStopwatchTime
         */
        private recordPendingSlice(endStopwatchTime?: number) {
            if (this._pendingSliceStartStopwatchTime !== undefined) {
                if (endStopwatchTime === undefined) {
                    endStopwatchTime = this.getTime();
                }

                const slice = this.calculatePendingSlice(endStopwatchTime);

                this._pendingSliceStartStopwatchTime = slice.endTime;
                this._completeSlices.push(slice);
                return slice;
            } else {
                return this.calculatePendingSlice();
            }
        }
    }

    /**
     * 返回某个系统的“当前时间”的函数。
     * 惟一的要求是，对该函数的每次调用都必须返回一个大于或等于前一次对该函数的调用的数字。
     */
    export type GetTimeFunc = () => number;

    enum State {
        /** 秒表尚未启动，或已复位。 */
        IDLE = "IDLE",
        /** 秒表正在运行。 */
        RUNNING = "RUNNING",
        /** 秒表以前还在跑，但现在已经停了。 */
        STOPPED = "STOPPED"
    }

    export function setDefaultSystemTimeGetter(systemTimeGetter: GetTimeFunc = Date.now) {
        _defaultSystemTimeGetter = systemTimeGetter;
    }

    /**
     * 由秒表记录的单个“薄片”的测量值
     */
    interface Slice {
        /** 秒表显示的时间在这一片开始的时候。 */
        readonly startTime: number;
        /** 秒表在这片片尾的时间。 */
        readonly endTime: number;
        /** 该切片的运行时间 */
        readonly duration: number;
    }

    /** 所有新实例的默认“getSystemTime”实现 */
    let _defaultSystemTimeGetter: GetTimeFunc = Date.now;
}
