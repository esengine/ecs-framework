import { Entity, IScene, SceneSerializer, SerializedScene, SerializedEntity } from '@esengine/ecs-framework';
import { BehaviorTreeNode } from '../Components/BehaviorTreeNode';

/**
 * 行为树持久化工具
 *
 * 使用框架的序列化系统进行二进制/JSON序列化
 */
export class BehaviorTreePersistence {
    /**
     * 序列化行为树（JSON格式）
     *
     * @param rootEntity 行为树根实体
     * @param pretty 是否格式化
     * @returns 序列化数据（JSON字符串或二进制）
     *
     * @example
     * ```typescript
     * const data = BehaviorTreePersistence.serialize(aiRoot);
     * ```
     */
    static serialize(rootEntity: Entity, pretty: boolean = true): string | Uint8Array {
        if (!rootEntity.hasComponent(BehaviorTreeNode)) {
            throw new Error('Entity must have BehaviorTreeNode component');
        }

        if (!rootEntity.scene) {
            throw new Error('Entity must be attached to a scene');
        }

        // 使用 SceneSerializer，但只序列化这棵行为树
        // 创建一个临时场景包含只这个实体树
        return SceneSerializer.serialize(rootEntity.scene, {
            format: 'json',
            pretty: pretty,
            includeMetadata: true
        });
    }

    /**
     * 从序列化数据加载行为树
     *
     * @param scene 场景实例
     * @param data 序列化数据（JSON字符串或二进制）
     *
     * @example
     * ```typescript
     * // 从文件读取
     * const json = await readFile('behavior-tree.json');
     *
     * // 恢复行为树到场景
     * BehaviorTreePersistence.deserialize(scene, json);
     * ```
     */
    static deserialize(scene: IScene, data: string | Uint8Array): void {
        SceneSerializer.deserialize(scene, data, {
            strategy: 'merge'
        });
    }

    /**
     * 序列化为 JSON 字符串
     *
     * @param rootEntity 行为树根实体
     * @param pretty 是否格式化
     * @returns JSON 字符串
     */
    static toJSON(rootEntity: Entity, pretty: boolean = true): string {
        const data = this.serialize(rootEntity, pretty);
        return JSON.stringify(data, null, pretty ? 2 : 0);
    }

    /**
     * 从 JSON 字符串加载
     *
     * @param scene 场景实例
     * @param json JSON 字符串
     */
    static fromJSON(scene: IScene, json: string): void {
        this.deserialize(scene, json);
    }

    /**
     * 保存到文件（需要 Tauri 环境）
     *
     * @param rootEntity 行为树根实体
     * @param filePath 文件路径
     *
     * @example
     * ```typescript
     * await BehaviorTreePersistence.saveToFile(aiRoot, 'ai-behavior.json');
     * ```
     */
    static async saveToFile(rootEntity: Entity, filePath: string): Promise<void> {
        const json = this.toJSON(rootEntity, true);

        // 需要在 Tauri 环境中使用
        // const { writeTextFile } = await import('@tauri-apps/api/fs');
        // await writeTextFile(filePath, json);

        throw new Error('saveToFile requires Tauri environment. Use toJSON() for manual saving.');
    }

    /**
     * 从文件加载（需要 Tauri 环境）
     *
     * @param scene 场景实例
     * @param filePath 文件路径
     * @returns 恢复的根实体
     *
     * @example
     * ```typescript
     * const aiRoot = await BehaviorTreePersistence.loadFromFile(scene, 'ai-behavior.json');
     * ```
     */
    static async loadFromFile(scene: IScene, filePath: string): Promise<Entity> {
        // 需要在 Tauri 环境中使用
        // const { readTextFile } = await import('@tauri-apps/api/fs');
        // const json = await readTextFile(filePath);
        // return this.fromJSON(scene, json);

        throw new Error('loadFromFile requires Tauri environment. Use fromJSON() for manual loading.');
    }

    /**
     * 验证是否为有效的行为树数据
     *
     * @param data 序列化数据（字符串格式）
     * @returns 是否有效
     */
    static validate(data: string): boolean {
        try {
            const parsed = JSON.parse(data) as SerializedScene;

            if (!parsed || typeof parsed !== 'object') {
                return false;
            }

            // 检查必要字段
            if (!parsed.name ||
                typeof parsed.version !== 'number' ||
                !Array.isArray(parsed.entities) ||
                !Array.isArray(parsed.componentTypeRegistry)) {
                return false;
            }

            // 检查是否至少有一个实体包含 BehaviorTreeNode 组件
            const hasBehaviorTreeNode = parsed.entities.some((entity: SerializedEntity) => {
                return entity.components.some(
                    (comp: any) => comp.type === 'BehaviorTreeNode'
                );
            });

            return hasBehaviorTreeNode;
        } catch {
            return false;
        }
    }

    /**
     * 克隆行为树
     *
     * @param scene 场景实例
     * @param rootEntity 要克隆的行为树根实体
     * @returns 克隆的新实体
     *
     * @example
     * ```typescript
     * const clonedAI = BehaviorTreePersistence.clone(scene, originalAI);
     * ```
     */
    static clone(scene: IScene, rootEntity: Entity): Entity {
        const data = this.serialize(rootEntity);
        const entityCountBefore = scene.entities.count;

        this.deserialize(scene, data);

        // 找到新添加的根实体（最后添加的实体）
        const entities = Array.from(scene.entities.buffer);
        for (let i = entities.length - 1; i >= entityCountBefore; i--) {
            const entity = entities[i];
            if (entity.hasComponent(BehaviorTreeNode) && !entity.parent) {
                return entity;
            }
        }

        throw new Error('Failed to find cloned root entity');
    }
}
