/**
 * 序列化类型定义
 */

/**
 * 序列化数据接口
 */
export interface SerializedData {
    /** 序列化类型 */
    type: 'protobuf' | 'json';
    /** 组件类型名称 */
    componentType: string;
    /** 序列化后的数据 */
    data: Uint8Array | any;
    /** 数据大小（字节） */
    size: number;
}