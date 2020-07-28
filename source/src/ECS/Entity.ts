module es {
    export class Entity {
        public static _idGenerator: number;

        /**
         * 当前实体所属的场景
         */
        public scene: Scene;
        /**
         * 实体名称。用于在场景范围内搜索实体
         */
        public name: string;
        /**
         * 此实体的唯一标识
         */
        public readonly id: number;
        /**
         * 封装实体的位置/旋转/缩放，并允许设置一个高层结构
         */
        public readonly transform: Transform;
        /**
         * 当前附加到此实体的所有组件的列表
         */
        public readonly components: ComponentList;
        /**
         * 指定应该调用这个entity update方法的频率。1表示每一帧，2表示每一帧，以此类推
         */
        public updateInterval: number = 1;
        public componentBits: BitSet;

        constructor(name: string) {
            this.components = new ComponentList(this);
            this.transform = new Transform(this);
            this.name = name;
            this.id = Entity._idGenerator++;

            this.componentBits = new BitSet();
        }

        public _isDestroyed: boolean;

        /**
         * 如果调用了destroy，那么在下一次处理实体之前这将一直为true
         */
        public get isDestroyed() {
            return this._isDestroyed;
        }

        private _tag: number = 0;

        /**
         * 你可以随意使用。稍后可以使用它来查询场景中具有特定标记的所有实体
         */
        public get tag(): number {
            return this._tag;
        }

        /**
         * 你可以随意使用。稍后可以使用它来查询场景中具有特定标记的所有实体
         * @param value
         */
        public set tag(value: number) {
            this.setTag(value);
        }

        private _enabled: boolean = true;

        /**
         * 启用/禁用实体。当禁用碰撞器从物理系统和组件中移除时，方法将不会被调用
         */
        public get enabled() {
            return this._enabled;
        }

        /**
         * 启用/禁用实体。当禁用碰撞器从物理系统和组件中移除时，方法将不会被调用
         * @param value
         */
        public set enabled(value: boolean) {
            this.setEnabled(value);
        }

        private _updateOrder: number = 0;

        /**
         * 更新此实体的顺序。updateOrder还用于对scene.entities上的标签列表进行排序
         */
        public get updateOrder() {
            return this._updateOrder;
        }

        /**
         * 更新此实体的顺序。updateOrder还用于对scene.entities上的标签列表进行排序
         * @param value
         */
        public set updateOrder(value: number) {
            this.setUpdateOrder(value);
        }

        public get parent(): Transform {
            return this.transform.parent;
        }

        public set parent(value: Transform) {
            this.transform.setParent(value);
        }

        public get childCount() {
            return this.transform.childCount;
        }

        public get position(): Vector2 {
            return this.transform.position;
        }

        public set position(value: Vector2) {
            this.transform.setPosition(value.x, value.y);
        }

        public get localPosition(): Vector2 {
            return this.transform.localPosition;
        }

        public set localPosition(value: Vector2) {
            this.transform.setLocalPosition(value);
        }

        public get rotation(): number {
            return this.transform.rotation;
        }

        public set rotation(value: number) {
            this.transform.setRotation(value);
        }

        public get rotationDegrees(): number {
            return this.transform.rotationDegrees;
        }

        public set rotationDegrees(value: number) {
            this.transform.setRotationDegrees(value);
        }

        public get localRotation(): number {
            return this.transform.localRotation;
        }

        public set localRotation(value: number) {
            this.transform.setLocalRotation(value);
        }

        public get localRotationDegrees(): number {
            return this.transform.localRotationDegrees;
        }

        public set localRotationDegrees(value: number) {
            this.transform.setLocalRotationDegrees(value);
        }

        public get scale(): Vector2 {
            return this.transform.scale;
        }

        public set scale(value: Vector2) {
            this.transform.setScale(value);
        }

        public get localScale(): Vector2 {
            return this.transform.localScale;
        }

        public set localScale(value: Vector2) {
            this.transform.setLocalScale(value);
        }

        public get worldInverseTransform(): Matrix2D {
            return this.transform.worldInverseTransform;
        }

        public get localToWorldTransform(): Matrix2D {
            return this.transform.localToWorldTransform;
        }

        public get worldToLocalTransform(): Matrix2D {
            return this.transform.worldToLocalTransform;
        }

        public onTransformChanged(comp: transform.Component) {
            // 通知我们的子项改变了位置
            this.components.onEntityTransformChanged(comp);
        }

        /**
         * 设置实体的标记
         * @param tag
         */
        public setTag(tag: number): Entity {
            if (this._tag != tag) {
                // 我们只有在已经有场景的情况下才会调用entityTagList。如果我们还没有场景，我们会被添加到entityTagList
                if (this.scene)
                    this.scene.entities.removeFromTagList(this);
                this._tag = tag;
                if (this.scene)
                    this.scene.entities.addToTagList(this);
            }

            return this;
        }

        /**
         * 设置实体的启用状态。当禁用碰撞器从物理系统和组件中移除时，方法将不会被调用
         * @param isEnabled
         */
        public setEnabled(isEnabled: boolean) {
            if (this._enabled != isEnabled) {
                this._enabled = isEnabled;

                if (this._enabled)
                    this.components.onEntityEnabled();
                else
                    this.components.onEntityDisabled();
            }

            return this;
        }

        /**
         * 设置此实体的更新顺序。updateOrder还用于对scene.entities上的标签列表进行排序
         * @param updateOrder
         */
        public setUpdateOrder(updateOrder: number) {
            if (this._updateOrder != updateOrder) {
                this._updateOrder = updateOrder;
                if (this.scene) {
                    this.scene.entities.markEntityListUnsorted();
                    this.scene.entities.markTagUnsorted(this.tag);
                }

                return this;
            }
        }

        /**
         * 从场景中删除实体并销毁所有子元素
         */
        public destroy() {
            this._isDestroyed = true;
            this.scene.entities.remove(this);
            this.transform.parent = null;

            // 销毁所有子项
            for (let i = this.transform.childCount - 1; i >= 0; i--) {
                let child = this.transform.getChild(i);
                child.entity.destroy();
            }
        }

        /**
         * 将实体从场景中分离。下面的生命周期方法将被调用在组件上:OnRemovedFromEntity
         */
        public detachFromScene() {
            this.scene.entities.remove(this);
            this.components.deregisterAllComponents();

            for (let i = 0; i < this.transform.childCount; i++)
                this.transform.getChild(i).entity.detachFromScene();
        }

        /**
         * 将一个先前分离的实体附加到一个新的场景
         * @param newScene
         */
        public attachToScene(newScene: Scene) {
            this.scene = newScene;
            newScene.entities.add(this);
            this.components.registerAllComponents();

            for (let i = 0; i < this.transform.childCount; i++) {
                this.transform.getChild(i).entity.attachToScene(newScene);
            }
        }

        /**
         * 创建此实体的深层克隆。子类可以重写此方法来复制任何自定义字段。
         * 当重写时，应该调用CopyFrom方法，它将为您克隆所有组件、碰撞器和转换子组件。
         * 注意克隆的实体不会被添加到任何场景中!你必须自己添加它们!
         * @param position
         */
        public clone(position: Vector2 = new Vector2()): Entity {
            let entity = new Entity(this.name + "(clone)");
            entity.copyFrom(this);
            entity.transform.position = position;

            return entity;
        }

        /**
         * 在提交了所有挂起的实体更改后，将此实体添加到场景时调用
         */
        public onAddedToScene() {
        }

        /**
         * 当此实体从场景中删除时调用
         */
        public onRemovedFromScene() {
            // 如果已经被销毁了，移走我们的组件。如果我们只是分离，我们需要保持我们的组件在实体上。
            if (this._isDestroyed)
                this.components.removeAllComponents();
        }

        /**
         * 每帧进行调用进行更新组件
         */
        public update() {
            this.components.update();
        }

        /**
         * 将组件添加到组件列表中。返回组件。
         * @param component
         */
        public addComponent<T extends Component>(component: T): T {
            component.entity = this;
            this.components.add(component);
            component.initialize();
            return component;
        }

        /**
         * 获取类型T的第一个组件并返回它。如果没有找到组件，则返回null。
         * @param type
         */
        public getComponent<T extends Component>(type): T {
            return this.components.getComponent(type, false) as T;
        }

        /**
         * 检查实体是否具有该组件
         * @param type
         */
        public hasComponent<T extends Component>(type) {
            return this.components.getComponent<T>(type, false) != null;
        }

        /**
         * 获取类型T的第一个组件并返回它。如果没有找到组件，将创建组件。
         * @param type
         */
        public getOrCreateComponent<T extends Component>(type: T) {
            let comp = this.components.getComponent<T>(type, true);
            if (!comp) {
                comp = this.addComponent<T>(type);
            }

            return comp;
        }

        /**
         * 获取typeName类型的所有组件，但不使用列表分配
         * @param typeName
         * @param componentList
         */
        public getComponents(typeName: string | any, componentList?) {
            return this.components.getComponents(typeName, componentList);
        }

        /**
         * 从组件列表中删除组件
         * @param component
         */
        public removeComponent(component: Component) {
            this.components.remove(component);
        }

        /**
         * 从组件列表中删除类型为T的第一个组件
         * @param type
         */
        public removeComponentForType<T extends Component>(type) {
            let comp = this.getComponent<T>(type);
            if (comp) {
                this.removeComponent(comp);
                return true;
            }

            return false;
        }

        /**
         * 从实体中删除所有组件
         */
        public removeAllComponents() {
            for (let i = 0; i < this.components.count; i++) {
                this.removeComponent(this.components.buffer[i]);
            }
        }

        public compareTo(other: Entity): number {
            let compare = this._updateOrder - other._updateOrder;
            if (compare == 0)
                compare = this.id - other.id;
            return compare;
        }

        public toString(): string {
            return `[Entity: name: ${this.name}, tag: ${this.tag}, enabled: ${this.enabled}, depth: ${this.updateOrder}]`;
        }

        /**
         * 将实体的属性、组件和碰撞器复制到此实例
         * @param entity
         */
        protected copyFrom(entity: Entity) {
            this.tag = entity.tag;
            this.updateInterval = entity.updateInterval;
            this.updateOrder = entity.updateOrder;
            this.enabled = entity.enabled;

            this.transform.scale = entity.transform.scale;
            this.transform.rotation = entity.transform.rotation;

            for (let i = 0; i < entity.components.count; i++)
                this.addComponent(entity.components.buffer[i].clone());
            for (let i = 0; i < entity.components._componentsToAdd.length; i++)
                this.addComponent(entity.components._componentsToAdd[i].clone());

            for (let i = 0; i < entity.transform.childCount; i++) {
                let child = entity.transform.getChild(i).entity;
                let childClone = child.clone();
                childClone.transform.copyFrom(child.transform);
                childClone.transform.parent = this.transform;
            }
        }
    }
}
