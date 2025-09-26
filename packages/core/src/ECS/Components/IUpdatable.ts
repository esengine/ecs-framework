/**
 * 可更新接口
 * @deprecated 不符合ECS架构规范，建议使用EntitySystem来处理更新逻辑而非在组件中实现
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