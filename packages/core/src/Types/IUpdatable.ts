/**
 * 可更新接口
 *
 * 实现此接口的服务将在每帧被Core自动调用update方法
 */
export interface IUpdatable {
    /**
     * 每帧更新方法
     *
     * @param deltaTime - 帧时间间隔（秒），可选参数
     */
    update(deltaTime?: number): void;
}

/**
 * 检查对象是否实现了IUpdatable接口
 */
export function isUpdatable(obj: any): obj is IUpdatable {
    return obj && typeof obj.update === 'function';
}
