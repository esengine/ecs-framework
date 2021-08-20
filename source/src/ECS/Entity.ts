module es {
    export class EntityComparer implements IComparer<Entity> {
        public compare(self: Entity, other: Entity): number {
            let compare = self.updateOrder - other.updateOrder;
            if (compare == 0)
                compare = self.id - other.id;
            return compare;
        }
    }

    export class Entity implements IEqualityComparable {
        public static entityComparer: IComparer<Entity> = new EntityComparer();
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
        public componentBits: Bits;

        constructor(name: string, id: number) {
            this.components = new ComponentList(this);
            this.transform = new Transform(this);
            this.componentBits = new Bits();
            this.name = name;
            this.id = id;
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

        public onTransformChanged(comp: ComponentTransform) {
            // 通知我们的子项改变了位置
            this.components.onEntityTransformChanged(comp);
        }

        public setParent(parent: Entity);
        public setParent(parent: Transform);
        public setParent(parent: Transform | Entity) {
            if (parent instanceof Transform) {
                this.transform.setParent(parent);
            } else if (parent instanceof Entity) {
                this.transform.setParent(parent.transform);
            }

            return this;
        }

        public setPosition(x: number, y: number) {
            this.transform.setPosition(x, y);
            return this;
        }

        public setLocalPosition(localPosition: Vector2) {
            this.transform.setLocalPosition(localPosition);
            return this;
        }

        public setRotation(radians: number) {
            this.transform.setRotation(radians);
            return this;
        }

        public setRotationDegrees(degrees: number) {
            this.transform.setRotationDegrees(degrees);
            return this;
        }

        public setLocalRotation(radians: number) {
            this.transform.setLocalRotation(radians);
            return this;
        }

        public setLocalRotationDegrees(degrees: number) {
            this.transform.setLocalRotationDegrees(degrees);
            return this;
        }

        public setScale(scale: number);
        public setScale(scale: Vector2);
        public setScale(scale: Vector2 | number) {
            if (scale instanceof Vector2) {
                this.transform.setScale(scale);
            } else {
                this.transform.setScale(new Vector2(scale, scale));
            }

            return this;
        }

        public setLocalScale(scale: number);
        public setLocalScale(scale: Vector2);
        public setLocalScale(scale: Vector2 | number) {
            if (scale instanceof Vector2) {
                this.transform.setLocalScale(scale);
            } else {
                this.transform.setLocalScale(new Vector2(scale, scale));
            }

            return this;
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
            this.scene.identifierPool.checkIn(this.id);
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

        public debugRender(batcher: IBatcher) {
            if (!batcher) return;
            this.components.debugRender(batcher);
        }

        /**
         * 创建组件的新实例。返回实例组件
         * @param componentType 
         */
        public createComponent<T extends Component>(componentType: new (...args) => T): T {
            let component = new componentType();
            this.addComponent(component);
            return component;
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
        public getComponent<T extends Component>(type: new (...args) => T): T {
            return this.components.getComponent(type, false);
        }

        /**
         *  获取类型T的第一个并已加入场景的组件并返回它。如果没有找到组件，则返回null。
         * @param type 
         * @returns 
         */
        public getComponentInScene<T extends Component>(type: new (...args) => T): T {
            return this.components.getComponent(type, true);
        }

        /**
         * 尝试获取T类型的组件。如果未找到任何组件，则返回false
         * @param type 
         * @param outComponent 
         * @returns 
         */
        public tryGetComponent<T extends Component>(type: new (...args) => T, outComponent: Ref<T>): boolean {
            outComponent.value = this.components.getComponent<T>(type, false);
            return outComponent.value != null;
        }

        /**
         * 检查实体是否具有该组件
         * @param type
         */
        public hasComponent<T extends Component>(type: new (...args) => T) {
            return this.components.getComponent<T>(type, false) != null;
        }

        /**
         * 获取类型T的第一个组件并返回它。如果没有找到组件，将创建组件。
         * @param type
         */
        public getOrCreateComponent<T extends Component>(type: new (...args) => T) {
            let comp = this.components.getComponent<T>(type, true);
            if (!comp) {
                comp = this.addComponent<T>(new type());
            }

            return comp;
        }

        /**
         * 获取typeName类型的所有组件，但不使用列表分配
         * @param typeName
         * @param componentList
         */
        public getComponents(typeName: any, componentList?: any[]) {
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

        public tweenPositionTo(to: Vector2, duration: number = 0.3): ITween<Vector2> {
            const tween = Pool.obtain(TransformVector2Tween);
            tween.setTargetAndType(this.transform, TransformTargetType.position);
            tween.initialize(tween, to, duration);

            return tween;
        }

        public tweenLocalPositionTo(to: Vector2, duration = 0.3): ITween<Vector2> {
            const tween = Pool.obtain(TransformVector2Tween);
            tween.setTargetAndType(this.transform, TransformTargetType.localPosition);
            tween.initialize(tween, to, duration);

            return tween;
        }

        public tweenScaleTo(to: Vector2, duration?: number);
        public tweenScaleTo(to: number, duration?: number);
        public tweenScaleTo(to: Vector2 | number, duration: number = 0.3) {
            if (typeof (to) == 'number') {
                return this.tweenScaleTo(new Vector2(to, to), duration);
            }

            const tween = Pool.obtain(TransformVector2Tween);
            tween.setTargetAndType(this.transform, TransformTargetType.scale);
            tween.initialize(tween, to, duration);

            return tween;
        }

        public tweenLocalScaleTo(to: Vector2, duration?);
        public tweenLocalScaleTo(to: number, duration?);
        public tweenLocalScaleTo(to: Vector2 | number, duration = 0.3) {
            if (typeof (to) == 'number') {
                return this.tweenLocalScaleTo(new Vector2(to, to), duration);
            }

            const tween = Pool.obtain(TransformVector2Tween);
            tween.setTargetAndType(this.transform, TransformTargetType.localScale);
            tween.initialize(tween, to, duration);

            return tween;
        }

        public tweenRotationDegreesTo(to: number, duration = 0.3) {
            const tween = Pool.obtain(TransformVector2Tween);
            tween.setTargetAndType(this.transform, TransformTargetType.rotationDegrees);
            tween.initialize(tween, new Vector2(to, to), duration);

            return tween;
        }

        public tweenLocalRotationDegreesTo(to: number, duration = 0.3) {
            const tween = Pool.obtain(TransformVector2Tween);
            tween.setTargetAndType(this.transform, TransformTargetType.localRotationDegrees);
            tween.initialize(tween, new Vector2(to, to), duration);

            return tween;
        }

        public compareTo(other: Entity): number {
            let compare = this._updateOrder - other._updateOrder;
            if (compare == 0)
                compare = this.id - other.id;
            return compare;
        }

        public equals(other: Entity): boolean {
            return this.compareTo(other) == 0;
        }

        public toString(): string {
            return `[Entity: name: ${this.name}, tag: ${this.tag}, enabled: ${this.enabled}, depth: ${this.updateOrder}]`;
        }
    }
}
