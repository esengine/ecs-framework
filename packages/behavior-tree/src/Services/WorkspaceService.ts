import { IService } from '@esengine/ecs-framework';

/**
 * 资产类型
 */
export enum AssetType {
    BehaviorTree = 'behavior-tree',
    Blackboard = 'blackboard',
    Unknown = 'unknown'
}

/**
 * 资产注册信息
 */
export interface AssetRegistry {
    /** 资产唯一ID */
    id: string;

    /** 资产名称 */
    name: string;

    /** 资产相对路径（相对于工作区根目录） */
    path: string;

    /** 资产类型 */
    type: AssetType;

    /** 依赖的其他资产ID列表 */
    dependencies: string[];

    /** 最后修改时间 */
    lastModified?: number;

    /** 资产元数据 */
    metadata?: Record<string, any>;
}

/**
 * 工作区配置
 */
export interface WorkspaceConfig {
    /** 工作区名称 */
    name: string;

    /** 工作区版本 */
    version: string;

    /** 工作区根目录（绝对路径） */
    rootPath: string;

    /** 资产目录配置 */
    assetPaths: {
        /** 行为树目录 */
        behaviorTrees: string;

        /** 黑板目录 */
        blackboards: string;
    };

    /** 资产注册表 */
    assets: AssetRegistry[];
}

/**
 * 工作区服务
 *
 * 管理项目的工作区配置和资产注册表，提供：
 * - 工作区配置的加载和保存
 * - 资产注册和查询
 * - 依赖关系追踪
 * - 循环依赖检测
 */
export class WorkspaceService implements IService {
    private config: WorkspaceConfig | null = null;
    private assetMap: Map<string, AssetRegistry> = new Map();
    private assetPathMap: Map<string, AssetRegistry> = new Map();

    /**
     * 初始化工作区
     */
    initialize(config: WorkspaceConfig): void {
        this.config = config;
        this.rebuildAssetMaps();
    }

    /**
     * 重建资产映射表
     */
    private rebuildAssetMaps(): void {
        this.assetMap.clear();
        this.assetPathMap.clear();

        if (!this.config) return;

        for (const asset of this.config.assets) {
            this.assetMap.set(asset.id, asset);
            this.assetPathMap.set(asset.path, asset);
        }
    }

    /**
     * 获取工作区配置
     */
    getConfig(): WorkspaceConfig | null {
        return this.config;
    }

    /**
     * 更新工作区配置
     */
    updateConfig(config: WorkspaceConfig): void {
        this.config = config;
        this.rebuildAssetMaps();
    }

    /**
     * 注册资产
     */
    registerAsset(asset: AssetRegistry): void {
        if (!this.config) {
            throw new Error('工作区未初始化');
        }

        // 检查是否已存在
        const existing = this.config.assets.find(a => a.id === asset.id);
        if (existing) {
            // 更新现有资产
            Object.assign(existing, asset);
        } else {
            // 添加新资产
            this.config.assets.push(asset);
        }

        this.rebuildAssetMaps();
    }

    /**
     * 取消注册资产
     */
    unregisterAsset(assetId: string): void {
        if (!this.config) return;

        const index = this.config.assets.findIndex(a => a.id === assetId);
        if (index !== -1) {
            this.config.assets.splice(index, 1);
            this.rebuildAssetMaps();
        }
    }

    /**
     * 通过ID获取资产
     */
    getAssetById(assetId: string): AssetRegistry | undefined {
        return this.assetMap.get(assetId);
    }

    /**
     * 通过路径获取资产
     */
    getAssetByPath(path: string): AssetRegistry | undefined {
        return this.assetPathMap.get(path);
    }

    /**
     * 获取所有资产
     */
    getAllAssets(): AssetRegistry[] {
        return this.config?.assets || [];
    }

    /**
     * 按类型获取资产
     */
    getAssetsByType(type: AssetType): AssetRegistry[] {
        return this.getAllAssets().filter(a => a.type === type);
    }

    /**
     * 获取行为树资产列表
     */
    getBehaviorTreeAssets(): AssetRegistry[] {
        return this.getAssetsByType(AssetType.BehaviorTree);
    }

    /**
     * 获取黑板资产列表
     */
    getBlackboardAssets(): AssetRegistry[] {
        return this.getAssetsByType(AssetType.Blackboard);
    }

    /**
     * 获取资产的所有依赖（递归）
     */
    getAssetDependencies(assetId: string, visited = new Set<string>()): AssetRegistry[] {
        if (visited.has(assetId)) {
            return [];
        }

        visited.add(assetId);

        const asset = this.getAssetById(assetId);
        if (!asset) {
            return [];
        }

        const dependencies: AssetRegistry[] = [];

        for (const depId of asset.dependencies) {
            const depAsset = this.getAssetById(depId);
            if (depAsset) {
                dependencies.push(depAsset);
                // 递归获取依赖的依赖
                dependencies.push(...this.getAssetDependencies(depId, visited));
            }
        }

        return dependencies;
    }

    /**
     * 检测循环依赖
     *
     * @param assetId 要检查的资产ID
     * @returns 如果存在循环依赖，返回循环路径；否则返回 null
     */
    detectCircularDependency(assetId: string): string[] | null {
        const visited = new Set<string>();
        const path: string[] = [];

        const dfs = (currentId: string): boolean => {
            if (path.includes(currentId)) {
                // 找到循环
                path.push(currentId);
                return true;
            }

            if (visited.has(currentId)) {
                return false;
            }

            visited.add(currentId);
            path.push(currentId);

            const asset = this.getAssetById(currentId);
            if (asset) {
                for (const depId of asset.dependencies) {
                    if (dfs(depId)) {
                        return true;
                    }
                }
            }

            path.pop();
            return false;
        };

        return dfs(assetId) ? path : null;
    }

    /**
     * 检查是否可以添加依赖（不会造成循环依赖）
     *
     * @param assetId 资产ID
     * @param dependencyId 要添加的依赖ID
     * @returns 是否可以安全添加
     */
    canAddDependency(assetId: string, dependencyId: string): boolean {
        const asset = this.getAssetById(assetId);
        if (!asset) return false;

        // 临时添加依赖
        const originalDeps = [...asset.dependencies];
        asset.dependencies.push(dependencyId);

        // 检测循环依赖
        const hasCircular = this.detectCircularDependency(assetId) !== null;

        // 恢复原始依赖
        asset.dependencies = originalDeps;

        return !hasCircular;
    }

    /**
     * 添加资产依赖
     */
    addAssetDependency(assetId: string, dependencyId: string): boolean {
        if (!this.canAddDependency(assetId, dependencyId)) {
            return false;
        }

        const asset = this.getAssetById(assetId);
        if (!asset) return false;

        if (!asset.dependencies.includes(dependencyId)) {
            asset.dependencies.push(dependencyId);
        }

        return true;
    }

    /**
     * 移除资产依赖
     */
    removeAssetDependency(assetId: string, dependencyId: string): void {
        const asset = this.getAssetById(assetId);
        if (!asset) return;

        const index = asset.dependencies.indexOf(dependencyId);
        if (index !== -1) {
            asset.dependencies.splice(index, 1);
        }
    }

    /**
     * 解析资产路径（支持相对路径和绝对路径）
     */
    resolveAssetPath(path: string): string {
        if (!this.config) return path;

        // 如果是绝对路径，直接返回
        if (path.startsWith('/') || path.match(/^[A-Za-z]:/)) {
            return path;
        }

        // 相对路径，拼接工作区根目录
        return `${this.config.rootPath}/${path}`.replace(/\\/g, '/');
    }

    /**
     * 获取资产的相对路径
     */
    getRelativePath(absolutePath: string): string {
        if (!this.config) return absolutePath;

        const rootPath = this.config.rootPath.replace(/\\/g, '/');
        const absPath = absolutePath.replace(/\\/g, '/');

        if (absPath.startsWith(rootPath)) {
            return absPath.substring(rootPath.length + 1);
        }

        return absolutePath;
    }

    /**
     * 清理资源
     */
    dispose(): void {
        this.config = null;
        this.assetMap.clear();
        this.assetPathMap.clear();
    }
}
