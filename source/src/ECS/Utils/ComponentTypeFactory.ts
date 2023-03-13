module es {
    /**
     * 组件类型工厂，用于生成和管理组件类型。
     * 维护了一个类型映射表，将组件类型与其唯一索引相对应，以便在运行时高效地检查实体是否包含特定的组件类型。
     */
    export class ComponentTypeFactory {
        /** 组件类型与其唯一索引的映射表 */
        private componentTypes: Record<string, ComponentType> = {};
        /** 组件类型列表，按索引访问组件类型 */
        public readonly types: Bag<ComponentType> = new Bag<ComponentType>();
        /** 当前组件类型的计数器 */
        private componentTypeCount = 0;

        /**
         * 获取给定组件类型的唯一索引。
         * 如果该组件类型尚未存在于类型映射表中，则创建一个新的组件类型，并将其添加到映射表和类型列表中。
         * @param c 要查找或创建的组件类型
         * @returns 组件类型的唯一索引
         */
        public getIndexFor(c: new (...args: any[]) => any): number {
            return this.getTypeFor(c).getIndex();
        }

        /**
         * 获取给定组件类型的ComponentType对象。
         * 如果该组件类型尚未存在于类型映射表中，则创建一个新的ComponentType对象，并将其添加到映射表和类型列表中。
         * @param c 要查找或创建的组件类型
         * @returns 组件类型的ComponentType对象
         */
        public getTypeFor(c: new (...args: any[]) => any): ComponentType {
            // 如果给定的组件类型是一个已有的索引，则直接返回对应的ComponentType对象
            if (typeof c === "number") {
                return this.types.get(c);
            }

            // 获取给定组件类型对应的类名
            const className = getClassName(c);

            // 如果类型映射表中不存在该组件类型，则创建一个新的ComponentType对象
            if (!this.componentTypes[className]) {
                const index = this.componentTypeCount++;
                const type = new ComponentType(c, index);
                this.componentTypes[className] = type;
                this.types.set(index, type);
            }

            // 返回对应的ComponentType对象
            return this.componentTypes[className];
        }
    }
}