///<reference path="../Math/Vector2.ts" />
module es {
    export enum SceneResolutionPolicy {
        /**
         * 默认情况下，RenderTarget与屏幕大小匹配。RenderTarget与屏幕大小相匹配
         */
        none,
        /**
         * 该应用程序采用最适合设计分辨率的宽度和高度
         */
        bestFit
    }

    /** 场景 */
    export class Scene {
        /**
         * 默认场景 摄像机
         */
        public camera: ICamera;
        /**
         * 这个场景中的实体列表
         */
        public readonly entities: EntityList;
        /** 管理当前在场景中的所有RenderableComponents的列表 Entitys */
        public readonly renderableComponents: RenderableComponentList;
        /**
         * 如果ResolutionPolicy是完美的像素，这将被设置为为它计算的比例
         */
        public pixelPerfectScale: number = 1;
        /**
         * 如果设置了，最终渲染到屏幕上的时间可以推迟到这个委托。
         * 这实际上只在最终渲染可能需要全屏大小效果的情况下有用，即使使用了一个小的后置缓冲区
         */
        public set finalRenderDelegate(value: IFinalRenderDelegate) {
            if (this._finalRenderDelegate != null)
                this._finalRenderDelegate.unload();

            this._finalRenderDelegate = value;

            if (this._finalRenderDelegate != null)
                this._finalRenderDelegate.onAddedToScene(this);
        }

        public get finalRenderDelegate() {
            return this._finalRenderDelegate;
        }

        private _finalRenderDelegate: IFinalRenderDelegate;
        /**
         * 管理所有实体处理器
         */
        public readonly entityProcessors: EntityProcessorList;
        /**
         * 所有场景的默认分辨率大小
         */
        private static _defaultDesignResolutionSize: Vector2 = Vector2.zero;
        private static _defaultDesignBleedSize: Vector2 = Vector2.zero;
        /**
         * 用于所有场景的默认分辨率策略
         */
        private static _defaultSceneResolutionPolicy: SceneResolutionPolicy = SceneResolutionPolicy.none;
        /**
         * 场景的解析策略
         */
        private _resolutionPolicy: SceneResolutionPolicy;
        /**
         * 场景使用的设计分辨率大小
         */
        private _designResolutionSize: Vector2 = Vector2.zero;
        private _designBleedSize: Vector2 = Vector2.zero;
        /**
         * 这将根据分辨率策略进行设置，并用于RenderTarget的最终输出
         */
        private _finalRenderDestinationRect: Rectangle = Rectangle.empty;

        private _sceneRenderTarget: Ref<any> = new Ref(null);
        private _destinationRenderTarget: Ref<any> = new Ref(null);
        private _screenshotRequestCallback: (texture) => void;

        public readonly _sceneComponents: SceneComponent[] = [];
        public _renderers: IRenderer[] = [];
        public readonly _afterPostProcessorRenderers: IRenderer[] = [];
        public _didSceneBegin: boolean;

        /**
         * 设置新场景将使用的默认设计尺寸和分辨率策略，水平/垂直Bleed仅与BestFit相关
         * @param width 
         * @param height 
         * @param sceneResolutionPolicy 
         * @param horizontalBleed 
         * @param vertialcalBleed 
         */
        public static setDefaultDesignResolution(width: number, height: number,
            sceneResolutionPolicy: SceneResolutionPolicy,
            horizontalBleed: number = 0, vertialcalBleed: number = 0) {
            this._defaultDesignBleedSize = new Vector2(width, height);
            this._defaultSceneResolutionPolicy = sceneResolutionPolicy;
            if (this._defaultSceneResolutionPolicy == SceneResolutionPolicy.bestFit)
                this._defaultDesignBleedSize = new Vector2(horizontalBleed, vertialcalBleed);
        }

        constructor() {
            this.entities = new EntityList(this);
            this.renderableComponents = new RenderableComponentList();
            this.entityProcessors = new EntityProcessorList();

            Framework.emitter.emit(CoreEvents.createCamera, this);

            this._resolutionPolicy = Scene._defaultSceneResolutionPolicy;
            this._designResolutionSize = Scene._defaultDesignResolutionSize;
            this._designBleedSize = Scene._defaultDesignBleedSize;

            this.initialize();
        }

        /**
         * 在场景子类中重写这个，然后在这里进行加载。
         * 在场景设置好之后，但在调用begin之前，从contructor中调用这个函数
         */
        public initialize() {
        }

        /**
         * 当Core将这个场景设置为活动场景时，这个将被调用
         */
        public onStart() {
        }

        /**
         * 在场景子类中重写这个，并在这里做任何必要的卸载。
         * 当Core把这个场景从活动槽中移除时，这个被调用。
         */
        public unload() {
        }

        public begin() {
            if (this._renderers.length == 0) {
                Framework.emitter.emit(CoreEvents.addDefaultRender);
                console.warn("场景开始时没有渲染器");
            }

            Physics.reset();
            this.updateResolutionScaler();
            Framework.emitter.emit(CoreEvents.setRenderTarget, this._sceneRenderTarget);
            Framework.emitter.addObserver(CoreEvents.graphicsDeviceReset, this.updateResolutionScaler, this);
            Framework.emitter.addObserver(CoreEvents.orientationChanged, this.updateResolutionScaler, this);

            if (this.entityProcessors != null)
                this.entityProcessors.begin();

            this._didSceneBegin = true;
            this.onStart();

        }

        public end() {
            this._didSceneBegin = false;

            for (let i = 0; i < this._renderers.length; i++)
                this._renderers[i].unload();

            Framework.emitter.removeObserver(CoreEvents.graphicsDeviceReset, this.updateResolutionScaler);
            this.entities.removeAllEntities();

            for (let i = 0; i < this._sceneComponents.length; i++) {
                this._sceneComponents[i].onRemovedFromScene();
            }
            this._sceneComponents.length = 0;

            this.camera = null;
            Framework.emitter.emit(CoreEvents.disposeRenderTarget, this._sceneRenderTarget);
            Framework.emitter.emit(CoreEvents.disposeRenderTarget, this._destinationRenderTarget);
            Physics.clear();

            if (this.entityProcessors)
                this.entityProcessors.end();

            this.unload();
        }

        public updateResolutionScaler() {
            let designSize = this._designResolutionSize;
            let screenSize = new Vector2(Screen.width, Screen.height);
            let screenAspectRatio = screenSize.x / screenSize.y;

            let renderTargetWidth = screenSize.x;
            let renderTargetHeight = screenSize.y;

            let resolutionScaleX = screenSize.x / designSize.x;
            let resolutionScaleY = screenSize.y / designSize.y;

            let rectCalculated = false;

            // 计算PixelPerfect变体所使用的比例
            this.pixelPerfectScale = 1;
            if (this._resolutionPolicy != SceneResolutionPolicy.none) {
                if (designSize.x / designSize.y > screenAspectRatio)
                    this.pixelPerfectScale = screenSize.x / designSize.x;
                else
                    this.pixelPerfectScale = screenSize.y / designSize.y;

                if (this.pixelPerfectScale == 0)
                    this.pixelPerfectScale = 1;
            }

            switch (this._resolutionPolicy) {
                case SceneResolutionPolicy.none:
                    this._finalRenderDestinationRect.x = this._finalRenderDestinationRect.y = 0;
                    this._finalRenderDestinationRect.width = screenSize.x;
                    this._finalRenderDestinationRect.height = screenSize.y;
                    rectCalculated = true;
                    break;
                case SceneResolutionPolicy.bestFit:
                    let safeScaleX = screenSize.x / (designSize.x - this._designBleedSize.x);
                    let safeScaleY = screenSize.y / (designSize.y - this._designBleedSize.y);

                    let resolutionScale = Math.max(resolutionScaleX, resolutionScaleY);
                    let safeScale = Math.min(safeScaleX, safeScaleY);

                    resolutionScaleX = resolutionScaleY = Math.min(resolutionScale, safeScale);

                    renderTargetWidth = designSize.x;
                    renderTargetHeight = designSize.y;

                    break;
            }

            // 如果我们还没有计算出一个矩形
            if (!rectCalculated) {
                // 计算RenderTarget的显示矩形
                let renderWidth = designSize.x * resolutionScaleX;
                let renderHeight = designSize.y * resolutionScaleY;

                this._finalRenderDestinationRect = new Rectangle((screenSize.x - renderWidth) / 2,
                    (screenSize.y - renderHeight) / 2, renderWidth, renderHeight);
            }

            // 在Input类中设置一些值，将鼠标位置转换为我们的缩放分辨率
            let scaleX = renderTargetWidth / this._finalRenderDestinationRect.width;
            let scaleY = renderTargetHeight / this._finalRenderDestinationRect.height;

            Framework.emitter.emit(CoreEvents.resolutionScale, new Vector2(scaleX, scaleY));
            Framework.emitter.emit(CoreEvents.resolutionOffset, this._finalRenderDestinationRect.location);

            // 调整我们的RenderTargets大小
            if (this._sceneRenderTarget != null)
                Framework.emitter.emit(CoreEvents.disposeRenderTarget, this._sceneRenderTarget);
            Framework.emitter.emit(CoreEvents.createRenderTarget, this._sceneRenderTarget, renderTargetWidth, renderTargetHeight);

            // 只有在已经存在的情况下才会创建 destinationRenderTarget
            if (this._destinationRenderTarget != null) {
                Framework.emitter.emit(CoreEvents.disposeRenderTarget, this._destinationRenderTarget);
                Framework.emitter.emit(CoreEvents.createRenderTarget, this._destinationRenderTarget, renderTargetWidth, renderTargetHeight);
            }

            // 通知渲染器、后处理器和FinalRenderDelegate渲染纹理尺寸的变化
            for (let i = 0; i < this._renderers.length; i++)
                this._renderers[i].onSceneBackBufferSizeChanged(renderTargetWidth, renderTargetHeight);

            for (let i = 0; i < this._afterPostProcessorRenderers.length; i++)
                this._afterPostProcessorRenderers[i].onSceneBackBufferSizeChanged(renderTargetWidth, renderTargetHeight);

            if (this._finalRenderDelegate != null)
                this._finalRenderDelegate.onSceneBackBufferSizeChanged(renderTargetWidth, renderTargetHeight);

            this.camera.onSceneRenderTargetSizeChanged(renderTargetWidth, renderTargetHeight);
        }

        /**
         * 下一次绘制完成后，这将克隆回缓冲区，并调用回调与clone。
         * 注意，当使用完Texture后，你必须处理掉它
         * @param callback 
         */
        public requestScreenshot(callback: (texture) => void) {
            this._screenshotRequestCallback = callback;
        }

        public update() {
            // 我们在这里设置RenderTarget，这样Viewport就会与RenderTarget正确匹配
            Framework.emitter.emit(CoreEvents.setRenderTarget, this._sceneRenderTarget);

            // 更新我们的列表，以防它们有任何变化
            this.entities.updateLists();

            for (let i = this._sceneComponents.length - 1; i >= 0; i--) {
                if (this._sceneComponents[i].enabled)
                    this._sceneComponents[i].update();
            }

            // 更新我们的实体解析器
            if (this.entityProcessors != null)
                this.entityProcessors.update();

            // 更新我们的实体组
            this.entities.update();

            // 我们在entity.update之后更新我们的renderables，以防止任何新的Renderables被添加
            this.renderableComponents.updateList();

            if (this.entityProcessors != null)
                this.entityProcessors.lateUpdate();
        }

        public render() {
            if (this._renderers.length == 0) {
                console.error("场景中没有渲染器!");
                return;
            }

            // 渲染器应该总是先有那些需要RenderTarget的。
            // 他们在渲染的时候会自己清空并设置自己为当前的RenderTarget。
            // 如果第一个Renderer想要sceneRenderTarget，我们现在就设置并清除它
            if (this._renderers[0].wantsToRenderToSceneRenderTarget) {
                Framework.emitter.emit(CoreEvents.setRenderTarget, this._sceneRenderTarget);
                Framework.emitter.emit(CoreEvents.clearGraphics);
            }

            let lastRendererHadRenderTarget = false;
            for (let i = 0; i < this._renderers.length; i++) {
                if (lastRendererHadRenderTarget && this._renderers[i].wantsToRenderToSceneRenderTarget) {
                    Framework.emitter.emit(CoreEvents.setRenderTarget, this._sceneRenderTarget);
                    Framework.emitter.emit(CoreEvents.clearGraphics);

                    // 强制更新相机矩阵，以考虑到新的视口尺寸
                    if (this._renderers[i].camera != null)
                        this._renderers[i].camera.forceMatrixUpdate();
                    this.camera && this.camera.forceMatrixUpdate();
                }

                this._renderers[i].render(this);
                lastRendererHadRenderTarget = this._renderers[i].renderTexture != null;
            }
        }

        /**
         * 任何存在的PostProcessors都可以进行处理，然后我们对RenderTarget进行最后的渲染。
         * 几乎在所有情况下，finalRenderTarget都是空的。
         * 只有在场景转换的第一帧中，如果转换请求渲染，它才会有一个值。
         * @param finalRenderTarget 
         */
        public postRender(finalRenderTarget = null) {
            let enabledCounter = 0;

            for (let i = 0; i < this._afterPostProcessorRenderers.length; i++) {
                if (i == 0) {
                    // 我们需要在这里设置正确的RenderTarget
                    let currentRenderTarget = MathHelper.isEven(enabledCounter) ? this._sceneRenderTarget : this._destinationRenderTarget;
                    Framework.emitter.emit(CoreEvents.setRenderTarget, currentRenderTarget);
                }

                if (this._afterPostProcessorRenderers[i].camera != null)
                    this._afterPostProcessorRenderers[i].camera.forceMatrixUpdate();
                this._afterPostProcessorRenderers[i].render(this);
            }

            // 如果我们有一个截图请求，在最终渲染到回缓冲区之前处理它
            if (this._screenshotRequestCallback != null) {
                let currentRenderTarget = MathHelper.isEven(enabledCounter) ? this._sceneRenderTarget : this._destinationRenderTarget;
                this._screenshotRequestCallback(currentRenderTarget.value);
                this._screenshotRequestCallback = null;
            }

            // 将我们的最终结果渲染到后置缓冲区，或者让我们的委托来做
            if (this._finalRenderDelegate != null) {
                let currentRenderTarget = MathHelper.isEven(enabledCounter) ? this._sceneRenderTarget : this._destinationRenderTarget;
                this._finalRenderDelegate.handleFinalRender(finalRenderTarget, currentRenderTarget, this._finalRenderDestinationRect);
            } else {
                let currentRenderTarget = MathHelper.isEven(enabledCounter) ? this._sceneRenderTarget : this._destinationRenderTarget;
                Framework.emitter.emit(CoreEvents.setRenderTarget, finalRenderTarget);
                Framework.emitter.emit(CoreEvents.clearGraphics);

                Framework.batcher.begin(null);
                Framework.batcher.draw(currentRenderTarget,
                    new Vector2(this._finalRenderDestinationRect.x, this._finalRenderDestinationRect.y),
                    0xffffff,
                    0,
                    Vector2.zero,
                    new Vector2(this._finalRenderDestinationRect.width, this._finalRenderDestinationRect.height));
                Framework.batcher.end();
            }
        }

        /**
         * 向组件列表添加并返回SceneComponent
         * @param component
         */
        public addSceneComponent<T extends SceneComponent>(component: T): T {
            component.scene = this;
            component.onEnabled();
            this._sceneComponents.push(component);
            this._sceneComponents.sort(component.compare);
            return component;
        }

        /**
         * 获取类型为T的第一个SceneComponent并返回它。如果没有找到组件，则返回null。
         * @param type
         */
        public getSceneComponent<T extends SceneComponent>(type) {
            for (let i = 0; i < this._sceneComponents.length; i++) {
                let component = this._sceneComponents[i];
                if (component instanceof type)
                    return component as T;
            }

            return null;
        }

        /**
         * 获取类型为T的第一个SceneComponent并返回它。如果没有找到SceneComponent，则将创建SceneComponent。
         * @param type
         */
        public getOrCreateSceneComponent<T extends SceneComponent>(type) {
            let comp = this.getSceneComponent<T>(type);
            if (comp == null)
                comp = this.addSceneComponent<T>(new type());

            return comp;
        }

        /**
         * 从SceneComponents列表中删除一个SceneComponent
         * @param component
         */
        public removeSceneComponent(component: SceneComponent) {
            if (!new linq.List(this._sceneComponents).contains(component)) {
                console.warn(`SceneComponent${component}不在SceneComponents列表中!`);
                return;
            }

            new linq.List(this._sceneComponents).remove(component);
            component.onRemovedFromScene();
        }

        /**
         * 添加一个渲染器到场景中
         * @param renderer 
         */
        public addRenderer<T extends IRenderer>(renderer: T): T {
            if (renderer.wantsToRenderAfterPostProcessors) {
                this._afterPostProcessorRenderers.push(renderer);
                this._afterPostProcessorRenderers.sort((a, b) => {
                    return a.compare(b);
                });
            } else {
                this._renderers.push(renderer);
                this._renderers.sort((a, b) => {
                    return a.compare(b);
                });
            }

            renderer.onAddedToScene(this);

            return renderer;
        }

        /**
         * 得到第一个T型的渲染器
         * @param type 
         */
        public getRenderer<T extends IRenderer>(type): T {
            for (let i = 0; i < this._renderers.length; i++) {
                if (this._renderers[i] instanceof type)
                    return this._renderers[i] as T;
            }

            for (let i = 0; i < this._afterPostProcessorRenderers.length; i++) {
                if (this._afterPostProcessorRenderers[i] instanceof type)
                    return this._afterPostProcessorRenderers[i] as T;
            }

            return null;
        }

        /**
         * 从场景中移除渲染器
         * @param renderer 
         */
        public removeRenderer(renderer: IRenderer) {
            Insist.isTrue(new linq.List(this._renderers).contains(renderer) ||
                new linq.List(this._afterPostProcessorRenderers).contains(renderer));

            if (renderer.wantsToRenderAfterPostProcessors)
                new linq.List(this._afterPostProcessorRenderers).remove(renderer);
            else
                new linq.List(this._renderers).remove(renderer);

            renderer.unload();
        }

        /**
         * 将实体添加到此场景，并返回它
         * @param name
         */
        public createEntity(name: string) {
            let entity = new Entity(name);
            return this.addEntity(entity);
        }

        /**
         * 在场景的实体列表中添加一个实体
         * @param entity
         */
        public addEntity(entity: Entity) {
            Insist.isFalse(new linq.List(this.entities.buffer).contains(entity), `您试图将同一实体添加到场景两次: ${entity}`);
            this.entities.add(entity);
            entity.scene = this;

            for (let i = 0; i < entity.transform.childCount; i++)
                this.addEntity(entity.transform.getChild(i).entity);

            return entity;
        }

        /**
         * 从场景中删除所有实体
         */
        public destroyAllEntities() {
            for (let i = 0; i < this.entities.count; i++) {
                this.entities.buffer[i].destroy();
            }
        }

        /**
         * 搜索并返回第一个具有名称的实体
         * @param name
         */
        public findEntity(name: string): Entity {
            return this.entities.findEntity(name);
        }

        /**
         * 返回具有给定标记的所有实体
         * @param tag
         */
        public findEntitiesWithTag(tag: number): Entity[] {
            return this.entities.entitiesWithTag(tag);
        }

        /**
         * 返回类型为T的所有实体
         * @param type
         */
        public entitiesOfType<T extends Entity>(type): T[] {
            return this.entities.entitiesOfType<T>(type);
        }

        /**
         * 返回第一个启用加载的类型为T的组件
         * @param type
         */
        public findComponentOfType<T extends Component>(type): T {
            return this.entities.findComponentOfType<T>(type);
        }

        /**
         * 返回类型为T的所有已启用已加载组件的列表
         * @param type
         */
        public findComponentsOfType<T extends Component>(type): T[] {
            return this.entities.findComponentsOfType<T>(type);
        }

        /**
         * 在场景中添加一个EntitySystem处理器
         * @param processor 处理器
         */
        public addEntityProcessor(processor: EntitySystem) {
            processor.scene = this;
            this.entityProcessors.add(processor);
            return processor;
        }

        /**
         * 从场景中删除EntitySystem处理器
         * @param processor
         */
        public removeEntityProcessor(processor: EntitySystem) {
            this.entityProcessors.remove(processor);
        }

        /**
         * 获取EntitySystem处理器
         */
        public getEntityProcessor<T extends EntitySystem>(): T {
            return this.entityProcessors.getProcessor<T>();
        }
    }
}