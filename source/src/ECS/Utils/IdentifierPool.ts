/**
 * ID池管理器
 * 用于管理实体ID的分配和回收
 */
export class IdentifierPool {
    private _nextAvailableId = 0;
    private _ids: number[] = [];

    /**
     * 获取一个可用的ID
     */
    public checkOut(): number {
        if (this._ids.length > 0) {
            return this._ids.pop()!;
        }
        return this._nextAvailableId++;
    }

    /**
     * 回收一个ID
     * @param id 要回收的ID
     */
    public checkIn(id: number): void {
        this._ids.push(id);
    }
}