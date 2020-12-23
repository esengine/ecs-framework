module es {
    /**
     *  全局核心类
     */
    export class Core {
        /**
         * 核心发射器。只发出核心级别的事件
         */
        public static emitter: Emitter<CoreEvents>;
        /**
         * 启用/禁用焦点丢失时的暂停。如果为真，则不调用更新或渲染方法
         */
        public static pauseOnFocusLost = true;
        /**
         * 是否启用调试渲染
         */
        public static debugRenderEndabled = false;
        /**
         * 简化对内部类的全局内容实例的访问
         */
        public static _instance: Core;
        /**
         * 用于确定是否应该使用EntitySystems
         */
        public static entitySystemsEnabled: boolean;

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
        public width: number;
        public height: number;

        constructor(width: number, height: number, enableEntitySystems: boolean = true) {
            this.width = width;
            this.height = height;

            Core._instance = this;
            Core.emitter = new Emitter<CoreEvents>();
            Core.emitter.addObserver(CoreEvents.FrameUpdated, this.update, this);

            Core.registerGlobalManager(this._coroutineManager);
            Core.registerGlobalManager(this._timerManager);
            Core.entitySystemsEnabled = enableEntitySystems;

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
            if (!value) {
                console.error("场景不能为空");
                return;
            }

            if (this._instance._scene == null) {
                this._instance._scene = value;
                this._instance.onSceneChanged();
                this._instance._scene.begin();
            } else {
                this._instance._nextScene = value;
            }
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
            new linq.List(this._instance._globalManagers).remove(manager);
            manager.enabled = false;
        }

        /**
         * 获取类型为T的全局管理器
         * @param type
         */
        public static getGlobalManager<T extends es.GlobalManager>(type): T {
            for (let i = 0; i < this._instance._globalManagers.length; i++) {
                if (this._instance._globalManagers[i] instanceof type)
                    return this._instance._globalManagers[i] as T;
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

        public onOrientationChanged() {
            Core.emitter.emit(CoreEvents.OrientationChanged);
        }

        public startDebugDraw() {
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
            Core.emitter.emit(CoreEvents.SceneChanged);
            Time.sceneChanged();
        }

        /**
         * 当屏幕大小发生改变时调用
         */
        protected onGraphicsDeviceReset() {
            // 我们用这些来避免垃圾事件的发生
            if (this._graphicsDeviceChangeTimer != null) {
                this._graphicsDeviceChangeTimer.reset();
            } else {
                this._graphicsDeviceChangeTimer = Core.schedule(0.05, false, this, t => {
                    (t.context as Core)._graphicsDeviceChangeTimer = null;
                    Core.emitter.emit(CoreEvents.GraphicsDeviceReset);
                });
            }
        }

        protected initialize() {

        }

        protected async update(currentTime?: number) {
            if (currentTime != null) Time.update(currentTime);
            if (this._scene != null) {
                for (let i = this._globalManagers.length - 1; i >= 0; i--) {
                    if (this._globalManagers[i].enabled)
                        this._globalManagers[i].update();
                }

                this._scene.update();

                if (this._nextScene != null) {
                    this._scene.end();

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
