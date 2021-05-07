///<reference path="../Components/IUpdatable.ts" />
module es {
    export class ComponentList {
        /**
         * 组件列表的全局updateOrder排序
         */
        public static compareUpdatableOrder: IUpdatableComparer = new IUpdatableComparer();
        public _entity: Entity;

        /**
         * 添加到实体的组件列表
         */
        public _components: Component[] = [];
        /**
         * 所有需要更新的组件列表
         */
        public _updatableComponents: IUpdatable[] = [];
        /**
         * 添加到此框架的组件列表。用来对组件进行分组，这样我们就可以同时进行加工
         */
        public _componentsToAdd: { [index: number]: Component } = {};
        /**
         * 标记要删除此框架的组件列表。用来对组件进行分组，这样我们就可以同时进行加工
         */
        public _componentsToRemove: { [index: number]: Component } = {};
        public _tempBufferList: Component[] = [];
        /**
         * 用于确定是否需要对该框架中的组件进行排序的标志
         */
        public _isComponentListUnsorted: boolean;
        private componentsByType = new Map<new (...args: any[]) => Component, es.Component[]>();
        private componentsToAddByType = new Map<new (...args: any[]) => Component, es.Component[]>();

        constructor(entity: Entity) {
            this._entity = entity;
        }

        public get count() {
            return this._components.length;
        }

        public get buffer() {
            return this._components;
        }

        public markEntityListUnsorted() {
            this._isComponentListUnsorted = true;
        }

        public add(component: Component) {
            this._componentsToAdd[component.id] = component;
            this.addComponentsToAddByType(component);
        }

        public remove(component: Component) {
            if (this._componentsToAdd[component.id]) {
                delete this._componentsToAdd[component.id];
                this.removeComponentsToAddByType(component);
                return;
            }

            this._componentsToRemove[component.id] = component;
        }

        /**
         * 立即从组件列表中删除所有组件
         */
        public removeAllComponents() {
            for (let i = 0; i < this._components.length; i++) {
                this.handleRemove(this._components[i]);
            }

            this.componentsByType.clear();
            this.componentsToAddByType.clear();
            this._components.length = 0;
            this._updatableComponents.length = 0;
            this._componentsToAdd = {};
            this._componentsToRemove = {};
        }

        public deregisterAllComponents() {
            for (let component of this._components) {
                if (!component) continue;

                // 处理IUpdatable
                if (isIUpdatable(component))
                    new es.List(this._updatableComponents).remove(component);

                this.decreaseBits(component);
                this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
            }
        }

        public registerAllComponents() {
            for (let component of this._components) {
                if (isIUpdatable(component))
                    this._updatableComponents.push(component);

                this.addBits(component);
                this._entity.scene.entityProcessors.onComponentAdded(this._entity);
            }
        }

        private decreaseBits(component: Component) {
            let bits = this._entity.componentBits;
            let typeIndex = ComponentTypeManager.getIndexFor(TypeUtils.getType(component));
            bits.set(typeIndex, bits.get(typeIndex) - 1);
        }

        private addBits(component: Component) {
            let bits = this._entity.componentBits;
            let typeIndex = ComponentTypeManager.getIndexFor(TypeUtils.getType(component));
            bits.set(typeIndex, bits.get(typeIndex) + 1);
        }

        /**
         * 处理任何需要删除或添加的组件
         */
        public updateLists() {
            for (let i in this._componentsToRemove) {
                let component = this._componentsToRemove[i];
                this.handleRemove(component);
                for (let index = 0; index < this._components.length; index++) {
                    let searchComponent = this._components[index];
                    if (searchComponent.id == component.id) {
                        this._components.splice(index, 1);
                        break;
                    }
                }
                this.removeComponentsByType(component);
            }

            this._componentsToRemove = {};

            for (let i in this._componentsToAdd) {
                let component = this._componentsToAdd[i];

                if (isIUpdatable(component))
                    this._updatableComponents.push(component);

                this.addBits(component);
                this._entity.scene.entityProcessors.onComponentAdded(this._entity);

                this.addComponentsByType(component);
                this._components.push(component);
                this._tempBufferList.push(component);
            }

            // 在调用onAddedToEntity之前清除，以防添加更多组件
            this._componentsToAdd = {};
            this.componentsToAddByType.clear();
            this._isComponentListUnsorted = true;

            // 现在所有的组件都添加到了场景中，我们再次循环并调用onAddedToEntity/onEnabled
            for (let i = 0; i < this._tempBufferList.length; i++) {
                let component = this._tempBufferList[i];
                component.onAddedToEntity();

                // enabled检查实体和组件
                if (component.enabled) {
                    component.onEnabled();
                }
            }

            this._tempBufferList.length = 0;
        }

        public handleRemove(component: Component) {
            if (isIUpdatable(component))
                new es.List(this._updatableComponents).remove(component);

            this.decreaseBits(component);
            this._entity.scene.entityProcessors.onComponentRemoved(this._entity);

            component.onRemovedFromEntity();
            component.entity = null;
        }

        private removeComponentsByType(component: Component) {
            let fastList = this.componentsByType.get(TypeUtils.getType(component));
            let fastIndex = fastList.findIndex(c => c.id == component.id);
            if (fastIndex != -1) {
                fastList.splice(fastIndex, 1);
            }
        }

        private addComponentsByType(component: Component) {
            let fastList = this.componentsByType.get(TypeUtils.getType(component));
            if (!fastList) fastList = [];
            fastList.push(component);
            this.componentsByType.set(TypeUtils.getType(component), fastList);
        }

        private removeComponentsToAddByType(component: Component) {
            let fastList = this.componentsToAddByType.get(TypeUtils.getType(component));
            let fastIndex = fastList.findIndex(c => c.id == component.id);
            if (fastIndex != -1) {
                fastList.splice(fastIndex, 1);
            }
        }

        private addComponentsToAddByType(component: Component) {
            let fastList = this.componentsToAddByType.get(TypeUtils.getType(component));
            if (!fastList) fastList = [];
            fastList.push(component);
            this.componentsToAddByType.set(TypeUtils.getType(component), fastList);
        }

        /**
         * 获取类型T的第一个组件并返回它
         * 可以选择跳过检查未初始化的组件(尚未调用onAddedToEntity方法的组件)
         * 如果没有找到组件，则返回null。
         * @param type
         * @param onlyReturnInitializedComponents
         */
        public getComponent<T extends Component>(type, onlyReturnInitializedComponents: boolean): T {
            let fastList = this.componentsByType.get(type);
            if (fastList && fastList.length > 0)
                return fastList[0] as T;

            // 我们可以选择检查挂起的组件，以防addComponent和getComponent在同一个框架中被调用
            if (!onlyReturnInitializedComponents) {
                let fastToAddList = this.componentsToAddByType.get(type);
                if (fastToAddList && fastToAddList.length > 0)
                    return fastToAddList[0] as T;
            }

            return null;
        }

        /**
         * 获取T类型的所有组件，但不使用列表分配
         * @param typeName
         * @param components
         */
        public getComponents(typeName: any, components?: any[]) {
            if (!components)
                components = [];

            let fastList = this.componentsByType.get(typeName);
            if (fastList)
                components = components.concat(fastList);

            let fastToAddList = this.componentsToAddByType.get(typeName);
            if (fastToAddList)
                components = components.concat(fastToAddList);

            return components;
        }

        public update() {
            this.updateLists();
            for (let i = 0; i < this._updatableComponents.length; i++) {
                if (this._updatableComponents[i].enabled)
                    this._updatableComponents[i].update();
            }
        }

        public onEntityTransformChanged(comp: transform.Component) {
            for (let i = 0; i < this._components.length; i++) {
                if (this._components[i].enabled)
                    this._components[i].onEntityTransformChanged(comp);
            }

            for (let i in this._componentsToAdd) {
                let component = this._componentsToAdd[i];
                if (component.enabled)
                    component.onEntityTransformChanged(comp);
            }
        }

        public onEntityEnabled() {
            for (let i = 0; i < this._components.length; i++)
                this._components[i].onEnabled();
        }

        public onEntityDisabled() {
            for (let i = 0; i < this._components.length; i++)
                this._components[i].onDisabled();
        }
    }
}
