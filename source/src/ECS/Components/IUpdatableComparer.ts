module es {
    /**
     * 用于比较组件更新排序
     */
    export class IUpdatableComparer {
        public compare(a: Component, b: Component) {
            return a.updateOrder - b.updateOrder;
        }
    }
}