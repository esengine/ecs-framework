module es {
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

        private _screenshotRequestCallback: (texture) => void;

        public readonly _sceneComponents: SceneComponent[] = [];
        public _renderers: IRenderer[] = [];
        public readonly _afterPostProcessorRenderers: IRenderer[] = [];
        public _didSceneBegin: boolean;

        constructor() {
            this.entities = new EntityList(this);
            this.renderableComponents = new RenderableComponentList();
            this.entityProcessors = new EntityProcessorList();

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
                console.warn("场景开始时没有渲染器");
            }

            Physics.reset();
            this.updateResolutionScaler();

            if (this.entityProcessors != null)
                this.entityProcessors.begin();

            this._didSceneBegin = true;
            this.onStart();

        }

        public end() {
            this._didSceneBegin = false;

            for (let i = 0; i < this._renderers.length; i++)
                this._renderers[i].unload();

            this.entities.removeAllEntities();

            for (let i = 0; i < this._sceneComponents.length; i++) {
                this._sceneComponents[i].onRemovedFromScene();
            }
            this._sceneComponents.length = 0;

            this.camera = null;
            Physics.clear();

            if (this.entityProcessors)
                this.entityProcessors.end();

            this.unload();
        }

        public updateResolutionScaler() {

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

            let lastRendererHadRenderTarget = false;
            for (let i = 0; i < this._renderers.length; i++) {
                if (lastRendererHadRenderTarget && this._renderers[i].wantsToRenderToSceneRenderTarget) {
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
            for (let i = 0; i < this._afterPostProcessorRenderers.length; i++) {
                if (this._afterPostProcessorRenderers[i].camera != null)
                    this._afterPostProcessorRenderers[i].camera.forceMatrixUpdate();
                this._afterPostProcessorRenderers[i].render(this);
            }

            // 如果我们有一个截图请求，在最终渲染到回缓冲区之前处理它
            if (this._screenshotRequestCallback != null) {
                // TODO: 实现各平台的截图方式
                this._screenshotRequestCallback = null;
            }

            // 将我们的最终结果渲染到后置缓冲区，或者让我们的委托来做
            if (this._finalRenderDelegate != null) {

            } else {

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