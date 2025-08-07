/**
 * 可更新接口
 * 当添加到组件时，只要组件和实体被启用，就会在每帧调用update方法
 */
export interface IUpdatable {
    enabled: boolean;
    updateOrder: number;
    update(): void;
}

/**
 * 用于比较组件更新排序的比较器
 */
export class IUpdatableComparer {
    public compare(a: IUpdatable, b: IUpdatable): number {
        return a.updateOrder - b.updateOrder;
    }
}

/**
 * 检查对象是否实现了IUpdatable接口
 * @param props 要检查的对象
 * @returns 如果实现了IUpdatable接口返回true，否则返回false
 */
export function isIUpdatable(props: any): props is IUpdatable {
    return typeof (props as IUpdatable)['update'] !== 'undefined';
}