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
        /** 获取/设置日志显示或否 */
        public showLog = false;
        /** 每帧的日志 */
        public logs: FrameLog[];
        /** 当前显示帧计数 */
        private sampleFrames: number;
        /** TimerRuler画的位置。 */
        private _position: Vector2;
        /** 上一帧日志 */
        private prevLog: FrameLog;
        /** 当前帧日志 */
        private curLog: FrameLog;
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

        /** 画透明背景 */
        private _rectShape1: egret.Shape = new egret.Shape();
        private _rectShape2: egret.Shape = new egret.Shape();
        private _rectShape3: egret.Shape = new egret.Shape();
        private _rectShape4: egret.Shape = new egret.Shape();
        private _rectShape5: egret.Shape = new egret.Shape();
        private _rectShape6: egret.Shape = new egret.Shape();

        constructor() {
            this.logs = new Array<FrameLog>(2);
            for (let i = 0; i < this.logs.length; ++i)
                this.logs[i] = new FrameLog();

            this.sampleFrames = this.targetSampleFrames = 1;
            this.width = Math.floor(Core.graphicsDevice.viewport.width * 0.8);

            es.Core.emitter.addObserver(CoreEvents.GraphicsDeviceReset, this.onGraphicsDeviceReset, this);
            this.onGraphicsDeviceReset();

            es.Core.Instance.stage.addChild(this._rectShape1);
            es.Core.Instance.stage.addChild(this._rectShape2);
            es.Core.Instance.stage.addChild(this._rectShape3);
            es.Core.Instance.stage.addChild(this._rectShape4);
            es.Core.Instance.stage.addChild(this._rectShape5);
            es.Core.Instance.stage.addChild(this._rectShape6);
        }

        public static get Instance(): TimeRuler {
            if (!this._instance)
                this._instance = new TimeRuler();
            return this._instance;
        }

        /**
         * 开始新的帧
         */
        public startFrame() {
            //  当这个方法被多次调用时，我们跳过复位帧。
            if (isNaN(this._updateCount))
                this._updateCount = 0;
            let count = this._updateCount ++;
            if (this.enabled && (1 < count && count < TimeRuler.maxSampleFrames))
                return;

            // 更新当前帧记录
            this.prevLog = this.logs[this.frameCount++ & 0x1];
            this.curLog = this.logs[this.frameCount & 0x1];

            let endFrameTime = this.stopwacth.getTime();
            // 更新标记并创建日志。
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

                // 更新日志标记
                for (let markerIdx = 0; markerIdx < prevBar.markCount; ++markerIdx) {
                    let duration = prevBar.markers[markerIdx].endTime - prevBar.markers[markerIdx].beginTime;
                    let markerId = prevBar.markers[markerIdx].markerId;
                    let m = this.markers[markerId];

                    m.logs[barIdx].color = prevBar.markers[markerIdx].color;
                    if (!m.logs[barIdx].initialized) {
                        m.logs[barIdx].min = duration;
                        m.logs[barIdx].max = duration;
                        m.logs[barIdx].avg = duration;
                        m.logs[barIdx].initialized = true;
                    } else {
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

            this.stopwacth.reset();
            this.stopwacth.start();
        }

        /**
         * 开始测量时间。
         * @param markerName
         * @param color
         * @param barIndex
         */
        public beginMark(markerName: string, color: number, barIndex: number = 0) {
            if (barIndex < 0 || barIndex >= TimeRuler.maxBars)
                throw new Error("barIndex argument out of range");

            let bar = this.curLog.bars[barIndex];
            if (bar.markCount >= TimeRuler.maxSamples) {
                throw new Error("超出采样次数，可以设置更大的数字为timeruler.maxsaple，或者降低采样次数");
            }

            if (bar.nestCount >= TimeRuler.maxNestCall) {
                throw new Error("超出采样次数，可以设置更大的数字为timeruler.maxsaple，或者降低采样次数");
            }

            // 获取注册的标记
            let markerId = this._markerNameToIdMap.get(markerName);
            if (isNaN(markerId)) {
                // 如果此标记未注册，则注册此标记。
                markerId = this.markers.length;
                this._markerNameToIdMap.set(markerName, markerId);
                this.markers.push(new MarkerInfo(markerName));
            }

            // 开始测量
            bar.markerNests[bar.nestCount++] = bar.markCount;

            // 填充标记参数
            bar.markers[bar.markCount].markerId = markerId;
            bar.markers[bar.markCount].color = color;
            bar.markers[bar.markCount].beginTime = this.stopwacth.getTime();

            bar.markers[bar.markCount].endTime = -1;

            bar.markCount ++;
        }

        /**
         *
         * @param markerName
         * @param barIndex
         */
        public endMark(markerName: string, barIndex: number = 0) {
            if (barIndex < 0 || barIndex >= TimeRuler.maxBars)
                throw new Error("barIndex参数超出范围");

            let bar = this.curLog.bars[barIndex];
            if (bar.nestCount <= 0) {
                throw new Error("先调用beginMark方法，再调用endMark方法");
            }

            let markerId = this._markerNameToIdMap.get(markerName);
            if (isNaN(markerId)) {
                throw new Error(`标记 ${markerName} 未注册。请确认您指定的名称与 beginMark 方法使用的名称相同`);
            }

            let markerIdx = bar.markerNests[--bar.nestCount];
            if (bar.markers[markerIdx].markerId != markerId) {
                throw new Error("beginMark/endMark方法的调用顺序不正确，beginMark(A)，beginMark(B)，endMark(B)，endMark(A)，但你不能像beginMark(A)，beginMark(B)，endMark(A)，endMark(B)这样调用。");
            }

            bar.markers[markerIdx].endTime = this.stopwacth.getTime();
        }

        /**
         * 获取给定bar索引和标记名称的平均时间。
         * @param barIndex
         * @param markerName
         */
        public getAverageTime(barIndex: number, markerName: string) {
            if (barIndex < 0 || barIndex >= TimeRuler.maxBars) {
                throw new Error("barIndex参数超出范围");
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
        }

        public render(position: Vector2 = this._position, width: number = this.width) {
            if (!this.showLog)
                return;

            let height = 0;
            let maxTime = 0;
            this.prevLog.bars.forEach(bar => {
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
                this.sampleFrames = Math.max(this.targetSampleFrames, Math.floor(maxTime / frameSpan) + 1);

                this._frameAdjust = 0;
            }

            let msToPs = width / sampleSpan;
            let startY = position.y - (height - TimeRuler.barHeight);
            let y = startY;

            // 画透明背景
            let rc = new Rectangle(position.x, y, width, height);
            this._rectShape1.graphics.clear();
            this._rectShape1.graphics.beginFill(0x000000, 128 / 255);
            this._rectShape1.graphics.drawRect(rc.x, rc.y, rc.width, rc.height);
            this._rectShape1.graphics.endFill();

            // 为每条线画标记
            rc.height = TimeRuler.barHeight;
            this._rectShape2.graphics.clear();
            for (let bar of this.prevLog.bars){
                rc.y = y + TimeRuler.barPadding;
                if (bar.markCount > 0){
                    for (let j = 0; j < bar.markCount; ++j){
                        let bt = bar.markers[j].beginTime;
                        let et = bar.markers[j].endTime;
                        let sx = Math.floor(position.x + bt * msToPs);
                        let ex = Math.floor(position.x + et * msToPs);
                        rc.x = sx;
                        rc.width = Math.max(ex - sx, 1);

                        this._rectShape2.graphics.beginFill(bar.markers[j].color);
                        this._rectShape2.graphics.drawRect(rc.x, rc.y, rc.width, rc.height);
                        this._rectShape2.graphics.endFill();
                    }
                }

                y += TimeRuler.barHeight + TimeRuler.barPadding;
            }

            // 画网格线
            // 每个网格代表ms
            rc = new Rectangle(position.x, startY, 1, height);
            this._rectShape3.graphics.clear();
            for (let t = 1; t < sampleSpan; t += 1){
                rc.x = Math.floor(position.x + t * msToPs);
                this._rectShape3.graphics.beginFill(0x808080);
                this._rectShape3.graphics.drawRect(rc.x, rc.y, rc.width, rc.height);
                this._rectShape3.graphics.endFill();
            }

            // 画frame grid
            this._rectShape4.graphics.clear();
            for (let i = 0; i <= this.sampleFrames; ++i){
                rc.x = Math.floor(position.x + frameSpan * i * msToPs);
                this._rectShape4.graphics.beginFill(0xFFFFFF);
                this._rectShape4.graphics.drawRect(rc.x, rc.y, rc.width, rc.height);
                this._rectShape4.graphics.endFill();
            }

            // TODO: 绘制字体
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
