import { Component, ECSComponent, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 资产元数据组件
 *
 * 附加到从资产实例化的行为树根节点上，
 * 用于标记资产ID和版本信息，便于循环引用检测和调试。
 *
 * @example
 * ```typescript
 * const rootEntity = BehaviorTreeAssetLoader.instantiate(asset, scene);
 *
 * // 添加元数据
 * const metadata = rootEntity.addComponent(new BehaviorTreeAssetMetadata());
 * metadata.assetId = 'patrol';
 * metadata.assetVersion = '1.0.0';
 * ```
 */
@ECSComponent('BehaviorTreeAssetMetadata')
@Serializable({ version: 1 })
export class BehaviorTreeAssetMetadata extends Component {
    /**
     * 资产ID
     */
    @Serialize()
    assetId: string = '';

    /**
     * 资产版本
     */
    @Serialize()
    assetVersion: string = '';

    /**
     * 资产名称
     */
    @Serialize()
    assetName: string = '';

    /**
     * 加载时间
     */
    @Serialize()
    loadedAt: number = 0;

    /**
     * 资产描述
     */
    @Serialize()
    description: string = '';

    /**
     * 初始化
     */
    initialize(assetId: string, assetVersion: string, assetName?: string): void {
        this.assetId = assetId;
        this.assetVersion = assetVersion;
        this.assetName = assetName || assetId;
        this.loadedAt = Date.now();
    }
}
