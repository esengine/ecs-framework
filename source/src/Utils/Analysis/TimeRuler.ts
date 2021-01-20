module es {
    export class TimeRuler {
        /**
         * 最大条数
         */
        public static readonly maxBars: number = 8;
        /**
         * 每条的最大样本数
         */
        public static readonly maxSamples: number = 256;
        /**
         * 
         */
        public static readonly maxNestCall: number = 32;
        /**
         * 最大显示帧数
         */
        public static readonly maxSampleFrames: number = 4;
        /**
         * 拍摄快照的时间（以帧数为单位）
         */
        public static readonly logSnapDuration: number = 120;
        // 每一帧的日志
        private logs: FrameLog[];
        // 上一帧日志
        private prevLog: FrameLog;
        //目前的日志
        private curLog: FrameLog;
        //当前帧数
        private frameCount: number = 0;
        // 测量时间的秒表
        private stopwatch: Stopwatch = new Stopwatch;
        // 标记信息阵列
        private markers: MarkerInfo[] = [];
        // 从标记名称映射到标记ID的词典
        private markerNameToIdMap: Map<string, number> = new Map();

        public enabled: boolean = true;
        private static _instance: TimeRuler;

        public static get Instance(): TimeRuler {
            if (!this._instance)
                this._instance = new TimeRuler();

            return this._instance;
        }

        /**
         * 你想在Game.Update方法的开头调用StartFrame。
         * 但是当游戏在固定时间步长模式下运行缓慢时，Game.Update会被多次调用。
         * 在这种情况下，我们应该忽略StartFrame的调用，为了做到这一点，我们只需要跟踪StartFrame的调用次数
         */
        private updateCount: number = 0;

        constructor() {
            this.logs = new Array(2);
            for (let i = 0; i < this.logs.length; ++i)
                this.logs[i] = new FrameLog();
        }

        public startFrame() {
            if (!Core.Instance.debug) return;
            // 当这个方法被多次调用时，我们跳过复位帧
            let count = this.updateCount++;
            if (this.enabled && (1 < count && count < TimeRuler.maxSampleFrames))
                return;

            // 更新当前帧记录
            this.prevLog = this.logs[this.frameCount++ & 0x1];
            this.curLog = this.logs[this.frameCount & 0x1];

            let endFrameTime = this.stopwatch.getTime();

            // 更新标记并创建日志
            for (let barIdx = 0; barIdx < this.prevLog.bars.length; ++barIdx) {
                let prevBar = this.prevLog.bars[barIdx];
                let nextBar = this.curLog.bars[barIdx];

                // 重新打开前一帧中没有被调用的EndMark的标记
                for (let nest = 0; nest < prevBar.nestCount; ++nest) {
                    let markerIdx = prevBar.markerNests[nest];

                    prevBar.markers[markerIdx].endTime = endFrameTime;

                    nextBar.markerNests[nest] = nest;
                    nextBar.markers[nest].markerId = prevBar.markers[markerIdx].markerId;
                    nextBar.markers[nest].beginTime = 0;
                    nextBar.markers[nest].endTime = -1;
                    nextBar.markers[nest].color = prevBar.markers[markerIdx].color;
                }

                // 更新标记记录
                for (let markerIdx = 0; markerIdx < prevBar.markCount; ++markerIdx) {
                    let duration = prevBar.markers[markerIdx].endTime - prevBar.markers[markerIdx].beginTime;
                    let markerId = prevBar.markers[markerIdx].markerId;
                    let m = this.markers[markerId];

                    m.logs[barIdx].color = prevBar.markers[markerIdx].color;

                    if (!m.logs[barIdx].initialized) {
                        // 第一帧流程
                        m.logs[barIdx].min = duration;
                        m.logs[barIdx].max = duration;
                        m.logs[barIdx].avg = duration;

                        m.logs[barIdx].initialized = true;
                    } else {
                        // 第一帧后处理
                        m.logs[barIdx].min = Math.min(m.logs[barIdx].min, duration);
                        m.logs[barIdx].max = Math.min(m.logs[barIdx].max, duration);
                        m.logs[barIdx].avg += duration;
                        m.logs[barIdx].avg *= 0.5;

                        if (m.logs[barIdx].samples++ >= TimeRuler.logSnapDuration) {
                            m.logs[barIdx].snapMin = m.logs[barIdx].min;
                            m.logs[barIdx].snapMax = m.logs[barIdx].max;
                            m.logs[barIdx].snapAvg = m.logs[barIdx].avg;
                            m.logs[barIdx].samples = 0;
                        }
                    }
                }

                nextBar.markCount = prevBar.nestCount;
                nextBar.nestCount = prevBar.nestCount;
            }

            this.stopwatch.reset();
            this.stopwatch.start();
        }

        /**
         * 开始测量时间
         * @param markerName 
         * @param color 
         * @param barIndex 
         */
        public beginMark(markerName: string, color: number, barIndex: number = 0) {
            if (!Core.Instance.debug) return;
            if (barIndex < 0 || barIndex >= TimeRuler.maxBars)
                throw new Error('barIndex 越位');

            let bar = this.curLog.bars[barIndex];

            if (bar.markCount >= TimeRuler.maxSamples) {
                throw new Error('超出样本数.\n 要么设置更大的数字为TimeRuler.MaxSmpale，要么降低样本数');
            }

            if (bar.nestCount >= TimeRuler.maxNestCall) {
                throw new Error('nestCount超出.\n 要么将大的设置为TimeRuler.MaxNestCall，要么将小的设置为NestCall');
            }

            // 获取已注册的标记
            let markerId = this.markerNameToIdMap.get(markerName);
            if (markerId == null) {
                // 如果这个标记没有注册，就注册这个
                markerId = this.markers.length;
                this.markerNameToIdMap.set(markerName, markerId);
                this.markers.push(new MarkerInfo(markerName));
            }

            // 开始测量
            bar.markerNests[bar.nestCount++] = bar.markCount;

            // 填充标记参数
            bar.markers[bar.markCount].markerId = markerId;
            bar.markers[bar.markCount].color = color;
            bar.markers[bar.markCount].beginTime = this.stopwatch.getTime();

            bar.markers[bar.markCount].endTime = -1;

            bar.markCount++;
        }

        /**
         * 停止测量
         * @param markerName 
         * @param barIndex 
         */
        public endMark(markerName: string, barIndex: number = 0) {
            if (!Core.Instance.debug) return;
            if (barIndex < 0 || barIndex >= TimeRuler.maxBars)
                throw new Error('barIndex 越位');

            let bar = this.curLog.bars[barIndex];

            if (bar.nestCount <= 0) {
                throw new Error('在调用结束标记方法之前调用beginMark方法');
            }

            let markerId = this.markerNameToIdMap.get(markerName);
            if (markerId == null) {
                throw new Error(`标记${markerName}没有注册。请确认您指定的名称与BeginMark方法使用的名称相同`);
            }

            let markerIdx = bar.markerNests[--bar.nestCount];
            if (bar.markers[markerIdx].markerId != markerId) {
                throw new Error('beginMark/endMark方法的调用顺序不正确. beginMark(A), beginMark(B), endMark(B), endMark(A).但你不能像这样叫它 beginMark(A), beginMark(B), endMark(A), endMark(B)');
            }

            bar.markers[markerIdx].endTime = this.stopwatch.getTime();
        }

        /**
         * 获取给定条形指数和标记名称的平均时间
         * @param barIndex 
         * @param markerName 
         */
        public getAverageTime(barIndex: number, markerName: string) {
            if (barIndex < 0 || barIndex >= TimeRuler.maxBars)
                throw new Error('barIndex 越位');

            let result = 0;
            let markerId = this.markerNameToIdMap.get(markerName);
            if (markerId != null) {
                result = this.markers[markerId].logs[barIndex].avg;
            }

            return result;
        }

        /**
         * 重置标记记录
         */
        public resetLog() {
            if (!Core.Instance.debug) return;
            for (let markerInfo of this.markers) {
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
            }
        }
    }

    /**
     * 标记信息
     */
    class MarkerInfo {
        // 标记的名称
        public name: string;

        public logs: MarkerLog[] = new Array(TimeRuler.maxBars);

        constructor(name: string) {
            this.name = name;

            for (let i = 0; i < TimeRuler.maxBars; ++i)
                this.logs[i] = new MarkerLog();
        }
    }

    /**
     * 标记日志信息
     */
    class MarkerLog {
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

    /**
     * 帧记录信息
     */
    class FrameLog {
        public bars: MarkerCollection[];

        constructor() {
            this.bars = new Array(TimeRuler.maxBars);
            for (let i = 0; i < TimeRuler.maxBars; ++i)
                this.bars[i] = new MarkerCollection();
        }
    }

    /**
     * 收集标记
     */
    class MarkerCollection {
        // 标记收集
        public markers: Marker[] = new Array(TimeRuler.maxSamples);
        public markCount: number = 0;

        public markerNests: number[] = new Array(TimeRuler.maxNestCall);
        public nestCount: number = 0;

        constructor() {
            this.markerNests.fill(0);
            for (let i = 0; i < TimeRuler.maxSamples; ++i)
                this.markers[i] = new Marker();
        }
    }

    /**
     * 标记结构
     */
    class Marker {
        public markerId: number = 0;
        public beginTime: number = 0;
        public endTime: number = 0;
        public color: number = 0x000000;
    }
}