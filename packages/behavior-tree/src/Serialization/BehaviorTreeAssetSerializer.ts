import { createLogger, BinarySerializer } from '@esengine/ecs-framework';
import type { BehaviorTreeAsset } from './BehaviorTreeAsset';
import { BehaviorTreeAssetValidator } from './BehaviorTreeAsset';
import { EditorFormatConverter, type EditorFormat } from './EditorFormatConverter';

const logger = createLogger('BehaviorTreeAssetSerializer');

/**
 * 行为树序列化格式
 * Behavior tree serialization format
 */
export type BehaviorTreeSerializationFormat = 'json' | 'binary';

/**
 * 序列化选项
 */
export interface SerializationOptions {
    /**
     * 序列化格式
     */
    format: BehaviorTreeSerializationFormat;

    /**
     * 是否美化JSON输出（仅format='json'时有效）
     */
    pretty?: boolean;

    /**
     * 是否在序列化前验证资产
     */
    validate?: boolean;
}

/**
 * 反序列化选项
 */
export interface DeserializationOptions {
    /**
     * 是否在反序列化后验证资产
     */
    validate?: boolean;

    /**
     * 是否严格模式（验证失败抛出异常）
     */
    strict?: boolean;
}

/**
 * 行为树资产序列化器
 *
 * 支持JSON和二进制两种格式
 */
export class BehaviorTreeAssetSerializer {
    /**
     * 序列化资产
     *
     * @param asset 行为树资产
     * @param options 序列化选项
     * @returns 序列化后的数据（字符串或Uint8Array）
     *
     * @example
     * ```typescript
     * // JSON格式
     * const jsonData = BehaviorTreeAssetSerializer.serialize(asset, { format: 'json', pretty: true });
     *
     * // 二进制格式
     * const binaryData = BehaviorTreeAssetSerializer.serialize(asset, { format: 'binary' });
     * ```
     */
    static serialize(
        asset: BehaviorTreeAsset,
        options: SerializationOptions = { format: 'json', pretty: true }
    ): string | Uint8Array {
        // 验证资产（如果需要）
        if (options.validate !== false) {
            const validation = BehaviorTreeAssetValidator.validate(asset);
            if (!validation.valid) {
                const errors = validation.errors?.join(', ') || 'Unknown error';
                throw new Error(`资产验证失败: ${errors}`);
            }

            if (validation.warnings && validation.warnings.length > 0) {
                logger.warn(`资产验证警告: ${validation.warnings.join(', ')}`);
            }
        }

        // 根据格式序列化
        if (options.format === 'json') {
            return this.serializeToJSON(asset, options.pretty);
        } else {
            return this.serializeToBinary(asset);
        }
    }

    /**
     * 序列化为JSON格式
     */
    private static serializeToJSON(asset: BehaviorTreeAsset, pretty: boolean = true): string {
        try {
            const json = pretty
                ? JSON.stringify(asset, null, 2)
                : JSON.stringify(asset);

            logger.info(`已序列化为JSON: ${json.length} 字符`);
            return json;
        } catch (error) {
            throw new Error(`JSON序列化失败: ${error}`);
        }
    }

    /**
     * 序列化为二进制格式
     */
    private static serializeToBinary(asset: BehaviorTreeAsset): Uint8Array {
        try {
            const binary = BinarySerializer.encode(asset);
            logger.info(`已序列化为二进制: ${binary.length} 字节`);
            return binary;
        } catch (error) {
            throw new Error(`二进制序列化失败: ${error}`);
        }
    }

    /**
     * 反序列化资产
     *
     * @param data 序列化的数据（字符串或Uint8Array）
     * @param options 反序列化选项
     * @returns 行为树资产
     *
     * @example
     * ```typescript
     * // 从JSON加载
     * const asset = BehaviorTreeAssetSerializer.deserialize(jsonString);
     *
     * // 从二进制加载
     * const asset = BehaviorTreeAssetSerializer.deserialize(binaryData);
     * ```
     */
    static deserialize(
        data: string | Uint8Array,
        options: DeserializationOptions = { validate: true, strict: true }
    ): BehaviorTreeAsset {
        let asset: BehaviorTreeAsset;

        try {
            if (typeof data === 'string') {
                asset = this.deserializeFromJSON(data);
            } else {
                asset = this.deserializeFromBinary(data);
            }
        } catch (error) {
            throw new Error(`反序列化失败: ${error}`);
        }

        // 验证资产（如果需要）
        if (options.validate !== false) {
            const validation = BehaviorTreeAssetValidator.validate(asset);

            if (!validation.valid) {
                const errors = validation.errors?.join(', ') || 'Unknown error';
                if (options.strict) {
                    throw new Error(`资产验证失败: ${errors}`);
                } else {
                    logger.error(`资产验证失败: ${errors}`);
                }
            }

            if (validation.warnings && validation.warnings.length > 0) {
                logger.warn(`资产验证警告: ${validation.warnings.join(', ')}`);
            }
        }

        return asset;
    }

    /**
     * 从JSON反序列化
     */
    private static deserializeFromJSON(json: string): BehaviorTreeAsset {
        try {
            const data = JSON.parse(json);

            // 检测是否是编辑器格式（EditorFormat）
            // 编辑器格式有 nodes/connections/blackboard，但没有 rootNodeId
            // 运行时资产格式有 rootNodeId
            const isEditorFormat = !data.rootNodeId && data.nodes && data.connections;

            if (isEditorFormat) {
                logger.info('检测到编辑器格式，正在转换为运行时资产格式...');
                const editorData = data as EditorFormat;
                const asset = EditorFormatConverter.toAsset(editorData);
                logger.info(`已从编辑器格式转换: ${asset.nodes.length} 个节点`);
                return asset;
            } else {
                const asset = data as BehaviorTreeAsset;
                logger.info(`已从运行时资产格式反序列化: ${asset.nodes.length} 个节点`);
                return asset;
            }
        } catch (error) {
            throw new Error(`JSON解析失败: ${error}`);
        }
    }

    /**
     * 从二进制反序列化
     */
    private static deserializeFromBinary(binary: Uint8Array): BehaviorTreeAsset {
        try {
            const asset = BinarySerializer.decode(binary) as BehaviorTreeAsset;
            logger.info(`已从二进制反序列化: ${asset.nodes.length} 个节点`);
            return asset;
        } catch (error) {
            throw new Error(`二进制解码失败: ${error}`);
        }
    }

    /**
     * 检测数据格式
     *
     * @param data 序列化的数据
     * @returns 格式类型
     */
    static detectFormat(data: string | Uint8Array): BehaviorTreeSerializationFormat {
        if (typeof data === 'string') {
            return 'json';
        } else {
            return 'binary';
        }
    }

    /**
     * 获取序列化数据的信息（不完全反序列化）
     *
     * @param data 序列化的数据
     * @returns 资产元信息
     */
    static getInfo(data: string | Uint8Array): {
        format: BehaviorTreeSerializationFormat;
        name: string;
        version: string;
        nodeCount: number;
        blackboardVariableCount: number;
        size: number;
    } | null {
        try {
            const format = this.detectFormat(data);
            let asset: BehaviorTreeAsset;

            if (format === 'json') {
                asset = JSON.parse(data as string);
            } else {
                asset = BinarySerializer.decode(data as Uint8Array) as BehaviorTreeAsset;
            }

            const size = typeof data === 'string' ? data.length : data.length;

            return {
                format,
                name: asset.metadata.name,
                version: asset.version,
                nodeCount: asset.nodes.length,
                blackboardVariableCount: asset.blackboard.length,
                size
            };
        } catch (error) {
            logger.error(`获取资产信息失败: ${error}`);
            return null;
        }
    }

    /**
     * 转换格式
     *
     * @param data 源数据
     * @param targetFormat 目标格式
     * @param pretty 是否美化JSON（仅当目标格式为json时有效）
     * @returns 转换后的数据
     *
     * @example
     * ```typescript
     * // JSON转二进制
     * const binary = BehaviorTreeAssetSerializer.convert(jsonString, 'binary');
     *
     * // 二进制转JSON
     * const json = BehaviorTreeAssetSerializer.convert(binaryData, 'json', true);
     * ```
     */
    static convert(
        data: string | Uint8Array,
        targetFormat: BehaviorTreeSerializationFormat,
        pretty: boolean = true
    ): string | Uint8Array {
        const asset = this.deserialize(data, { validate: false });

        return this.serialize(asset, {
            format: targetFormat,
            pretty,
            validate: false
        });
    }

    /**
     * 比较两个资产数据的大小
     *
     * @param jsonData JSON格式数据
     * @param binaryData 二进制格式数据
     * @returns 压缩率（百分比）
     */
    static compareSize(jsonData: string, binaryData: Uint8Array): {
        jsonSize: number;
        binarySize: number;
        compressionRatio: number;
        savedBytes: number;
    } {
        const jsonSize = jsonData.length;
        const binarySize = binaryData.length;
        const savedBytes = jsonSize - binarySize;
        const compressionRatio = (savedBytes / jsonSize) * 100;

        return {
            jsonSize,
            binarySize,
            compressionRatio,
            savedBytes
        };
    }
}
