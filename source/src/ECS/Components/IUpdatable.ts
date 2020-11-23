module es {
    /**
     * 接口，当添加到一个Component时，只要Component和实体被启用，它就会在每个框架中调用更新方法。
     */
    export interface IUpdatable {
        enabled: boolean;
        updateOrder: number;
        update();
    }

    /**
     * 用于比较组件更新排序
     */
    export class IUpdatableComparer implements IComparer<IUpdatable> {
        public compare(a: IUpdatable, b: IUpdatable) {
            return a.updateOrder - b.updateOrder;
        }
    }

    export var isIUpdatable = (props: any): props is IUpdatable => typeof (props as IUpdatable)['js'] !== 'undefined';
}