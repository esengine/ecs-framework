module es {
    /**
     * 组件类型管理器，维护了一个组件类型和它们对应的位掩码之间的映射关系。
     * 用于实现实体匹配器中组件类型的比较操作，以确定实体是否符合给定的匹配器条件。
     */
    export class ComponentTypeManager {
        /** 存储组件类型和它们对应的位掩码的Map */
        private static _componentTypesMask: Map<any, number> = new Map<any, number>();

        /**
         * 将给定的组件类型添加到组件类型列表中，并分配一个唯一的位掩码。
         * @param type 要添加的组件类型
         */
        public static add(type) {
            if (!this._componentTypesMask.has(type)) {
                this._componentTypesMask.set(type, this._componentTypesMask.size);
            }
        }

        /**
         * 获取给定组件类型的位掩码。
         * 如果该组件类型还没有分配位掩码，则将其添加到列表中，并分配一个唯一的位掩码。
         * @param type 要获取位掩码的组件类型
         * @returns 组件类型的位掩码
         */
        public static getIndexFor(type) {
            let v = -1;
            if (!this._componentTypesMask.has(type)) {
                this.add(type);
                v = this._componentTypesMask.get(type);
            } else {
                v = this._componentTypesMask.get(type);
            }

            return v;
        }
    }
}
