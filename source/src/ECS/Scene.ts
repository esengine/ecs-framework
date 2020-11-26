module es {
    /** 场景 */
    export class Scene {
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

        public readonly _sceneComponents: SceneComponent[] = [];
        public _renderers: Renderer[] = [];
        public _didSceneBegin;

        constructor() {
            this.entities = new EntityList(this);
            this.renderableComponents = new RenderableComponentList();

            if (Core.entitySystemsEnabled)
                this.entityProcessors = new EntityProcessorList();

            this.initialize();
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

        public begin() {
            Physics.reset();
            this.updateResolutionScaler();

            if (this.entityProcessors != null)
                this.entityProcessors.begin();

            Core.emitter.addObserver(CoreEvents.GraphicsDeviceReset,this.updateResolutionScaler, this);
            Core.emitter.addObserver(CoreEvents.OrientationChanged, this.updateResolutionScaler, this);

            this._didSceneBegin = true;
            this.onStart();

        }

        public end() {
            this._didSceneBegin = false;

            for (let i = 0; i < this._renderers.length; i++) {
                this._renderers[i].unload();
            }

            Core.emitter.removeObserver(CoreEvents.GraphicsDeviceReset, this.updateResolutionScaler);
            Core.emitter.removeObserver(CoreEvents.OrientationChanged, this.updateResolutionScaler);

            this.entities.removeAllEntities();

            for (let i = 0; i < this._sceneComponents.length; i++) {
                this._sceneComponents[i].onRemovedFromScene();
            }
            this._sceneComponents.length = 0;

            Physics.clear();

            if (this.entityProcessors)
                this.entityProcessors.end();

            this.unload();
        }

        public updateResolutionScaler(){

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

            if (this.entityProcessors != null)
                this.entityProcessors.lateUpdate();

            // 我们在entity.update之后更新我们的renderables，以防止任何新的Renderables被添加
            this.renderableComponents.updateList();
        }

        public render() {
            for (let i = 0; i < this._renderers.length; i++) {
                this._renderers[i].render(this);
            }
        }

        /**
         * 现在的任何后处理器都要完成它的处理
         * 只有在SceneTransition请求渲染时，它才会有一个值。
         */
        public postRender() {

        }

        /**
         * 向组件列表添加并返回SceneComponent
         * @param component
         */
        public addSceneComponent<T extends SceneComponent>(component: T): T {
            component.scene = this;
            component.onEnabled();
            this._sceneComponents.push(component);
            this._sceneComponents.sort(component.compareTo);
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
            if (!this._sceneComponents.contains(component)) {
                console.warn(`SceneComponent${component}不在SceneComponents列表中!`);
                return;
            }

            this._sceneComponents.remove(component);
            component.onRemovedFromScene();
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
                console.warn(`您试图将同一实体添加到场景两次: ${entity}`);
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