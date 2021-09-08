///<reference path="../Math/Vector2.ts" />
module es {
    /** 场景 */
    export class Scene {
        /** 场景名称 */
        public name: string;
        public camera: Camera;
        /** 这个场景中的实体列表 */
        public readonly entities: EntityList;
        public readonly renderableComponents: RenderableComponentList;
        /** 管理所有实体处理器 */
        public readonly entityProcessors: EntityProcessorList;

        public readonly _sceneComponents: SceneComponent[] = [];
        public _renderers: Renderer[] = [];
        public readonly identifierPool: IdentifierPool;
        private _didSceneBegin: boolean;

        constructor(name?: string) {
            this.name = name;
            this.entities = new EntityList(this);
            this.renderableComponents = new RenderableComponentList();
            this.identifierPool = new IdentifierPool();

            const cameraEntity = this.createEntity("camera");
            this.camera = cameraEntity.addComponent(new Camera());

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
                this.addRenderer(new DefaultRenderer());
            }

            Physics.reset();

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

            // 我们在 entity.update 之后更新我们的可渲染文件，以防添加任何新的可渲染文件
            this.renderableComponents.updateLists();
            this.render();
        }

        public render() {
            for (let i = 0; i < this._renderers.length; i++) {
                this._renderers[i].render(this);
            }
        }

        public addRenderer<T extends Renderer>(renderer: T): T {
            this._renderers.push(renderer);
            this._renderers.sort((self, other) => self.renderOrder - other.renderOrder);

            renderer.onAddedToScene(this);

            return renderer;
        }

        public getRenderer<T extends Renderer>(type: new (...args: any[]) => T): T {
            for (let i = 0; i < this._renderers.length; i++) {
                if (this._renderers[i] instanceof type)
                    return this._renderers[i] as T;
            }

            return null;
        }

        public removeRenderer(renderer: Renderer) {
            new List(this._renderers).remove(renderer);
            renderer.unload();
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
            const sceneComponentList = new es.List(this._sceneComponents);
            Insist.isTrue(sceneComponentList.contains(component), `SceneComponent${component}不在SceneComponents列表中!`);
            sceneComponentList.remove(component);
            component.onRemovedFromScene();
        }

        /**
         * 将实体添加到此场景，并返回它
         * @param name
         */
        public createEntity(name: string) {
            let entity = new Entity(name, this.identifierPool.checkOut());
            return this.addEntity(entity);
        }

        /**
         * 在场景的实体列表中添加一个实体
         * @param entity
         */
        public addEntity(entity: Entity) {
            Insist.isFalse(new es.List(this.entities.buffer).contains(entity), `您试图将同一实体添加到场景两次: ${entity}`);
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

        public findEntityById(id: number): Entity {
            return this.entities.findEntityById(id);
        }

        /**
         * 返回具有给定标记的所有实体
         * @param tag
         */
        public findEntitiesWithTag(tag: number): Entity[] {
            return this.entities.entitiesWithTag(tag);
        }

        /**
         * 返回提一个具有该标记的实体
         * @param tag 
         * @returns 
         */
        public findEntityWithTag(tag: number): Entity {
            return this.entities.entityWithTag(tag);
        }

        /**
         * 返回第一个启用加载的类型为T的组件
         * @param type
         */
        public findComponentOfType<T extends Component>(type: new (...args) => T): T {
            return this.entities.findComponentOfType<T>(type);
        }

        /**
         * 返回类型为T的所有已启用已加载组件的列表
         * @param type
         */
        public findComponentsOfType<T extends Component>(type: new (...args) => T): T[] {
            return this.entities.findComponentsOfType<T>(type);
        }

        /**
         * 返回场景中包含特定组件的实体列表
         * @param type 
         * @returns 
         */
        public findEntitiesOfComponent(...types): Entity[] {
            return this.entities.findEntitesOfComponent(...types);
        }

        /**
         * 在场景中添加一个EntitySystem处理器
         * @param processor 处理器
         */
        public addEntityProcessor(processor: EntitySystem) {
            processor.scene = this;
            this.entityProcessors.add(processor);

            processor.setUpdateOrder(this.entityProcessors.count - 1);
            this.entityProcessors.clearDirty();
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
        public getEntityProcessor<T extends EntitySystem>(type: new (...args: any[]) => T): T {
            return this.entityProcessors.getProcessor<T>(type);
        }
    }
}