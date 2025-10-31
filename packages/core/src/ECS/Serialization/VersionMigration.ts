/**
 * 版本迁移系统
 *
 * 提供组件和场景数据的版本迁移支持
 */

import {SerializedComponent} from "./ComponentSerializer";
import {SerializedScene} from "./SceneSerializer";

/**
 * 组件迁移函数
 */
export type ComponentMigrationFunction = (data: any, fromVersion: number, toVersion: number) => any;

/**
 * 场景迁移函数
 */
export type SceneMigrationFunction = (
    scene: SerializedScene,
    fromVersion: number,
    toVersion: number
) => SerializedScene;

/**
 * 版本迁移管理器
 */
export class VersionMigrationManager {
    /**
     * 组件迁移函数注册表
     * Map<组件类型名, Map<版本号, 迁移函数>>
     */
    private static componentMigrations = new Map<string, Map<number, ComponentMigrationFunction>>();

    /**
     * 场景迁移函数注册表
     * Map<版本号, 迁移函数>
     */
    private static sceneMigrations = new Map<number, SceneMigrationFunction>();

    /**
     * 注册组件迁移函数
     *
     * @param componentType 组件类型名称
     * @param fromVersion 源版本号
     * @param toVersion 目标版本号
     * @param migration 迁移函数
     *
     * @example
     * ```typescript
     * // 从版本1迁移到版本2
     * VersionMigrationManager.registerComponentMigration(
     *     'PlayerComponent',
     *     1,
     *     2,
     *     (data) => {
     *         // 添加新字段
     *         data.experience = 0;
     *         return data;
     *     }
     * );
     * ```
     */
    public static registerComponentMigration(
        componentType: string,
        fromVersion: number,
        _toVersion: number,
        migration: ComponentMigrationFunction
    ): void {
        if (!this.componentMigrations.has(componentType)) {
            this.componentMigrations.set(componentType, new Map());
        }

        const versionMap = this.componentMigrations.get(componentType)!;

        // 使用fromVersion作为key，表示"从这个版本迁移"
        versionMap.set(fromVersion, migration);
    }

    /**
     * 注册场景迁移函数
     *
     * @param fromVersion 源版本号
     * @param toVersion 目标版本号
     * @param migration 迁移函数
     *
     * @example
     * ```typescript
     * VersionMigrationManager.registerSceneMigration(
     *     1,
     *     2,
     *     (scene) => {
     *         // 迁移场景结构
     *         scene.metadata = { ...scene.metadata, migratedFrom: 1 };
     *         return scene;
     *     }
     * );
     * ```
     */
    public static registerSceneMigration(
        fromVersion: number,
        _toVersion: number,
        migration: SceneMigrationFunction
    ): void {
        this.sceneMigrations.set(fromVersion, migration);
    }

    /**
     * 迁移组件数据
     *
     * @param component 序列化的组件数据
     * @param targetVersion 目标版本号
     * @returns 迁移后的组件数据
     */
    public static migrateComponent(
        component: SerializedComponent,
        targetVersion: number
    ): SerializedComponent {
        const currentVersion = component.version;

        if (currentVersion === targetVersion) {
            return component; // 版本相同，无需迁移
        }

        const migrations = this.componentMigrations.get(component.type);
        if (!migrations) {
            console.warn(`No migration path found for component ${component.type}`);
            return component;
        }

        const migratedData = {...component};
        let version = currentVersion;

        // 执行迁移链
        while (version < targetVersion) {
            const migration = migrations.get(version);

            if (!migration) {
                console.warn(
                    `Missing migration from version ${version} to ${version + 1} for ${component.type}`
                );
                break;
            }

            migratedData.data = migration(migratedData.data, version, version + 1);
            version++;
        }

        migratedData.version = version;
        return migratedData;
    }

    /**
     * 迁移场景数据
     *
     * @param scene 序列化的场景数据
     * @param targetVersion 目标版本号
     * @returns 迁移后的场景数据
     */
    public static migrateScene(scene: SerializedScene, targetVersion: number): SerializedScene {
        const currentVersion = scene.version;

        if (currentVersion === targetVersion) {
            return scene; // 版本相同，无需迁移
        }

        let migratedScene = {...scene};
        let version = currentVersion;

        // 执行场景级迁移
        while (version < targetVersion) {
            const migration = this.sceneMigrations.get(version);

            if (!migration) {
                console.warn(`Missing scene migration from version ${version} to ${version + 1}`);
                break;
            }

            migratedScene = migration(migratedScene, version, version + 1);
            version++;
        }

        migratedScene.version = version;

        // 迁移所有组件
        migratedScene = this.migrateSceneComponents(migratedScene);

        return migratedScene;
    }

    /**
     * 迁移场景中所有组件的版本
     */
    private static migrateSceneComponents(scene: SerializedScene): SerializedScene {
        const migratedScene = {...scene};

        migratedScene.entities = scene.entities.map((entity) => ({
            ...entity,
            components: entity.components.map((component) => {
                // 查找组件的目标版本
                const typeInfo = scene.componentTypeRegistry.find(
                    (t) => t.typeName === component.type
                );

                if (typeInfo && typeInfo.version !== component.version) {
                    return this.migrateComponent(component, typeInfo.version);
                }

                return component;
            }),
            children: this.migrateEntitiesComponents(entity.children, scene.componentTypeRegistry)
        }));

        return migratedScene;
    }

    /**
     * 递归迁移实体的组件
     */
    private static migrateEntitiesComponents(
        entities: any[],
        typeRegistry: Array<{ typeName: string; version: number }>
    ): any[] {
        return entities.map((entity) => ({
            ...entity,
            components: entity.components.map((component: SerializedComponent) => {
                const typeInfo = typeRegistry.find((t) => t.typeName === component.type);

                if (typeInfo && typeInfo.version !== component.version) {
                    return this.migrateComponent(component, typeInfo.version);
                }

                return component;
            }),
            children: this.migrateEntitiesComponents(entity.children, typeRegistry)
        }));
    }

    /**
     * 清除所有迁移函数
     */
    public static clearMigrations(): void {
        this.componentMigrations.clear();
        this.sceneMigrations.clear();
    }

    /**
     * 获取组件的迁移路径
     *
     * @param componentType 组件类型名称
     * @returns 可用的迁移版本列表
     */
    public static getComponentMigrationPath(componentType: string): number[] {
        const migrations = this.componentMigrations.get(componentType);
        if (!migrations) {
            return [];
        }

        return Array.from(migrations.keys()).sort((a, b) => a - b);
    }

    /**
     * 获取场景的迁移路径
     *
     * @returns 可用的场景迁移版本列表
     */
    public static getSceneMigrationPath(): number[] {
        return Array.from(this.sceneMigrations.keys()).sort((a, b) => a - b);
    }

    /**
     * 检查是否可以迁移组件
     *
     * @param componentType 组件类型名称
     * @param fromVersion 源版本
     * @param toVersion 目标版本
     * @returns 是否存在完整的迁移路径
     */
    public static canMigrateComponent(
        componentType: string,
        fromVersion: number,
        toVersion: number
    ): boolean {
        if (fromVersion === toVersion) {
            return true;
        }

        const migrations = this.componentMigrations.get(componentType);
        if (!migrations) {
            return false;
        }

        // 检查是否存在完整的迁移路径
        for (let v = fromVersion; v < toVersion; v++) {
            if (!migrations.has(v)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 检查是否可以迁移场景
     *
     * @param fromVersion 源版本
     * @param toVersion 目标版本
     * @returns 是否存在完整的迁移路径
     */
    public static canMigrateScene(fromVersion: number, toVersion: number): boolean {
        if (fromVersion === toVersion) {
            return true;
        }

        // 检查是否存在完整的场景迁移路径
        for (let v = fromVersion; v < toVersion; v++) {
            if (!this.sceneMigrations.has(v)) {
                return false;
            }
        }

        return true;
    }
}

/**
 * 便捷的迁移构建器
 *
 * 提供链式API来定义迁移
 */
export class MigrationBuilder {
    private componentType?: string;
    private fromVersion: number = 1;
    private toVersion: number = 2;

    /**
     * 设置组件类型
     */
    public forComponent(componentType: string): this {
        this.componentType = componentType;
        return this;
    }

    /**
     * 设置版本范围
     */
    public fromVersionToVersion(from: number, to: number): this {
        this.fromVersion = from;
        this.toVersion = to;
        return this;
    }

    /**
     * 注册迁移函数
     */
    public migrate(migration: ComponentMigrationFunction | SceneMigrationFunction): void {
        if (this.componentType) {
            VersionMigrationManager.registerComponentMigration(
                this.componentType,
                this.fromVersion,
                this.toVersion,
                migration as ComponentMigrationFunction
            );
        } else {
            VersionMigrationManager.registerSceneMigration(
                this.fromVersion,
                this.toVersion,
                migration as SceneMigrationFunction
            );
        }
    }
}
