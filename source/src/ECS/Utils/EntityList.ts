module es {
    export class EntityList {
        /**
         * 场景引用
         */
        public scene: Scene;

        /**
         * 实体列表
         */
        public _entities: Entity[] = [];

        /**
         * 待添加的实体字典
         */
        public _entitiesToAdded: { [index: number]: Entity } = {};

        /**
         * 待移除的实体字典
         */
        public _entitiesToRemove: { [index: number]: Entity } = {};

        /**
         * 待添加的实体列表
         */
        public _entitiesToAddedList: Entity[] = [];

        /**
         * 待移除的实体列表
         */
        public _entitiesToRemoveList: Entity[] = [];

        /**
         * 实体列表是否已排序
         */
        public _isEntityListUnsorted: boolean;

        /**
         * 实体字典，以实体标签为键
         */
        public _entityDict: Map<number, Set<Entity>> = new Map<number, Set<Entity>>();

        /**
         * 未排序的标签集合
         */
        public _unsortedTags: Set<number> = new Set<number>();

        constructor(scene: Scene) {
            this.scene = scene;
        }

        public get count() {
            return this._entities.length;
        }

        public get buffer() {
            return this._entities;
        }

        public markEntityListUnsorted() {
            this._isEntityListUnsorted = true;
        }

        public markTagUnsorted(tag: number) {
            this._unsortedTags.add(tag);
        }

        /**
         * 将一个实体添加到列表中。所有的生命周期方法将在下一帧中被调用
         * @param entity
         */
        public add(entity: Entity) {
            this._entitiesToAdded[entity.id] = entity;
            this._entitiesToAddedList.push(entity);
        }

        /**
         * 从场景中移除实体。
         * @param entity 要从场景中移除的实体。
         */
        public remove(entity: Entity) {
            // 如果实体在添加列表中，则将其从添加列表中移除
            if (this._entitiesToAdded[entity.id]) {
                const index = this._entitiesToAddedList.findIndex((e) => e.id === entity.id);
                if (index !== -1) {
                    this._entitiesToAddedList.splice(index, 1);
                }
                delete this._entitiesToAdded[entity.id];
                return;
            }

            // 如果实体不在添加列表中，则将其添加到移除列表中并将其添加到移除字典中
            this._entitiesToRemoveList.push(entity);
            if (!this._entitiesToRemove[entity.id]) {
                this._entitiesToRemove[entity.id] = entity;
            }
        }

        /**
         * 从场景中移除所有实体。
         */
        public removeAllEntities() {
            // 清除字典和列表，以及是否已排序的标志
            this._unsortedTags.clear();
            this._entitiesToAdded = {};
            this._entitiesToAddedList.length = 0;
            this._isEntityListUnsorted = false;

            // 调用updateLists方法，以处理要移除的实体
            this.updateLists();

            // 标记并移除所有实体
            for (const entity of this._entities) {
                entity._isDestroyed = true;
                entity.onRemovedFromScene();
                entity.scene = null;
            }

            // 清空实体列表和实体字典
            this._entities.length = 0;
            this._entityDict.clear();
        }

        /**
         * 检查实体是否已经被添加到场景中。
         * @param entity 要检查的实体
         * @returns 如果实体已经被添加到场景中，则返回true；否则返回false
         */
        public contains(entity: Entity): boolean {
            // 检查实体是否存在于_entitiesToAdded字典中
            return !!this._entitiesToAdded[entity.id];
        }

        /**
         * 获取具有指定标签的实体列表。
         * 如果列表不存在，则创建一个新列表并返回。
         * @param tag 实体标签
         * @returns 具有指定标签的实体列表
         */
        public getTagList(tag: number): Set<Entity> {
            // 尝试从_entityDict中获取具有指定标签的实体列表
            let list = this._entityDict.get(tag);

            // 如果列表不存在，则创建一个新的Set实例，并添加到_entityDict中
            if (!list) {
                list = new Set<Entity>();
                this._entityDict.set(tag, list);
            }

            return list;
        }

        /**
         * 添加实体到标签列表中。
         * @param entity 实体
         */
        public addToTagList(entity: Entity) {
            // 获取标签列表
            const list = this.getTagList(entity.tag);

            // 将实体添加到标签列表中
            list.add(entity);

            // 添加未排序标志
            this._unsortedTags.add(entity.tag);
        }

        /**
         * 从标签列表中移除实体。
         * @param entity 实体
         */
        public removeFromTagList(entity: Entity) {
            // 获取实体的标签列表
            const list = this._entityDict.get(entity.tag);

            // 如果标签列表存在，则从中移除实体
            if (list) {
                list.delete(entity);
            }
        }

        /**
         * 更新场景中所有启用的实体的Update方法
         * 如果实体的UpdateInterval为1或Time.frameCount模除UpdateInterval为0，则每帧调用Update
         */
        public update() {
            for (let i = 0; i < this._entities.length; i++) {
                const entity = this._entities[i];
                if (entity.enabled && (entity.updateInterval === 1 || Time.frameCount % entity.updateInterval === 0)) {
                    entity.update();
                }
            }
        }


        /**
         * 更新场景中实体的列表。
         */
        public updateLists() {
            // 处理要移除的实体
            if (this._entitiesToRemoveList.length > 0) {
                for (const entity of this._entitiesToRemoveList) {
                    // 从标签列表中删除实体
                    this.removeFromTagList(entity);

                    // 从场景实体列表中删除实体
                    const index = this._entities.findIndex((e) => e.id === entity.id);
                    if (index !== -1) {
                        this._entities.splice(index, 1);
                    }

                    // 调用实体的onRemovedFromScene方法，并将其scene属性设置为null
                    entity.onRemovedFromScene();
                    entity.scene = null;

                    // 通知场景实体处理器，一个实体已被移除
                    this.scene.entityProcessors.onEntityRemoved(entity);
                }

                // 清空要移除的实体列表和字典
                this._entitiesToRemove = {};
                this._entitiesToRemoveList.length = 0;
            }

            // 处理要添加的实体
            if (this._entitiesToAddedList.length > 0) {
                // 添加实体到场景实体列表和标签列表中
                for (const entity of this._entitiesToAddedList) {
                    this._entities.push(entity);
                    entity.scene = this.scene;
                    this.addToTagList(entity);
                }

                // 通知场景实体处理器，有新的实体已添加
                for (const entity of this._entitiesToAddedList) {
                    this.scene.entityProcessors.onEntityAdded(entity);
                }

                // 调用实体的onAddedToScene方法，以允许它们执行任何场景相关的操作
                for (const entity of this._entitiesToAddedList) {
                    entity.onAddedToScene();
                }

                // 清空要添加的实体列表和字典
                this._entitiesToAdded = {};
                this._entitiesToAddedList.length = 0;
            }
        }


        /**
         * 返回第一个找到的名字为name的实体。如果没有找到则返回null
         * @param name
         */
        public findEntity(name: string) {
            if (this._entities.length > 0) {
                for (let i = 0, s = this._entities.length; i < s; ++i) {
                    let entity = this._entities[i];
                    if (entity.name == name)
                        return entity;
                }
            }

            if (this._entitiesToAddedList.length > 0) {
                for (let i = 0, s = this._entitiesToAddedList.length; i < s; ++i) {
                    let entity = this._entitiesToAddedList[i];
                    if (entity.name == name)
                        return entity;
                }
            }

            return null;
        }

        /**
         * 通过实体ID在场景中查找对应实体
         * @param id 实体ID
         * @returns 返回找到的实体，如果没有找到则返回 null
         */
        public findEntityById(id: number) {
            // 遍历场景中所有实体
            if (this._entities.length > 0) {
                for (let i = 0, s = this._entities.length; i < s; ++i) {
                    let entity = this._entities[i];
                    // 如果实体的ID匹配，返回该实体
                    if (entity.id == id)
                        return entity;
                }
            }

            // 在未添加的实体列表中查找
            return this._entitiesToAdded[id];
        }

        /**
         * 获取标签对应的实体列表
         * @param tag 实体的标签
         * @returns 返回所有拥有该标签的实体列表
         */
        public entitiesWithTag(tag: number): Entity[] {
            // 从字典中获取对应标签的实体列表
            const list = this.getTagList(tag);

            // 从对象池中获取 Entity 类型的数组
            const returnList = ListPool.obtain<Entity>(Entity);

            if (list.size > 0) {
                // 将实体列表中的实体添加到返回列表中
                for (const entity of list) {
                    returnList.push(entity);
                }
            }

            // 返回已填充好实体的返回列表
            return returnList;
        }

        /**
         * 返回第一个找到该tag的实体
         * @param tag
         * @returns
         */
        public entityWithTag(tag: number) {
            let list = this.getTagList(tag);

            if (list.size > 0) {
                for (let entity of list) {
                    return entity;
                }
            }

            return null;
        }

        /**
         * 在场景中查找具有给定类型的组件。
         * @param type 要查找的组件类型。
         * @returns 如果找到，则返回该组件；否则返回null。
         */
        public findComponentOfType<T extends Component>(type: new (...args: any[]) => T): T | null {
            // 遍历场景中的所有实体，查找具有给定类型的组件
            for (const entity of this._entities) {
                if (entity.enabled) {
                    const comp = entity.getComponent(type);
                    if (comp) {
                        return comp;
                    }
                }
            }

            // 遍历待添加的实体列表中的所有实体，查找具有给定类型的组件
            for (const entity of this._entitiesToAddedList) {
                if (entity.enabled) {
                    const comp = entity.getComponent(type);
                    if (comp) {
                        return comp;
                    }
                }
            }

            // 如果找不到具有给定类型的组件，则返回null
            return null;
        }


        /**
         * 在场景中查找具有给定类型的所有组件。
         * @param type 要查找的组件类型。
         * @returns 具有给定类型的所有组件的列表。
         */
        public findComponentsOfType<T extends Component>(type: new (...args: any[]) => T): T[] {
            // 从池中获取一个可重用的组件列表
            const comps = ListPool.obtain<T>(type);

            // 遍历场景中的所有实体，查找具有给定类型的组件并添加到组件列表中
            for (const entity of this._entities) {
                if (entity.enabled) {
                    entity.getComponents(type, comps);
                }
            }

            // 遍历待添加的实体列表中的所有实体，查找具有给定类型的组件并添加到组件列表中
            for (const entity of this._entitiesToAddedList) {
                if (entity.enabled) {
                    entity.getComponents(type, comps);
                }
            }

            // 返回具有给定类型的所有组件的列表
            return comps;
        }


        /**
         * 返回拥有指定类型组件的所有实体
         * @param types 要查询的组件类型列表
         * @returns 返回拥有指定类型组件的所有实体
         */
        public findEntitiesOfComponent(...types: any[]): Entity[] {
            const entities = [];

            // 遍历所有已存在的实体
            for (const entity of this._entities) {
                // 只有启用的实体才会被考虑
                if (entity.enabled) {
                    // 如果types数组为空，直接将实体添加到结果数组中
                    if (types.length === 0) {
                        entities.push(entity);
                        continue;
                    }

                    // 对于每个指定的组件类型，检查实体是否具有该组件
                    let meet = true;
                    for (const type of types) {
                        const hasComp = entity.hasComponent(type);
                        if (!hasComp) {
                            meet = false;
                            break;
                        }
                    }

                    // 如果实体满足要求，将其添加到结果数组中
                    if (meet) {
                        entities.push(entity);
                    }
                }
            }

            // 遍历所有等待添加的实体，和上面的操作类似
            for (const entity of this._entitiesToAddedList) {
                if (entity.enabled) {
                    if (types.length === 0) {
                        entities.push(entity);
                        continue;
                    }

                    let meet = true;
                    for (const type of types) {
                        const hasComp = entity.hasComponent(type);
                        if (!hasComp) {
                            meet = false;
                            break;
                        }
                    }

                    if (meet) {
                        entities.push(entity);
                    }
                }
            }

            return entities;
        }

    }
}
