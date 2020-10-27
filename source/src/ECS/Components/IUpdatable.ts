module es {
    export interface IUpdatable {
        enabled: boolean;
        updateOrder: number;
        update();
    }

    /**
     * 用于比较组件更新排序
     */
    export class IUpdatableComparer implements IComparer<IUpdatable> {
        public compare(a: Component, b: Component) {
            return a.updateOrder - b.updateOrder;
        }
    }
}