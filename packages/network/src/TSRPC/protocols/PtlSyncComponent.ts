/**
 * 组件同步协议定义
 */

// 同步组件数据请求
export interface ReqSyncComponent {
    entityId: number;
    componentType: string;
    componentData: any;
    timestamp: number;
}

// 同步组件数据响应
export interface ResSyncComponent {
    success: boolean;
    entityId: number;
    errorMsg?: string;
}