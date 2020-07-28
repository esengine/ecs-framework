module es {
    /**
     * 通过使用这个类，您可以直观地找到瓶颈和基本的CPU使用情况。
     */
    export class TimeRuler {
        /** 最大条数 8 */
        public static readonly maxBars = 8;
        /**  */
        public static readonly maxSamples = 256;
        /** 每条的最大嵌套调用 */
        public static readonly maxNestCall = 32;
        /** 条的高度(以像素为单位) */
        public static readonly barHeight = 8;
        /** 最大显示帧 */
        public static readonly maxSampleFrames = 4;
        /** 持续时间(帧数)为采取抓拍日志。 */
        public static readonly logSnapDuration = 120;
        public static readonly barPadding = 2;
        public static readonly autoAdjustDelay = 30;
        private static _instance;
        /** 获取/设置目标样本帧。 */
        public targetSampleFrames: number;
        /** 获取/设置计时器标尺宽度。 */
        public width: number;
        public enabled: true;
        /**  */
        public showLog = false;
        private _frameKey = 'frame';
        private _logKey = 'log';
        /** 每帧的日志 */
        private _logs: FrameLog[];
        /** 当前显示帧计数 */
        private sampleFrames: number;
        /** TimerRuler画的位置。 */
        private _position: Vector2;
        /** 上一帧日志 */
        private _prevLog: FrameLog;
        /** 当前帧日志 */
        private _curLog: FrameLog;
        /** 当前帧数量 */
        private frameCount: number;
        /**  */
        private markers: MarkerInfo[] = [];
        /** 秒表用来测量时间。 */
        private stopwacth: stopwatch.Stopwatch = new stopwatch.Stopwatch();
        /** 从标记名映射到标记id的字典。 */
        private _markerNameToIdMap: Map<string, number> = new Map<string, number>();
        /**
         * 你想在游戏开始时调用StartFrame更新方法。
         * 当游戏在固定时间步进模式下运行缓慢时，更新会多次调用。
         * 在这种情况下，我们应该忽略StartFrame调用。
         * 为此，我们只需一直跟踪StartFrame调用的次数，直到Draw被调用。
         */
        private _updateCount: number;
        private _frameAdjust: number;

        constructor() {
            this._logs = new Array<FrameLog>(2);
            for (let i = 0; i < this._logs.length; ++i)
                this._logs[i] = new FrameLog();

            this.sampleFrames = this.targetSampleFrames = 1;
            this.width = Core.graphicsDevice.viewport.width * 0.8;

            es.Core.emitter.addObserver(CoreEvents.GraphicsDeviceReset, this.onGraphicsDeviceReset, this);
            this.onGraphicsDeviceReset();
        }

        public static get Instance(): TimeRuler {
            if (!this._instance)
                this._instance = new TimeRuler();
            return this._instance;
        }

        /**
         *
         */
        public startFrame() {
            // 当这个方法被多次调用时，我们跳过重置帧。
            let lock = new LockUtils(this._frameKey);
            lock.lock().then(() => {
                this._updateCount = parseInt(egret.localStorage.getItem(this._frameKey), 10);
                if (isNaN(this._updateCount))
                    this._updateCount = 0;
                let count = this._updateCount;
                count += 1;
                egret.localStorage.setItem(this._frameKey, count.toString());
                if (this.enabled && (1 < count && count < TimeRuler.maxSampleFrames))
                    return;

                // 更新当前帧日志。
                this._prevLog = this._logs[this.frameCount++ & 0x1];
                this._curLog = this._logs[this.frameCount & 0x1];

                let endFrameTime = this.stopwacth.getTime();
                // 更新标记并创建日志。
                for (let barIndex = 0; barIndex < this._prevLog.bars.length; ++barIndex) {
                    let prevBar = this._prevLog.bars[barIndex];
                    let nextBar = this._curLog.bars[barIndex];

                    // 重新打开在前一帧中没有调用结束标记的标记。
                    for (let nest = 0; nest < prevBar.nestCount; ++nest) {
                        let markerIdx = prevBar.markerNests[nest];
                        prevBar.markers[markerIdx].endTime = endFrameTime;
                        nextBar.markerNests[nest] = nest;
                        nextBar.markers[nest].markerId = prevBar.markers[markerIdx].markerId;
                        nextBar.markers[nest].beginTime = 0;
                        nextBar.markers[nest].endTime = -1;
                        nextBar.markers[nest].color = prevBar.markers[markerIdx].color;
                    }

                    // 更新日志标记
                    for (let markerIdx = 0; markerIdx < prevBar.markCount; ++markerIdx) {
                        let duration = prevBar.markers[markerIdx].endTime - prevBar.markers[markerIdx].beginTime;
                        let markerId = prevBar.markers[markerIdx].markerId;
                        let m = this.markers[markerId];

                        m.logs[barIndex].color = prevBar.markers[markerIdx].color;
                        if (!m.logs[barIndex].initialized) {
                            m.logs[barIndex].min = duration;
                            m.logs[barIndex].max = duration;
                            m.logs[barIndex].avg = duration;
                            m.logs[barIndex].initialized = true;
                        } else {
                            m.logs[barIndex].min = Math.min(m.logs[barIndex].min, duration);
                            m.logs[barIndex].max = Math.min(m.logs[barIndex].max, duration);
                            m.logs[barIndex].avg += duration;
                            m.logs[barIndex].avg *= 0.5;

                            if (m.logs[barIndex].samples++ >= TimeRuler.logSnapDuration) {
                                m.logs[barIndex].snapMin = m.logs[barIndex].min;
                                m.logs[barIndex].snapMax = m.logs[barIndex].max;
                                m.logs[barIndex].snapAvg = m.logs[barIndex].avg;
                                m.logs[barIndex].samples = 0;
                            }
                        }
                    }

                    nextBar.markCount = prevBar.nestCount;
                    nextBar.nestCount = prevBar.nestCount;
                }

                this.stopwacth.reset();
                this.stopwacth.start();
            });
        }

        /**
         * 开始测量时间。
         * @param markerName
         * @param color
         */
        public beginMark(markerName: string, color: number, barIndex: number = 0) {
            let lock = new LockUtils(this._frameKey);
            lock.lock().then(() => {
                if (barIndex < 0 || barIndex >= TimeRuler.maxBars)
                    throw new Error("barIndex argument out of range");

                let bar = this._curLog.bars[barIndex];
                if (bar.markCount >= TimeRuler.maxSamples) {
                    throw new Error("exceeded sample count. either set larger number to timeruler.maxsaple or lower sample count");
                }

                if (bar.nestCount >= TimeRuler.maxNestCall) {
                    throw new Error("exceeded nest count. either set larger number to timeruler.maxnestcall or lower nest calls");
                }

                // 获取注册的标记
                let markerId = this._markerNameToIdMap.get(markerName);
                if (isNaN(markerId)) {
                    // 如果此标记未注册，则注册此标记。
                    markerId = this.markers.length;
                    this._markerNameToIdMap.set(markerName, markerId);
                }

                bar.markerNests[bar.nestCount++] = bar.markCount;
                bar.markers[bar.markCount].markerId = markerId;
                bar.markers[bar.markCount].color = color;
                bar.markers[bar.markCount].beginTime = this.stopwacth.getTime();
                bar.markers[bar.markCount].endTime = -1;
            });
        }

        /**
         *
         * @param markerName
         * @param barIndex
         */
        public endMark(markerName: string, barIndex: number = 0) {
            let lock = new LockUtils(this._frameKey);
            lock.lock().then(() => {
                if (barIndex < 0 || barIndex >= TimeRuler.maxBars)
                    throw new Error("barIndex argument out of range");

                let bar = this._curLog.bars[barIndex];
                if (bar.nestCount <= 0) {
                    throw new Error("call beginMark method before calling endMark method");
                }

                let markerId = this._markerNameToIdMap.get(markerName);
                if (isNaN(markerId)) {
                    throw new Error(`Marker ${markerName} is not registered. Make sure you specifed same name as you used for beginMark method`);
                }

                let markerIdx = bar.markerNests[--bar.nestCount];
                if (bar.markers[markerIdx].markerId != markerId) {
                    throw new Error("Incorrect call order of beginMark/endMark method. beginMark(A), beginMark(B), endMark(B), endMark(A) But you can't called it like beginMark(A), beginMark(B), endMark(A), endMark(B).");
                }

                bar.markers[markerIdx].endTime = this.stopwacth.getTime();
            });
        }

        /**
         * 获取给定bar索引和标记名称的平均时间。
         * @param barIndex
         * @param markerName
         */
        public getAverageTime(barIndex: number, markerName: string) {
            if (barIndex < 0 || barIndex >= TimeRuler.maxBars) {
                throw new Error("barIndex argument out of range");
            }
            let result = 0;
            let markerId = this._markerNameToIdMap.get(markerName);
            if (markerId) {
                result = this.markers[markerId].logs[barIndex].avg;
            }

            return result;
        }

        /**
         *
         */
        public resetLog() {
            let lock = new LockUtils(this._logKey);
            lock.lock().then(() => {
                let count = parseInt(egret.localStorage.getItem(this._logKey), 10);
                count += 1;
                egret.localStorage.setItem(this._logKey, count.toString());
                this.markers.forEach(markerInfo => {
                    for (let i = 0; i < markerInfo.logs.length; ++i) {
                        markerInfo.logs[i].initialized = false;
                        markerInfo.logs[i].snapMin = 0;
                        markerInfo.logs[i].snapMax = 0;
                        markerInfo.logs[i].snapAvg = 0;

                        markerInfo.logs[i].min = 0;
                        markerInfo.logs[i].max = 0;
                        markerInfo.logs[i].avg = 0;

                        markerInfo.logs[i].samples = 0;
                    }
                });
            });
        }

        public render(position: Vector2 = this._position, width: number = this.width) {
            egret.localStorage.setItem(this._frameKey, "0");

            if (!this.showLog)
                return;

            let height = 0;
            let maxTime = 0;
            this._prevLog.bars.forEach(bar => {
                if (bar.markCount > 0) {
                    height += TimeRuler.barHeight + TimeRuler.barPadding * 2;
                    maxTime = Math.max(maxTime, bar.markers[bar.markCount - 1].endTime);
                }
            });

            const frameSpan = 1 / 60 * 1000;
            let sampleSpan = this.sampleFrames * frameSpan;

            if (maxTime > sampleSpan) {
                this._frameAdjust = Math.max(0, this._frameAdjust) + 1;
            } else {
                this._frameAdjust = Math.min(0, this._frameAdjust) - 1;
            }

            if (Math.max(this._frameAdjust) > TimeRuler.autoAdjustDelay) {
                this.sampleFrames = Math.min(TimeRuler.maxSampleFrames, this.sampleFrames);
                this.sampleFrames = Math.max(this.targetSampleFrames, (maxTime / frameSpan) + 1);

                this._frameAdjust = 0;
            }

            let msToPs = width / sampleSpan;
            let startY = position.y - (height - TimeRuler.barHeight);
            let y = startY;

            // TODO: draw
        }

        private onGraphicsDeviceReset() {
            let layout = new Layout();
            this._position = layout.place(new Vector2(this.width, TimeRuler.barHeight), 0, 0.01, Alignment.bottomCenter).location;
        }
    }

    /**
     * 日志信息
     */
    export class FrameLog {
        public bars: MarkerCollection[];

        constructor() {
            this.bars = new Array<MarkerCollection>(TimeRuler.maxBars);
            this.bars.fill(new MarkerCollection(), 0, TimeRuler.maxBars);
        }
    }

    /**
     * 标记的集合
     */
    export class MarkerCollection {
        public markers: Marker[] = new Array<Marker>(TimeRuler.maxSamples);
        public markCount: number = 0;
        public markerNests: number[] = new Array<number>(TimeRuler.maxNestCall);
        public nestCount: number = 0;

        constructor() {
            this.markers.fill(new Marker(), 0, TimeRuler.maxSamples);
            this.markerNests.fill(0, 0, TimeRuler.maxNestCall);
        }
    }

    export class Marker {
        public markerId: number = 0;
        public beginTime: number = 0;
        public endTime: number = 0;
        public color: number = 0x000000;
    }

    export class MarkerInfo {
        public name: string;
        public logs: MarkerLog[] = new Array<MarkerLog>(TimeRuler.maxBars);

        constructor(name) {
            this.name = name;
            this.logs.fill(new MarkerLog(), 0, TimeRuler.maxBars);
        }
    }

    export class MarkerLog {
        public snapMin: number = 0;
        public snapMax: number = 0;
        public snapAvg: number = 0;
        public min: number = 0;
        public max: number = 0;
        public avg: number = 0;
        public samples: number = 0;
        public color: number = 0x000000;
        public initialized: boolean = false;
    }
}
