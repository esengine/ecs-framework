module es {
    /**
     *  全局核心类
     */
    export class Core {
        /**
         * 核心发射器。只发出核心级别的事件
         */
        public static emitter: Emitter<CoreEvents>;
        public static paused = false;
        /**
         * 是否启用调试渲染
         */
        public static debugRenderEndabled = false;
        public static content: ContentManager;
        /**
         * 简化对内部类的全局内容实例的访问
         */
        private static _instance: Core;
        /**
         * 用于确定是否应该使用EntitySystems
         */
        public static entitySystemsEnabled: boolean;

        /**
         * egret舞台
         */
        public static stage: egret.Stage;
        /**
         * 是否正在debug模式
         * 仅允许在create时进行更改
         */
        public readonly debug: boolean;
        public _nextScene: Scene;
        /**
         * 用于凝聚GraphicsDeviceReset事件
         */
        public _graphicsDeviceChangeTimer: ITimer;
        /**
         * 全局访问系统
         */
        public _globalManagers: GlobalManager[] = [];
        public _coroutineManager: CoroutineManager = new CoroutineManager();
        public _timerManager: TimerManager = new TimerManager();

        private constructor(stage: egret.Stage, debug: boolean = true, enableEntitySystems: boolean = true) {
            Core._instance = this;
            Core.stage = stage;
            Core.emitter = new Emitter<CoreEvents>();
            Core.emitter.addObserver(CoreEvents.frameUpdated, this.update, this);

            Core.content = new ContentManager();

            Core.registerGlobalManager(this._coroutineManager);
            Core.registerGlobalManager(new TweenManager());
            Core.registerGlobalManager(this._timerManager);
            Core.entitySystemsEnabled = enableEntitySystems;

            this.registerCoreEvent();
            this.debug = debug;
            this.initialize();
        }

        /**
         * 提供对单例/游戏实例的访问
         * @constructor
         */
        public static get Instance() {
            return this._instance;
        }

        public _frameCounterElapsedTime: number = 0;
        public _frameCounter: number = 0;
        public _totalMemory: number = 0;
        public _titleMemory: (totalMemory: number, frameCounter: number) => void;
        public _scene: Scene;

        /**
         * 当前活动的场景。注意，如果设置了该设置，在更新结束之前场景实际上不会改变
         */
        public static get scene() {
            if (!this._instance)
                return null;
            return this._instance._scene;
        }

        /**
         * 当前活动的场景。注意，如果设置了该设置，在更新结束之前场景实际上不会改变
         * @param value
         */
        public static set scene(value: Scene) {
            Insist.isNotNull(value, "场景不能为空");

            if (this._instance._scene == null) {
                this._instance._scene = value;
                this._instance.onSceneChanged();
                this._instance._scene.begin();
            } else {
                this._instance._nextScene = value;
            }
        }

        /**
         * 默认实现创建核心
         */
        public static create(stage: egret.Stage, debug: boolean = true): Core {
            if (this._instance == null) {
                this._instance = new es.Core(stage, debug);
            }
            return this._instance;
        }

        /**
         * 添加一个全局管理器对象，它的更新方法将调用场景前的每一帧。
         * @param manager
         */
        public static registerGlobalManager(manager: es.GlobalManager) {
            this._instance._globalManagers.push(manager);
            manager.enabled = true;
        }

        /**
         * 删除全局管理器对象
         * @param manager
         */
        public static unregisterGlobalManager(manager: es.GlobalManager) {
            new es.List(this._instance._globalManagers).remove(manager);
            manager.enabled = false;
        }

        /**
         * 获取类型为T的全局管理器
         * @param type
         */
        public static getGlobalManager<T extends es.GlobalManager>(type: new (...args) => T): T {
            for (let i = 0, s = Core._instance._globalManagers.length; i < s; ++ i) {
                let manager = Core._instance._globalManagers[i];
                if (manager instanceof type)
                    return manager;
            }
            return null;
        }

        /**
         * 启动一个coroutine。Coroutine可以将number延时几秒或延时到其他startCoroutine.Yielding 
         * null将使coroutine在下一帧被执行。
         * @param enumerator 
         */
        public static startCoroutine(enumerator): ICoroutine {
            return this._instance._coroutineManager.startCoroutine(enumerator);
        }

        /**
         * 调度一个一次性或重复的计时器，该计时器将调用已传递的动作
         * @param timeInSeconds
         * @param repeats
         * @param context
         * @param onTime
         */
        public static schedule(timeInSeconds: number, repeats: boolean = false, context: any = null, onTime: (timer: ITimer) => void) {
            return this._instance._timerManager.schedule(timeInSeconds, repeats, context, onTime);
        }

        public startDebugDraw() {
            if (!this.debug) return;
            this._frameCounter++;
            this._frameCounterElapsedTime += Time.deltaTime;
            if (this._frameCounterElapsedTime >= 1) {
                let memoryInfo = window.performance["memory"];
                if (memoryInfo != null) {
                    this._totalMemory = Number((memoryInfo.totalJSHeapSize / 1048576).toFixed(2));
                }
                if (this._titleMemory) this._titleMemory(this._totalMemory, this._frameCounter);
                this._frameCounter = 0;
                this._frameCounterElapsedTime -= 1;
            }
        }

        /**
         * 在一个场景结束后，下一个场景开始之前调用
         */
        public onSceneChanged() {
            Time.sceneChanged();
        }

        public registerCoreEvent() {
            egret.lifecycle.addLifecycleListener((context) => {
                context.onUpdate = () => {
                    es.Core.emitter.emit(es.CoreEvents.frameUpdated);
                }
            });

            egret.lifecycle.onPause = () => {
                egret.ticker.pause();
                Core.paused = true;
            };

            egret.lifecycle.onResume = () => {
                egret.ticker.resume();
                Time.pauseToResume();
                Core.paused = false;
            };
        }

        protected initialize() {

        }

        protected async update(currentTime: number = -1) {
            if (Core.paused) {
                return;
            }

            Time.update(currentTime, currentTime != -1);
            if (this._scene != null) {
                for (let i = this._globalManagers.length - 1; i >= 0; i--) {
                    if (this._globalManagers[i].enabled)
                        this._globalManagers[i].update();
                }

                this._scene.update();

                if (this._nextScene != null) {
                    this._scene.end();

                    Debug.log(LogType.info, "场景 {0} 切换至另一个场景 {1}", this._scene.name, this._nextScene.name);
                    this._scene = this._nextScene;
                    this._nextScene = null;
                    this.onSceneChanged();

                    this._scene.begin();
                }
            }

            this.startDebugDraw();
        }
    }
}
