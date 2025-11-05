import { BehaviorTree } from '../models/BehaviorTree';

/**
 * 序列化格式
 */
export type SerializationFormat = 'json' | 'binary';

/**
 * 序列化接口
 * 负责行为树的序列化和反序列化
 */
export interface ISerializer {
    /**
     * 序列化行为树
     */
    serialize(tree: BehaviorTree, format: SerializationFormat): string | Uint8Array;

    /**
     * 反序列化行为树
     */
    deserialize(data: string | Uint8Array, format: SerializationFormat): BehaviorTree;

    /**
     * 导出为运行时资产格式
     */
    exportToRuntimeAsset(
        tree: BehaviorTree,
        format: SerializationFormat
    ): string | Uint8Array;
}
