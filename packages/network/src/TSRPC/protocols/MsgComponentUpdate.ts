/**
 * 组件更新消息（服务器广播给客户端）
 */
export interface MsgComponentUpdate {
    entityId: number;
    componentType: string;
    componentData: any;
    timestamp: number;
}