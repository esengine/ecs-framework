/**
 * Collision Layer Configuration Service
 * 碰撞层配置服务
 *
 * 管理碰撞层的定义和碰撞矩阵配置
 */

/**
 * 碰撞层定义
 */
export interface CollisionLayerDefinition {
    /** 层索引 (0-15) */
    index: number;
    /** 层名称 */
    name: string;
    /** 层描述 */
    description?: string;
}

/**
 * 碰撞层配置
 */
export interface CollisionLayerSettings {
    /** 层定义列表 */
    layers: CollisionLayerDefinition[];
    /** 碰撞矩阵 (16x16 位图，matrix[i] 表示第 i 层可以与哪些层碰撞) */
    collisionMatrix: number[];
}

/**
 * 默认碰撞层配置
 */
export const DEFAULT_COLLISION_LAYERS: CollisionLayerDefinition[] = [
    { index: 0, name: 'Default', description: '默认层' },
    { index: 1, name: 'Player', description: '玩家' },
    { index: 2, name: 'Enemy', description: '敌人' },
    { index: 3, name: 'Projectile', description: '投射物' },
    { index: 4, name: 'Ground', description: '地面' },
    { index: 5, name: 'Platform', description: '平台' },
    { index: 6, name: 'Trigger', description: '触发器' },
    { index: 7, name: 'Item', description: '物品' },
    { index: 8, name: 'Layer8', description: '自定义层8' },
    { index: 9, name: 'Layer9', description: '自定义层9' },
    { index: 10, name: 'Layer10', description: '自定义层10' },
    { index: 11, name: 'Layer11', description: '自定义层11' },
    { index: 12, name: 'Layer12', description: '自定义层12' },
    { index: 13, name: 'Layer13', description: '自定义层13' },
    { index: 14, name: 'Layer14', description: '自定义层14' },
    { index: 15, name: 'Layer15', description: '自定义层15' },
];

/**
 * 默认碰撞矩阵 - 所有层都可以互相碰撞
 */
export const DEFAULT_COLLISION_MATRIX: number[] = Array(16).fill(0xFFFF);

/**
 * 碰撞层配置管理器
 */
export class CollisionLayerConfig {
    private static instance: CollisionLayerConfig | null = null;

    private layers: CollisionLayerDefinition[] = [...DEFAULT_COLLISION_LAYERS];
    private collisionMatrix: number[] = [...DEFAULT_COLLISION_MATRIX];
    private listeners: Set<() => void> = new Set();

    private constructor() {}

    public static getInstance(): CollisionLayerConfig {
        if (!CollisionLayerConfig.instance) {
            CollisionLayerConfig.instance = new CollisionLayerConfig();
        }
        return CollisionLayerConfig.instance;
    }

    /**
     * 获取所有层定义
     */
    public getLayers(): readonly CollisionLayerDefinition[] {
        return this.layers;
    }

    /**
     * 获取层名称
     */
    public getLayerName(index: number): string {
        if (index < 0 || index >= 16) return `Layer${index}`;
        return this.layers[index]?.name ?? `Layer${index}`;
    }

    /**
     * 设置层名称
     */
    public setLayerName(index: number, name: string): void {
        if (index < 0 || index >= 16) return;
        if (this.layers[index]) {
            this.layers[index].name = name;
            this.notifyListeners();
        }
    }

    /**
     * 设置层描述
     */
    public setLayerDescription(index: number, description: string): void {
        if (index < 0 || index >= 16) return;
        if (this.layers[index]) {
            this.layers[index].description = description;
            this.notifyListeners();
        }
    }

    /**
     * 获取碰撞矩阵
     */
    public getCollisionMatrix(): readonly number[] {
        return this.collisionMatrix;
    }

    /**
     * 检查两个层是否可以碰撞
     */
    public canLayersCollide(layerA: number, layerB: number): boolean {
        if (layerA < 0 || layerA >= 16 || layerB < 0 || layerB >= 16) {
            return false;
        }
        return (this.collisionMatrix[layerA] & (1 << layerB)) !== 0;
    }

    /**
     * 设置两个层是否可以碰撞
     */
    public setLayersCanCollide(layerA: number, layerB: number, canCollide: boolean): void {
        if (layerA < 0 || layerA >= 16 || layerB < 0 || layerB >= 16) {
            return;
        }

        if (canCollide) {
            this.collisionMatrix[layerA] |= (1 << layerB);
            this.collisionMatrix[layerB] |= (1 << layerA);
        } else {
            this.collisionMatrix[layerA] &= ~(1 << layerB);
            this.collisionMatrix[layerB] &= ~(1 << layerA);
        }
        this.notifyListeners();
    }

    /**
     * 获取指定层的碰撞掩码
     */
    public getLayerMask(layerIndex: number): number {
        if (layerIndex < 0 || layerIndex >= 16) return 0xFFFF;
        return this.collisionMatrix[layerIndex];
    }

    /**
     * 根据层索引获取层位值
     */
    public getLayerBit(layerIndex: number): number {
        if (layerIndex < 0 || layerIndex >= 16) return 1;
        return 1 << layerIndex;
    }

    /**
     * 从层位值获取层索引
     */
    public getLayerIndex(layerBit: number): number {
        for (let i = 0; i < 16; i++) {
            if (layerBit === (1 << i)) {
                return i;
            }
        }
        // 如果是多层位值，返回第一个设置的位
        for (let i = 0; i < 16; i++) {
            if ((layerBit & (1 << i)) !== 0) {
                return i;
            }
        }
        return 0;
    }

    /**
     * 加载配置
     */
    public loadSettings(settings: Partial<CollisionLayerSettings>): void {
        if (settings.layers) {
            this.layers = settings.layers.map((layer, i) => ({
                index: layer.index ?? i,
                name: layer.name ?? `Layer${i}`,
                description: layer.description
            }));
            // 确保有16个层
            while (this.layers.length < 16) {
                const idx = this.layers.length;
                this.layers.push({ index: idx, name: `Layer${idx}` });
            }
        }
        if (settings.collisionMatrix) {
            this.collisionMatrix = [...settings.collisionMatrix];
            while (this.collisionMatrix.length < 16) {
                this.collisionMatrix.push(0xFFFF);
            }
        }
        this.notifyListeners();
    }

    /**
     * 导出配置
     */
    public exportSettings(): CollisionLayerSettings {
        return {
            layers: [...this.layers],
            collisionMatrix: [...this.collisionMatrix]
        };
    }

    /**
     * 重置为默认配置
     */
    public resetToDefault(): void {
        this.layers = [...DEFAULT_COLLISION_LAYERS];
        this.collisionMatrix = [...DEFAULT_COLLISION_MATRIX];
        this.notifyListeners();
    }

    /**
     * 添加监听器
     */
    public addListener(listener: () => void): void {
        this.listeners.add(listener);
    }

    /**
     * 移除监听器
     */
    public removeListener(listener: () => void): void {
        this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        for (const listener of this.listeners) {
            listener();
        }
    }
}
