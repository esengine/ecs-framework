///<reference path="../Math/Vector2.ts" />
module es {
    /** 场景 */
    export class Scene {
        /** 这个场景中的实体列表 */
        public readonly entities: EntityList;
        /** 管理所有实体处理器 */
        public readonly entityProcessors: EntityProcessorList;

        public readonly _sceneComponents: SceneComponent[] = [];
        public readonly identifierPool: IdentifierPool;
        private _didSceneBegin: boolean;

        constructor() {
            this.entities = new EntityList(this);

            this.entityProcessors = new EntityProcessorList();
            this.identifierPool = new IdentifierPool();

            this.initialize();
        }

        /**
         * 初始化场景，可以在派生类中覆盖
         *
         * 这个方法会在场景创建时被调用。您可以在这个方法中添加实体和组件，
         * 或者执行一些必要的准备工作，以便场景能够开始运行。
         */
        public initialize() {
        }

        /**
         * 开始运行场景时调用此方法，可以在派生类中覆盖
         *
         * 这个方法会在场景开始运行时被调用。您可以在这个方法中执行场景开始时需要进行的操作。
         * 比如，您可以开始播放一段背景音乐、启动UI等等。
         */
        public onStart() {
        }

        /**
         * 卸载场景时调用此方法，可以在派生类中覆盖
         *
         * 这个方法会在场景被销毁时被调用。您可以在这个方法中销毁实体和组件、释放资源等等。
         * 您也可以在这个方法中执行一些必要的清理工作，以确保场景被完全卸载。
         */
        public unload() {
        }

        /**
         * 开始场景，初始化物理系统、启动实体处理器等
         *
         * 这个方法会启动场景。它将重置物理系统、启动实体处理器等，并调用onStart方法。
         */
        public begin() {
            // 重置物理系统
            Physics.reset();

            // 启动实体处理器
            if (this.entityProcessors != null)
                this.entityProcessors.begin();

            // 标记场景已开始运行并调用onStart方法
            this._didSceneBegin = true;
            this.onStart();
        }

        /**
         * 结束场景，清除实体、场景组件、物理系统等
         *
         * 这个方法会结束场景。它将移除所有实体并调用它们的onRemovedFromScene方法，清除物理系统，结束实体处理器等，并调用unload方法。
         */
        public end() {
            // 标记场景已结束运行
            this._didSceneBegin = false;

            // 移除所有实体并调用它们的onRemovedFromScene方法
            this.entities.removeAllEntities();

            for (let i = 0; i < this._sceneComponents.length; i++) {
                this._sceneComponents[i].onRemovedFromScene();
            }
            this._sceneComponents.length = 0;

            // 清除物理系统
            Physics.clear();

            // 结束实体处理器
            if (this.entityProcessors)
                this.entityProcessors.end();

            // 调用卸载方法
            this.unload();
        }

        /**
         * 更新场景，更新实体组件、实体处理器等
         */
        public update() {
            // 更新实体列表
            this.entities.updateLists();

            // 更新场景组件
            for (let i = this._sceneComponents.length - 1; i >= 0; i--) {
                if (this._sceneComponents[i].enabled)
                    this._sceneComponents[i].update();
            }

            // 更新实体处理器
            if (this.entityProcessors != null)
                this.entityProcessors.update();

            // 更新实体组
            this.entities.update();

            // 更新实体处理器的后处理方法
            if (this.entityProcessors != null)
                this.entityProcessors.lateUpdate();
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
            return this.entities.findEntitiesOfComponent(...types);
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