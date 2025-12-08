import type { IService } from '@esengine/ecs-framework';
import { Injectable } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';
import type { ISerializer } from '../Plugin/EditorModule';

const logger = createLogger('SerializerRegistry');

/**
 * 序列化器注册表
 *
 * 管理所有数据序列化器的注册和查询。
 */
@Injectable()
export class SerializerRegistry implements IService {
    private serializers: Map<string, ISerializer> = new Map();

    /**
     * 注册序列化器
     *
     * @param pluginName - 插件名称
     * @param serializer - 序列化器实例
     */
    public register(pluginName: string, serializer: ISerializer): void {
        const type = serializer.getSupportedType();
        const key = `${pluginName}:${type}`;

        if (this.serializers.has(key)) {
            logger.warn(`Serializer for ${key} is already registered`);
            return;
        }

        this.serializers.set(key, serializer);
        logger.info(`Registered serializer: ${key}`);
    }

    /**
     * 批量注册序列化器
     *
     * @param pluginName - 插件名称
     * @param serializers - 序列化器实例数组
     */
    public registerMultiple(pluginName: string, serializers: ISerializer[]): void {
        for (const serializer of serializers) {
            this.register(pluginName, serializer);
        }
    }

    /**
     * 注销序列化器
     *
     * @param pluginName - 插件名称
     * @param type - 数据类型
     * @returns 是否成功注销
     */
    public unregister(pluginName: string, type: string): boolean {
        const key = `${pluginName}:${type}`;
        const result = this.serializers.delete(key);

        if (result) {
            logger.info(`Unregistered serializer: ${key}`);
        }

        return result;
    }

    /**
     * 注销插件的所有序列化器
     *
     * @param pluginName - 插件名称
     */
    public unregisterAll(pluginName: string): void {
        const prefix = `${pluginName}:`;
        const keysToDelete: string[] = [];

        for (const key of this.serializers.keys()) {
            if (key.startsWith(prefix)) {
                keysToDelete.push(key);
            }
        }

        for (const key of keysToDelete) {
            this.serializers.delete(key);
            logger.info(`Unregistered serializer: ${key}`);
        }
    }

    /**
     * 获取序列化器
     *
     * @param pluginName - 插件名称
     * @param type - 数据类型
     * @returns 序列化器实例，如果未找到则返回 undefined
     */
    public get(pluginName: string, type: string): ISerializer | undefined {
        const key = `${pluginName}:${type}`;
        return this.serializers.get(key);
    }

    /**
     * 查找支持指定类型的序列化器
     *
     * @param type - 数据类型
     * @returns 序列化器实例数组
     */
    public findByType(type: string): ISerializer[] {
        const result: ISerializer[] = [];

        for (const [key, serializer] of this.serializers) {
            if (key.endsWith(`:${type}`)) {
                result.push(serializer);
            }
        }

        return result;
    }

    /**
     * 获取所有序列化器
     *
     * @returns 序列化器映射表
     */
    public getAll(): Map<string, ISerializer> {
        return new Map(this.serializers);
    }

    /**
     * 检查序列化器是否已注册
     *
     * @param pluginName - 插件名称
     * @param type - 数据类型
     * @returns 是否已注册
     */
    public has(pluginName: string, type: string): boolean {
        const key = `${pluginName}:${type}`;
        return this.serializers.has(key);
    }

    /**
     * 序列化数据
     *
     * @param pluginName - 插件名称
     * @param type - 数据类型
     * @param data - 要序列化的数据
     * @returns 二进制数据
     * @throws 如果序列化器未注册
     */
    public serialize<T = any>(pluginName: string, type: string, data: T): Uint8Array {
        const serializer = this.get(pluginName, type);
        if (!serializer) {
            throw new Error(`Serializer not found: ${pluginName}:${type}`);
        }

        return serializer.serialize(data);
    }

    /**
     * 反序列化数据
     *
     * @param pluginName - 插件名称
     * @param type - 数据类型
     * @param data - 二进制数据
     * @returns 反序列化后的数据
     * @throws 如果序列化器未注册
     */
    public deserialize<T = any>(pluginName: string, type: string, data: Uint8Array): T {
        const serializer = this.get(pluginName, type);
        if (!serializer) {
            throw new Error(`Serializer not found: ${pluginName}:${type}`);
        }

        return serializer.deserialize(data);
    }

    /**
     * 释放资源
     */
    public dispose(): void {
        this.serializers.clear();
        logger.info('SerializerRegistry disposed');
    }
}
