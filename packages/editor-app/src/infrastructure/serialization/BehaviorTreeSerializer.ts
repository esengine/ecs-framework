import { BehaviorTree } from '../../domain/models/BehaviorTree';
import { ISerializer, SerializationFormat } from '../../domain/interfaces/ISerializer';
import { BehaviorTreeAssetSerializer, EditorFormatConverter } from '@esengine/behavior-tree';

/**
 * 序列化选项
 */
export interface SerializationOptions {
    /**
     * 资产版本号
     */
    version?: string;

    /**
     * 资产名称
     */
    name?: string;

    /**
     * 资产描述
     */
    description?: string;

    /**
     * 创建时间
     */
    createdAt?: string;

    /**
     * 修改时间
     */
    modifiedAt?: string;
}

/**
 * 行为树序列化器实现
 */
export class BehaviorTreeSerializer implements ISerializer {
    private readonly defaultOptions: Required<SerializationOptions> = {
        version: '1.0.0',
        name: 'Untitled Behavior Tree',
        description: '',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
    };

    constructor(private readonly options: SerializationOptions = {}) {
        this.defaultOptions = { ...this.defaultOptions, ...options };
    }
    /**
     * 序列化行为树
     */
    serialize(tree: BehaviorTree, format: SerializationFormat): string | Uint8Array {
        const treeObject = tree.toObject();

        if (format === 'json') {
            return JSON.stringify(treeObject, null, 2);
        }

        throw new Error(`不支持的序列化格式: ${format}`);
    }

    /**
     * 反序列化行为树
     */
    deserialize(data: string | Uint8Array, format: SerializationFormat): BehaviorTree {
        if (format === 'json') {
            if (typeof data !== 'string') {
                throw new Error('JSON 格式需要字符串数据');
            }

            const obj = JSON.parse(data);
            return BehaviorTree.fromObject(obj);
        }

        throw new Error(`不支持的反序列化格式: ${format}`);
    }

    /**
     * 导出为运行时资产格式
     * @param tree 行为树
     * @param format 导出格式
     * @param options 可选的序列化选项（覆盖默认值）
     */
    exportToRuntimeAsset(
        tree: BehaviorTree,
        format: SerializationFormat,
        options?: SerializationOptions
    ): string | Uint8Array {
        const nodes = tree.nodes.map((node) => ({
            id: node.id,
            template: node.template,
            data: node.data,
            position: node.position.toObject(),
            children: Array.from(node.children)
        }));

        const connections = tree.connections.map((conn) => conn.toObject());
        const blackboard = tree.blackboard.toObject();

        const finalOptions = { ...this.defaultOptions, ...options };
        finalOptions.modifiedAt = new Date().toISOString();

        const editorFormat = {
            version: finalOptions.version,
            metadata: {
                name: finalOptions.name,
                description: finalOptions.description,
                createdAt: finalOptions.createdAt,
                modifiedAt: finalOptions.modifiedAt
            },
            nodes,
            connections,
            blackboard
        };

        const asset = EditorFormatConverter.toAsset(editorFormat);

        if (format === 'json') {
            return BehaviorTreeAssetSerializer.serialize(asset, { format: 'json', pretty: true });
        } else if (format === 'binary') {
            return BehaviorTreeAssetSerializer.serialize(asset, { format: 'binary' });
        }

        throw new Error(`不支持的导出格式: ${format}`);
    }
}
