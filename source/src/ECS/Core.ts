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
        public _sceneTransition: SceneTransition;
        /**
         * 用于凝聚GraphicsDeviceReset事件
         */
        public _graphicsDeviceChangeTimer: ITimer;
        /**
         * 全局访问系统
         */
        public _globalManagers: GlobalManager[] = [];
        public _timerManager: TimerManager = new TimerManager();
        public width: number;
        public height: number;

        constructor(width: number, height: number, enableEntitySystems: boolean = true) {
            this.width = width;
            this.height = height;

            Core._instance = this;
            Core.emitter = new Emitter<CoreEvents>();
            Core.emitter.addObserver(CoreEvents.FrameUpdated, this.update, this);

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
            if (this._sceneTransition != null) {
                this._sceneTransition.preRender();

                // 如果有的话，我们会对SceneTransition进行特殊处理。
                // 我们要么渲染SceneTransition，要么渲染Scene的
                if (this._sceneTransition != null){
                    if (this._scene != null && !this._sceneTransition.hasPreviousSceneRender) {
                        this._scene.render();
                        this._scene.postRender();
                        await this._sceneTransition.onBeginTransition();
                    } else if (this._scene != null && this._sceneTransition.isNewSceneLoaded) {
                        this._scene.render();
                        this._scene.postRender();
                    }

                    this._sceneTransition.render();
                }
            } else if (this._scene) {
                this._scene.render();

                // 如如果我们没有一个活动的SceneTransition，就像往常一样渲染
                this._scene.postRender();
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
            if (this._graphicsDeviceChangeTimer != null){
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

        protected async update() {
            if (this._scene != null) {
                for (let i = this._globalManagers.length - 1; i >= 0; i--) {
                    if (this._globalManagers[i].enabled)
                        this._globalManagers[i].update();
                }

                // 仔细阅读:
                // 当场景转换发生时，我们不更新场景
                // - 除非是不改变场景的SceneTransition(没有理由不更新)
                // - 或者是一个已经切换到新场景的SceneTransition（新场景需要做它的事情）
                if (!this._sceneTransition ||
                    (this._sceneTransition && 
                    (!this._sceneTransition.loadsNewScene || this._sceneTransition.isNewSceneLoaded))) {
                    this._scene.update();
                }

                if (this._nextScene != null) {
                    this._scene.end();

                    this._scene = this._nextScene;
                    this._nextScene = null;
                    this.onSceneChanged();

                    this._scene.begin();
                }
            }

            await this.draw();
        }
    }
}
