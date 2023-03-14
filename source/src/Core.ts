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
        /**
         * 简化对内部类的全局内容实例的访问
         */
        private static _instance: Core;
        /**
         * 用于确定是否应该使用EntitySystems
         */
        public static entitySystemsEnabled: boolean;
        /**
         * 是否正在debug模式
         * 仅允许在create时进行更改
         */
        public readonly debug: boolean;
        public _nextScene: Scene;
        public _sceneTransition: SceneTransition;

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

        private constructor(debug: boolean = true, enableEntitySystems: boolean = true) {
            Core._instance = this;
            Core.emitter = new Emitter<CoreEvents>();
            Core.emitter.addObserver(CoreEvents.frameUpdated, this.update, this);

            Core.registerGlobalManager(this._coroutineManager);
            Core.registerGlobalManager(new TweenManager());
            Core.registerGlobalManager(this._timerManager);
            Core.entitySystemsEnabled = enableEntitySystems;

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
         * `Core`类的静态方法，用于创建`Core`的实例。
         * @param debug {boolean} 是否为调试模式，默认为`true`
         * @returns {Core} `Core`的实例
         */
        public static create(debug: boolean = true): Core {
            // 如果实例还未被创建，则创建一个新的实例并保存在`_instance`静态属性中
            if (this._instance == null) {
                this._instance = new es.Core(debug);
            }
            // 返回`_instance`静态属性中保存的实例
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
        public static unregisterGlobalManager(manager: GlobalManager) {
            new es.List(this._instance._globalManagers).remove(manager);
            manager.enabled = false;
        }

        /**
         * 获取指定类型的全局管理器实例
         * @param type 管理器类型的构造函数
         * @returns 指定类型的全局管理器实例，如果找不到则返回 null
         */
        public static getGlobalManager<T extends GlobalManager>(type: new (...args) => T): T {
            for (let i = 0, s = Core._instance._globalManagers.length; i < s; ++i) {
                let manager = Core._instance._globalManagers[i];
                if (manager instanceof type)
                    return manager;
            }
            return null;
        }

        /**
         * 临时运行SceneTransition，允许一个场景平滑过渡到另一个场景，并具有自定义效果
         * @param sceneTransition
         */
        public static startSceneTransition<T extends SceneTransition>(sceneTransition: T) {
            Insist.isNull(this._instance._sceneTransition, "在前一个场景转换完成之前，无法启动新的场景转换");
            this._instance._sceneTransition = sceneTransition;
            return sceneTransition;
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
            // 如果debug标志未开启，则直接返回
            if (!this.debug) return;

            // 计算帧率和内存使用情况
            this._frameCounter++; // 帧计数器递增
            this._frameCounterElapsedTime += Time.deltaTime; // 帧计数器累加时间
            if (this._frameCounterElapsedTime >= 1) { // 如果时间已经超过1秒，则计算帧率和内存使用情况
                let memoryInfo = window.performance["memory"]; // 获取内存使用情况
                if (memoryInfo != null) { // 如果内存使用情况存在
                    // 计算内存使用情况并保留2位小数
                    this._totalMemory = Number((memoryInfo.totalJSHeapSize / 1048576).toFixed(2));
                }
                if (this._titleMemory) { // 如果回调函数存在，则执行回调函数，更新标题栏显示
                    this._titleMemory(this._totalMemory, this._frameCounter);
                }
                this._frameCounter = 0; // 重置帧计数器
                this._frameCounterElapsedTime -= 1; // 减去1秒时间
            }
        }

        /**
         * 在一个场景结束后，下一个场景开始之前调用
         */
        public onSceneChanged() {
            Core.emitter.emit(CoreEvents.sceneChanged);
            Time.sceneChanged();
        }

        protected initialize() {

        }

        /**
         * `Core` 类的受保护的 `update` 方法，用于更新游戏状态。
         * @param currentTime 当前时间戳，单位为毫秒，默认值为-1。
         */
        protected update(currentTime: number = -1): void {
            // 如果引擎处于暂停状态，则直接返回，不做任何操作
            if (Core.paused) {
                return;
            }

            // 更新时间戳信息
            Time.update(currentTime, currentTime !== -1);

            // 更新全局管理器和当前场景
            if (this._scene != null) {
                // 依次更新所有启用的全局管理器
                for (const globalManager of this._globalManagers) {
                    if (globalManager.enabled) {
                        globalManager.update();
                    }
                }

                // 如果当前没有场景切换正在进行，或者正在进行的场景切换不需要加载新场景
                if (this._sceneTransition == null || !this._sceneTransition._loadsNewScene) {
                    this._scene.update();
                }
            }

            // 处理场景切换
            if (this._nextScene != null) {
                // 结束当前场景
                this._scene.end();

                // 加载并初始化新场景
                this._scene = this._nextScene;
                this._nextScene = null;
                this.onSceneChanged();
                this._scene.begin();
            }

            // 绘制调试信息
            this.startDebugDraw();
            this.draw();
        }

        protected draw() {
            if (this._sceneTransition != null)
                this._sceneTransition.preRender();

            if (this._sceneTransition != null && !this._sceneTransition.hasPreviousSceneRender) {
                if (this._scene != null) {
                    Core.startCoroutine(this._sceneTransition.onBeginTransition());
                }

                this._sceneTransition.render();
            }
        }
    }
}
