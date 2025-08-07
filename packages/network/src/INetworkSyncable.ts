/**
 * 网络同步接口
 * 
 * 为帧同步框架提供网络状态管理
 */
export interface INetworkSyncable {
    /**
     * 获取网络同步状态
     * 
     * @returns 序列化的网络状态数据
     */
    getNetworkState(): Uint8Array;
    
    /**
     * 应用网络状态
     * 
     * @param data - 网络状态数据
     */
    applyNetworkState(data: Uint8Array): void;
    
    /**
     * 获取变化的字段编号列表
     * 
     * @returns 变化字段的编号数组
     */
    getDirtyFields(): number[];
    
    /**
     * 标记所有字段为干净状态
     */
    markClean(): void;
    
    /**
     * 标记字段为脏状态
     * 
     * @param fieldNumber - 字段编号
     */
    markFieldDirty(fieldNumber: number): void;
    
    /**
     * 检查字段是否为脏状态
     * 
     * @param fieldNumber - 字段编号
     * @returns 是否为脏状态
     */
    isFieldDirty(fieldNumber: number): boolean;
}