module es {
    /** 场景 */
    export class Scene extends egret.DisplayObjectContainer {
        /**
         * 默认场景摄像机
         */
        public camera: Camera;
        /**
         * 场景特定内容管理器。使用它来加载仅由这个场景需要的任何资源。如果你有全局/多场景资源，你可以使用SceneManager.content。
         * contentManager来加载它们，因为Nez不会卸载它们。
         */
        public readonly content: ContentManager;
        /**
         * 全局切换后处理器
         */
        public enablePostProcessing = true;
        /**
         * 这个场景中的实体列表
         */
        public readonly entities: EntityList;
        /**
         * 管理当前在场景实体上的所有可呈现组件的列表
         */
        public readonly renderableComponents: RenderableComponentList;
        /**
         * 管理所有实体处理器
         */
        public readonly entityProcessors: EntityProcessorList;

        public _renderers: Renderer[] = [];
        public readonly _postProcessors: PostProcessor[] = [];
        public _didSceneBegin;

        constructor() {
            super();
            this.entities = new EntityList(this);
            this.renderableComponents = new RenderableComponentList();
            this.content = new ContentManager();

            this.entityProcessors = new EntityProcessorList();

            this.initialize();
        }

        /**
         * 辅助器，创建一个场景与DefaultRenderer附加并准备使用
         */
        public static createWithDefaultRenderer() {
            let scene = new Scene();
            scene.addRenderer(new DefaultRenderer());
            return scene;
        }

        /**
         * 在场景子类中重写这个并在这里进行加载。在场景设置好之后，在调用begin之前，从构造器中调用。
         */
        public initialize() {
        }

        /**
         * 在场景子类中重写这个。当SceneManager将此场景设置为活动场景时，将调用此操作。
         */
        public async onStart() {
        }

        /**
         * 在场景子类中重写这个，并在这里做任何必要的卸载。当SceneManager从活动槽中删除此场景时调用。
         */
        public unload() {
        }


        /**
         * 在场景子类中重写这个，当该场景当获得焦点时调用
         */
        public onActive() {
        }

        /**
         * 在场景子类中重写这个，当该场景当失去焦点时调用
         */
        public onDeactive() {
        }

        public async begin() {
            if (this._renderers.length == 0) {
                this.addRenderer(new DefaultRenderer());
                console.warn("场景开始时没有渲染器 自动添加DefaultRenderer以保证能够正常渲染");
            }

            this.camera = this.createEntity("camera").getOrCreateComponent(new Camera());

            Physics.reset();

            if (this.entityProcessors)
                this.entityProcessors.begin();

            this.addEventListener(egret.Event.ACTIVATE, this.onActive, this);
            this.addEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
            this.camera.onSceneSizeChanged(this.stage.stageWidth, this.stage.stageHeight);

            this._didSceneBegin = true;
            this.onStart();
        }

        public end() {
            this._didSceneBegin = false;

            this.removeEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
            this.removeEventListener(egret.Event.ACTIVATE, this.onActive, this);

            for (let i = 0; i < this._renderers.length; i++) {
                this._renderers[i].unload();
            }

            for (let i = 0; i < this._postProcessors.length; i++) {
                this._postProcessors[i].unload();
            }

            this.entities.removeAllEntities();
            this.removeChildren();

            this.camera = null;
            this.content.dispose();

            if (this.entityProcessors)
                this.entityProcessors.end();

            if (this.parent)
                this.parent.removeChild(this);

            this.unload();
        }

        public update() {
            // 更新我们的列表，以防它们有任何变化
            this.entities.updateLists();

            // 更新我们的实体解析器
            if (this.entityProcessors)
                this.entityProcessors.update();

            // 更新我们的实体组
            this.entities.update();

            if (this.entityProcessors)
                this.entityProcessors.lateUpdate();

            // 我们在实体之后更新我们的呈现。如果添加了任何新的渲染，请进行更新
            this.renderableComponents.updateList();
        }

        public render() {
            if (this._renderers.length == 0) {
                console.error("there are no renderers in the scene!");
                return;
            }

            for (let i = 0; i < this._renderers.length; i++) {
                this._renderers[i].render(this);
            }
        }

        /**
         * 现在的任何后处理器都要完成它的处理
         * 只有在SceneTransition请求渲染时，它才会有一个值。
         */
        public postRender() {
            if (this.enablePostProcessing) {
                for (let i = 0; i < this._postProcessors.length; i++) {
                    if (this._postProcessors[i].enabled) {
                        this._postProcessors[i].process();
                    }
                }
            }
        }

        /**
         * 为场景添加一个渲染器
         * @param renderer
         */
        public addRenderer<T extends Renderer>(renderer: T) {
            this._renderers.push(renderer);
            this._renderers.sort();

            renderer.onAddedToScene(this);

            return renderer;
        }

        /**
         * 获取类型为T的第一个渲染器
         * @param type
         */
        public getRenderer<T extends Renderer>(type): T {
            for (let i = 0; i < this._renderers.length; i++) {
                if (this._renderers[i] instanceof type)
                    return this._renderers[i] as T;
            }

            return null;
        }

        /**
         * 从场景中移除渲染器
         * @param renderer
         */
        public removeRenderer(renderer: Renderer) {
            if (!this._renderers.contains(renderer))
                return;
            this._renderers.remove(renderer);
            renderer.unload();
        }

        /**
         * 添加一个后处理器到场景。设置场景字段并调用后处理器。onAddedToScene使后处理器可以使用场景ContentManager加载资源。
         * @param postProcessor
         */
        public addPostProcessor<T extends PostProcessor>(postProcessor: T): T {
            this._postProcessors.push(postProcessor);
            this._postProcessors.sort();
            postProcessor.onAddedToScene(this);

            if (this._didSceneBegin) {
                postProcessor.onSceneBackBufferSizeChanged(this.stage.stageWidth, this.stage.stageHeight);
            }

            return postProcessor;
        }

        /**
         * 获取类型为T的第一个后处理器
         * @param type
         */
        public getPostProcessor<T extends PostProcessor>(type): T {
            for (let i = 0; i < this._postProcessors.length; i++) {
                if (this._postProcessors[i] instanceof type)
                    return this._postProcessors[i] as T;
            }

            return null;
        }

        /**
         * 删除一个后处理程序。注意，在删除时不会调用unload，因此如果不再需要PostProcessor，请确保调用unload来释放资源。
         * @param postProcessor
         */
        public removePostProcessor(postProcessor: PostProcessor) {
            if (!this._postProcessors.contains(postProcessor))
                return;

            this._postProcessors.remove(postProcessor);
            postProcessor.unload();
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
            if (this.entities.buffer.contains(entity))
                console.warn(`You are attempting to add the same entity to a scene twice: ${entity}`);
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