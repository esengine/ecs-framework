module es {
    export class EntityProcessorList {
        private _processors: EntitySystem[] = []; // 处理器列表
        private _orderDirty: boolean = false; // 处理器排序标志

        /** 获取处理器列表 */
        public get processors() {
            return this._processors;
        }

        /** 获取处理器数量 */
        public get count() {
            return this._processors.length;
        }

        /**
         * 添加处理器
         * @param processor 要添加的处理器
         */
        public add(processor: EntitySystem): void {
            this._processors.push(processor);
        }

        /**
         * 移除处理器
         * @param processor 要移除的处理器
         */
        public remove(processor: EntitySystem): void {
            // 使用 es.List 类的 remove() 方法从处理器列表中移除指定处理器
            new es.List(this._processors).remove(processor);
        }

        /**
         * 在实体上添加组件时被调用
         * @param entity 添加组件的实体
         */
        public onComponentAdded(entity: Entity): void {
            this.notifyEntityChanged(entity);
        }

        /**
         * 在实体上移除组件时被调用
         * @param entity 移除组件的实体
         */
        public onComponentRemoved(entity: Entity): void {
            this.notifyEntityChanged(entity);
        }

        /**
         * 在场景中添加实体时被调用
         * @param entity 添加的实体
         */
        public onEntityAdded(entity: Entity): void {
            this.notifyEntityChanged(entity);
        }

        /**
         * 在场景中移除实体时被调用
         * @param entity 移除的实体
         */
        public onEntityRemoved(entity: Entity): void {
            this.removeFromProcessors(entity);
        }

        /** 在处理器列表上开始循环 */
        public begin(): void {
        }

        /** 更新处理器列表 */
        public update(): void {
            // 如果处理器列表为空，则直接返回
            if (this._processors.length === 0) {
                return;
            }

            // 如果需要重新排序处理器列表
            if (this._orderDirty) {
                // 对处理器列表进行排序
                this._processors.sort((a, b) => a.updateOrder - b.updateOrder);

                // 重新设置处理器的更新顺序
                for (let i = 0, s = this._processors.length; i < s; ++i) {
                    const processor = this._processors[i];
                    processor.setUpdateOrder(i);
                }

                // 将标志设置为“未脏”
                this.clearDirty();
            }

            // 调用每个处理器的 update() 方法
            for (let i = 0, s = this._processors.length; i < s; ++i) {
                const processor = this._processors[i];
                processor.update();
            }
        }

        /** 在处理器列表上完成循环 */
        public end(): void {
        }

        /** 设置处理器排序标志 */
        public setDirty(): void {
            this._orderDirty = true;
        }

        /** 清除处理器排序标志 */
        public clearDirty(): void {
            this._orderDirty = false;
        }

        /**
         * 获取指定类型的处理器
         * @param type 指定类型的构造函数
         * @returns 指定类型的处理器
         */
        public getProcessor<T extends EntitySystem>(type: new (...args: any[]) => T): T {
            // 如果处理器列表为空，则返回null
            if (this._processors.length === 0) {
                return null;
            }

            // 遍历处理器列表，查找指定类型的处理器
            for (let i = 0, s = this._processors.length; i < s; ++i) {
                const processor = this._processors[i];

                // 如果当前处理器是指定类型的实例，则返回当前处理器
                if (processor instanceof type) {
                    return processor as T;
                }
            }

            // 如果没有找到指定类型的处理器，则返回null
            return null;
        }

        /**
         * 通知处理器实体已更改
         * @param entity 发生更改的实体
         */
        protected notifyEntityChanged(entity: Entity): void {
            if (this._processors.length === 0) {
                return;
            }

            // 遍历处理器列表，调用每个处理器的 onChanged() 方法
            for (let i = 0, s = this._processors.length; i < s; ++i) {
                const processor = this._processors[i];
                processor.onChanged(entity);
            }
        }

        /**
         * 从处理器列表中移除实体
         * @param entity 要移除的实体
         */
        protected removeFromProcessors(entity: Entity): void {
            if (this._processors.length === 0) {
                return;
            }

            // 遍历处理器列表，调用每个处理器的 remove() 方法
            for (let i = 0, s = this._processors.length; i < s; ++i) {
                const processor = this._processors[i];
                processor.remove(entity);
            }
        }

        /** 在处理器列表上进行后期更新 */
        public lateUpdate(): void {
            if (this._processors.length === 0) {
                return;
            }

            // 调用每个处理器的 lateUpdate() 方法
            for (let i = 0, s = this._processors.length; i < s; ++i) {
                const processor = this._processors[i];
                processor.lateUpdate();
            }
        }
    }
}
