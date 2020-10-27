module es {
    /**
     *  全局核心类
     */
    export class Core extends egret.DisplayObjectContainer {
        /**
         * 核心发射器。只发出核心级别的事件
         */
        public static emitter: Emitter<CoreEvents>;
        /**
         * 是否启用调试渲染
         */
        public static debugRenderEndabled = false;
        /**
         * 全局访问图形设备
         */
        public static graphicsDevice: GraphicsDevice;
        /**
         * 全局内容管理器加载任何应该停留在场景之间的资产
         */
        public static content: ContentManager;
        /**
         * 简化对内部类的全局内容实例的访问
         */
        public static _instance: Core;
        public _nextScene: Scene;
        public _sceneTransition: SceneTransition;
        /**
         * 全局访问系统
         */
        public _globalManagers: GlobalManager[] = [];
        public _coroutineManager: CoroutineManager = new CoroutineManager();
        public _timerManager: TimerManager = new TimerManager();

        constructor() {
            super();

            Core._instance = this;
            Core.emitter = new Emitter<CoreEvents>();
            Core.content = new ContentManager();

            this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);

            Core.registerGlobalManager(this._coroutineManager);
            Core.registerGlobalManager(this._timerManager);
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
                this._instance.addChild(value);
                this._instance._scene = value;
                this._instance._scene.begin();
                Core.Instance.onSceneChanged();
            } else {
                this._instance._nextScene = value;
            }
        }

        /**
         * 临时运行SceneTransition，允许一个场景过渡到另一个平滑的自定义效果。
         * @param sceneTransition
         */
        public static startSceneTransition<T extends SceneTransition>(sceneTransition: T): T {
            if (this._instance._sceneTransition) {
                console.warn("在前一个场景完成之前，不能开始一个新的场景转换。");
                return;
            }

            this._instance._sceneTransition = sceneTransition;
            return sceneTransition;
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
            this._instance._globalManagers.remove(manager);
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
         * 开始了一个协同程序。协程可以使用number延迟几秒，也可以使其他对startCoroutine的调用延迟几秒。
         * 返回null将使协程在下一帧中被执行。
         * @param enumerator
         */
        public static startCoroutine(enumerator: Iterator<any>){
            return this._instance._coroutineManager.startCoroutine(enumerator);
        }

        /**
         * 调度一个一次性或重复的计时器，该计时器将调用已传递的动作
         * @param timeInSeconds
         * @param repeats
         * @param context
         * @param onTime
         */
        public static schedule(timeInSeconds: number, repeats: boolean = false, context: any = null, onTime: (timer: ITimer)=>void){
            return this._instance._timerManager.schedule(timeInSeconds, repeats, context, onTime);
        }

        public onOrientationChanged() {
            Core.emitter.emit(CoreEvents.OrientationChanged);
        }

        public async draw() {
            // this.startDebugDraw(Time.deltaTime);

            if (this._sceneTransition) {
                this._sceneTransition.preRender();

                // 如果我们有场景转换的特殊处理。我们要么渲染场景过渡，要么渲染场景
                if (this._scene && !this._sceneTransition.hasPreviousSceneRender) {
                    this._scene.render();
                    this._scene.postRender();
                    await this._sceneTransition.onBeginTransition();
                } else if (this._sceneTransition) {
                    if (this._scene && this._sceneTransition.isNewSceneLoaded) {
                        this._scene.render();
                        this._scene.postRender();
                    }

                    this._sceneTransition.render();
                }
            } else if (this._scene) {
                this._scene.render();

                Debug.render();

                // 如果我们没有一个活跃的场景转换，就像平常一样渲染
                this._scene.postRender();
            }

            // this.endDebugDraw();
        }

        public startDebugUpdate() {
            TimeRuler.Instance.startFrame();
            TimeRuler.Instance.beginMark("update", 0x00FF00);
        }

        public endDebugUpdate() {
            TimeRuler.Instance.endMark("update");
        }

        public startDebugDraw(elapsedGameTime: number){
            TimeRuler.Instance.beginMark("draw", 0xFFD700);

            // fps 计数器
            this._frameCounter ++;
            this._frameCounterElapsedTime += elapsedGameTime;
            if (this._frameCounterElapsedTime >= 1){
                this._frameCounter = 0;
                this._frameCounterElapsedTime -= 1;
            }
        }

        public endDebugDraw(){
            TimeRuler.Instance.endMark("draw");

            TimeRuler.Instance.render();
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
            Core.emitter.emit(CoreEvents.GraphicsDeviceReset);
        }

        protected initialize() {
            Graphics.Instance = new Graphics();
        }

        protected async update() {
            this.startDebugUpdate();

            // 更新我们所有的系统管理器
            Time.update(egret.getTimer());
            Input.update();

            if (this._scene) {
                for (let i = this._globalManagers.length - 1; i >= 0; i--) {
                    if (this._globalManagers[i].enabled)
                        this._globalManagers[i].update();
                }

                // 仔细阅读:
                // 当场景转换发生时，我们不会更新场景
                // -除非是不改变场景的场景转换(没有理由不更新)
                // -或者它是一个已经切换到新场景的场景转换(新场景需要做它自己的事情)
                if (!this._sceneTransition ||
                    (this._sceneTransition && (!this._sceneTransition.loadsNewScene || this._sceneTransition.isNewSceneLoaded))) {
                    this._scene.update();
                }

                if (this._nextScene) {
                    if (this._scene.parent) this._scene.parent.removeChild(this._scene);
                    this._scene.end();

                    this._scene = this._nextScene;
                    this._nextScene = null;
                    this.onSceneChanged();

                    await this._scene.begin();
                    this.addChild(this._scene);
                }
            }

            this.endDebugUpdate();

            await this.draw();
        }

        private onAddToStage() {
            Core.graphicsDevice = new GraphicsDevice();

            this.addEventListener(egret.Event.RESIZE, this.onGraphicsDeviceReset, this);
            this.addEventListener(egret.StageOrientationEvent.ORIENTATION_CHANGE, this.onOrientationChanged, this);
            this.addEventListener(egret.Event.ENTER_FRAME, this.update, this);

            Input.initialize();
            KeyboardUtils.init();
            this.initialize();
        }
    }
}
