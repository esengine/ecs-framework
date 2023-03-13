///<reference path="../Components/IUpdatable.ts" />
module es {
    export class ComponentList {
        /**
         * 比较IUpdatable对象的更新顺序。
         */
        public static compareUpdatableOrder: IUpdatableComparer = new IUpdatableComparer();
        public _entity: Entity;
        /**
         * 实体的组件列表。
         */
        public _components: Component[] = [];

        /**
         * 可更新的组件列表。
         */
        public _updatableComponents: IUpdatable[] = [];

        /**
         * 等待添加到实体的组件列表。
         */
        public _componentsToAdd: { [index: number]: Component } = {};

        /**
         * 等待从实体中移除的组件列表。
         */
        public _componentsToRemove: { [index: number]: Component } = {};

        /**
         * 等待添加到实体的组件列表（作为数组）。
         */
        public _componentsToAddList: Component[] = [];

        /**
         * 等待从实体中移除的组件列表（作为数组）。
         */
        public _componentsToRemoveList: Component[] = [];

        /**
         * 临时的组件缓冲列表。
         */
        public _tempBufferList: Component[] = [];

        /**
         * 指示组件列表是否已排序的标志。
         */
        public _isComponentListUnsorted: boolean;

        /**
         * 按组件类型组织的组件列表字典。
         */
        private componentsByType = new Map<new (...args: any[]) => Component, es.Component[]>();

        /**
         * 按组件类型组织的等待添加到实体的组件列表字典。
         */
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

        /**
         * 将组件添加到实体的组件列表中，并添加到组件类型字典中。
         * @param component 要添加的组件。
         */
        public add(component: Component) {
            // 将组件添加到_componentsToAdd和_componentsToAddList中，并添加到相应的组件类型字典中
            this._componentsToAdd[component.id] = component;
            this._componentsToAddList.push(component);
            this.addComponentsToAddByType(component);
        }

        /**
         * 从实体的组件列表中移除组件，并从相应的组件类型字典中移除组件。
         * @param component 要从实体中移除的组件。
         */
        public remove(component: Component) {
            // 如果组件在_componentsToAdd中，则将其从_componentsToAddList中移除，并从相应的组件类型字典中移除组件
            if (this._componentsToAdd[component.id]) {
                const index = this._componentsToAddList.findIndex((c) => c.id === component.id);
                if (index !== -1) {
                    this._componentsToAddList.splice(index, 1);
                }
                delete this._componentsToAdd[component.id];
                this.removeComponentsToAddByType(component);
                return;
            }

            // 如果组件不在_componentsToAdd中，则将其添加到_componentsToRemove和_componentsToRemoveList中
            this._componentsToRemove[component.id] = component;
            this._componentsToRemoveList.push(component);
        }


        /**
         * 立即从组件列表中删除所有组件
         */
        public removeAllComponents() {
            if (this._components.length > 0) {
                for (let i = 0, s = this._components.length; i < s; ++i) {
                    this.handleRemove(this._components[i]);
                }
            }

            this.componentsByType.clear();
            this.componentsToAddByType.clear();
            this._components.length = 0;
            this._updatableComponents.length = 0;
            this._componentsToAdd = {};
            this._componentsToRemove = {};
            this._componentsToAddList.length = 0;
            this._componentsToRemoveList.length = 0;
        }

        /**
         * 从实体的所有组件上注销并从相关数据结构中删除它们。
         */
        public deregisterAllComponents() {
            if (this._components.length > 0) {
                for (const component of this._components) {
                    // 处理IUpdatable
                    if (isIUpdatable(component)) {
                        // 创建一个新的List实例，从_updatableComponents中移除组件，以避免并发修改异常
                        new es.List(this._updatableComponents).remove(component);
                    }

                    // 从位掩码中减去组件类型的索引，通知实体处理器一个组件已被移除
                    this.decreaseBits(component);
                    this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
                }
            }
        }

        /**
         * 注册实体的所有组件，并将它们添加到相应的数据结构中。
         */
        public registerAllComponents() {
            if (this._components.length > 0) {
                for (const component of this._components) {
                    if (isIUpdatable(component)) {
                        // 如果组件是可更新的，则将其添加到_updatableComponents中
                        this._updatableComponents.push(component);
                    }

                    // 将组件类型的索引添加到实体的位掩码中，通知实体处理器一个组件已被添加
                    this.addBits(component);
                    this._entity.scene.entityProcessors.onComponentAdded(this._entity);
                }
            }
        }

        /**
         * 从实体的位掩码中减去组件类型的索引。
         * @param component 要从实体中删除的组件。
         */
        private decreaseBits(component: Component) {
            const bits = this._entity.componentBits;

            // 获取组件类型的索引，将其对应位掩码减1
            const typeIndex = ComponentTypeManager.getIndexFor(TypeUtils.getType(component));
            bits.set(typeIndex, bits.get(typeIndex) - 1);
        }

        /**
         * 在实体的位掩码中添加组件类型的索引。
         * @param component 要添加到实体的组件。
         */
        private addBits(component: Component) {
            const bits = this._entity.componentBits;

            // 获取组件类型的索引，将其对应位掩码加1
            const typeIndex = ComponentTypeManager.getIndexFor(TypeUtils.getType(component));
            bits.set(typeIndex, bits.get(typeIndex) + 1);
        }

        /**
         * 更新实体的组件列表和相关数据结构。
         * 如果有组件要添加或删除，它将相应地更新组件列表和其他数据结构。
         */
        public updateLists() {
            // 处理要删除的组件
            if (this._componentsToRemoveList.length > 0) {
                for (const component of this._componentsToRemoveList) {
                    // 从实体中删除组件，从组件列表和相关数据结构中删除组件
                    this.handleRemove(component);

                    // 从_components数组中删除组件
                    const index = this._components.findIndex((c) => c.id === component.id);
                    if (index !== -1) {
                        this._components.splice(index, 1);
                    }

                    // 从组件类型字典中删除组件
                    this.removeComponentsByType(component);
                }

                // 清空_componentsToRemove和_componentsToRemoveList
                this._componentsToRemove = {};
                this._componentsToRemoveList.length = 0;
            }

            // 处理要添加的组件
            if (this._componentsToAddList.length > 0) {
                for (const component of this._componentsToAddList) {
                    // 如果组件可以更新，则添加到可更新组件列表中
                    if (isIUpdatable(component)) {
                        this._updatableComponents.push(component);
                    }

                    // 更新实体的组件位掩码，通知实体处理器一个组件已经添加
                    this.addBits(component);
                    this._entity.scene.entityProcessors.onComponentAdded(this._entity);

                    // 将组件添加到相应类型的fastList中，将组件添加到_components数组中
                    this.addComponentsByType(component);
                    this._components.push(component);

                    // 将组件添加到_tempBufferList中，稍后调用onAddedToEntity和onEnabled
                    this._tempBufferList.push(component);
                }

                // 清空_componentsToAdd、_componentsToAddList和componentsToAddByType，设置_isComponentListUnsorted标志
                this._componentsToAdd = {};
                this._componentsToAddList.length = 0;
                this.componentsToAddByType.clear();
                this._isComponentListUnsorted = true;
            }

            // 调用新添加组件的onAddedToEntity和onEnabled方法
            if (this._tempBufferList.length > 0) {
                for (const component of this._tempBufferList) {
                    component.onAddedToEntity();

                    // 如果组件已启用，则调用onEnabled方法
                    if (component.enabled) {
                        component.onEnabled();
                    }
                }

                // 清空_tempBufferList
                this._tempBufferList.length = 0;
            }
        }

        public handleRemove(component: Component) {
            // 如果组件可以更新，从可更新组件列表中删除该组件
            if (isIUpdatable(component) && this._updatableComponents.length > 0) {
                const index = this._updatableComponents.findIndex((c) => (<any>c as Component).id === component.id);
                if (index !== -1) {
                    this._updatableComponents.splice(index, 1);
                }
            }

            // 更新实体的组件位掩码
            this.decreaseBits(component);

            // 通知实体处理器一个组件已被删除
            this._entity.scene.entityProcessors.onComponentRemoved(this._entity);

            // 调用组件的onRemovedFromEntity方法，将其entity属性设置为null
            component.onRemovedFromEntity();
            component.entity = null;
        }

        private removeComponentsByType(component: Component) {
            // 获取存储指定类型组件的fastList数组
            const fastList = this.componentsByType.get(TypeUtils.getType(component));

            // 在fastList中查找要删除的组件
            const index = fastList.findIndex((c) => c.id === component.id);
            if (index !== -1) {
                // 找到组件后，使用splice方法将其从fastList中删除
                fastList.splice(index, 1);
            }
        }

        private addComponentsByType(component: Component) {
            // 获取存储指定类型组件的fastList数组
            let fastList = this.componentsByType.get(TypeUtils.getType(component));

            // 如果fastList不存在，则创建一个空数组
            if (!fastList) {
                fastList = [];
            }

            // 在fastList中添加组件
            fastList.push(component);

            // 更新componentsByType字典，以便它包含fastList数组
            this.componentsByType.set(TypeUtils.getType(component), fastList);
        }

        /**
         * 从待添加组件列表中移除指定类型的组件。
         * @param component 要移除的组件
         */
        private removeComponentsToAddByType(component: Component) {
            // 获取待添加组件列表中指定类型的组件列表
            let fastList = this.componentsToAddByType.get(TypeUtils.getType(component));

            // 在该列表中查找指定组件
            let fastIndex = fastList.findIndex(c => c.id == component.id);

            // 如果找到了指定组件，则从列表中移除它
            if (fastIndex != -1) {
                fastList.splice(fastIndex, 1);
            }
        }

        /**
         * 向待添加组件列表中添加指定类型的组件。
         * @param component 要添加的组件
         */
        private addComponentsToAddByType(component: Component) {
            // 获取待添加组件列表中指定类型的组件列表
            let fastList = this.componentsToAddByType.get(TypeUtils.getType(component));

            // 如果指定类型的组件列表不存在，则创建一个新的列表
            if (!fastList) fastList = [];

            // 向指定类型的组件列表中添加组件
            fastList.push(component);

            // 更新待添加组件列表中指定类型的组件列表
            this.componentsToAddByType.set(TypeUtils.getType(component), fastList);
        }

        /**
         * 获取指定类型的第一个组件实例。
         * @param type 组件类型
         * @param onlyReturnInitializedComponents 是否仅返回已初始化的组件
         * @returns 指定类型的第一个组件实例，如果不存在则返回 null
         */
        public getComponent<T extends Component>(
            type: new (...args: any[]) => T,
            onlyReturnInitializedComponents: boolean
        ): T {
            // 获取指定类型的组件列表
            let fastList = this.componentsByType.get(type);

            // 如果指定类型的组件列表存在并且不为空，则返回第一个组件实例
            if (fastList && fastList.length > 0) return fastList[0] as T;

            // 如果不仅返回已初始化的组件，则检查待添加组件列表中是否存在指定类型的组件
            if (!onlyReturnInitializedComponents) {
                let fastToAddList = this.componentsToAddByType.get(type);
                if (fastToAddList && fastToAddList.length > 0)
                    return fastToAddList[0] as T;
            }

            // 如果指定类型的组件列表为空且待添加组件列表中也不存在该类型的组件，则返回 null
            return null;
        }

        /**
         * 获取指定类型的所有组件实例。
         * @param typeName 组件类型名称
         * @param components 存储组件实例的数组
         * @returns 存储了指定类型的所有组件实例的数组
         */
        public getComponents(typeName: any, components?: any[]) {
            // 如果没有传入组件实例数组，则创建一个新数组
            if (!components) components = [];

            // 获取指定类型的组件列表，并将其添加到组件实例数组中
            let fastList = this.componentsByType.get(typeName);
            if (fastList) components = components.concat(fastList);

            // 获取待添加组件列表中的指定类型的组件列表，并将其添加到组件实例数组中
            let fastToAddList = this.componentsToAddByType.get(typeName);
            if (fastToAddList) components = components.concat(fastToAddList);

            // 返回存储了指定类型的所有组件实例的数组
            return components;
        }

        public update() {
            this.updateLists();
            if (this._updatableComponents.length > 0) {
                for (let i = 0, s = this._updatableComponents.length; i < s; ++i) {
                    let updateComponent = this._updatableComponents[i];
                    if (updateComponent.enabled)
                        updateComponent.update();
                }
            }
        }

        public onEntityTransformChanged(comp: ComponentTransform) {
            if (this._components.length > 0) {
                for (let i = 0, s = this._components.length; i < s; ++i) {
                    let component = this._components[i];
                    if (component.enabled)
                        component.onEntityTransformChanged(comp);
                }
            }

            if (this._componentsToAddList.length > 0) {
                for (let i = 0, s = this._componentsToAddList.length; i < s; ++i) {
                    let component = this._componentsToAddList[i];
                    if (component.enabled)
                        component.onEntityTransformChanged(comp);
                }
            }
        }

        public onEntityEnabled() {
            if (this._components.length > 0) {
                for (let i = 0, s = this._components.length; i < s; i++)
                    this._components[i].onEnabled();
            }
        }

        public onEntityDisabled() {
            if (this._components.length > 0) {
                for (let i = 0, s = this._components.length; i < s; i++)
                    this._components[i].onDisabled();
            }
        }
    }
}
