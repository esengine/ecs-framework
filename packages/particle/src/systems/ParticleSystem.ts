import { EntitySystem, Matcher, ECSSystem, Time, Entity } from '@esengine/ecs-framework';
import { ParticleSystemComponent } from '../ParticleSystemComponent';
import { ParticleRenderDataProvider } from '../rendering/ParticleRenderDataProvider';

/**
 * Transform 组件接口（避免直接依赖 engine-core）
 * Transform component interface (avoid direct dependency on engine-core)
 */
interface ITransformComponent {
    worldPosition?: { x: number; y: number; z: number };
    position: { x: number; y: number; z: number };
}

/**
 * 粒子更新系统
 * Particle update system
 *
 * Updates all ParticleSystemComponents with their entity's world position.
 * 使用实体的世界坐标更新所有粒子系统组件。
 */
@ECSSystem('ParticleUpdate', { updateOrder: 100 })
export class ParticleUpdateSystem extends EntitySystem {
    private _transformType: (new (...args: any[]) => ITransformComponent) | null = null;
    private _renderDataProvider: ParticleRenderDataProvider;

    constructor() {
        super(Matcher.empty().all(ParticleSystemComponent));
        this._renderDataProvider = new ParticleRenderDataProvider();
    }

    /**
     * 设置 Transform 组件类型
     * Set Transform component type
     *
     * @param transformType - Transform component class | Transform 组件类
     */
    setTransformType(transformType: new (...args: any[]) => ITransformComponent): void {
        this._transformType = transformType;
    }

    /**
     * 获取渲染数据提供者
     * Get render data provider
     */
    getRenderDataProvider(): ParticleRenderDataProvider {
        return this._renderDataProvider;
    }

    protected override process(entities: readonly Entity[]): void {
        const deltaTime = Time.deltaTime;

        for (const entity of entities) {
            if (!entity.enabled) continue;

            const particle = entity.getComponent(ParticleSystemComponent) as ParticleSystemComponent | null;
            if (!particle) continue;

            let worldX = 0;
            let worldY = 0;
            let transform: ITransformComponent | null = null;

            // 获取 Transform 位置 | Get Transform position
            if (this._transformType) {
                transform = entity.getComponent(this._transformType as any) as ITransformComponent | null;
                if (transform) {
                    const pos = transform.worldPosition ?? transform.position;
                    worldX = pos.x;
                    worldY = pos.y;
                }
            }

            // 更新粒子系统 | Update particle system
            if (particle.isPlaying) {
                particle.update(deltaTime, worldX, worldY);
            }

            // 更新渲染数据提供者的 Transform 引用 | Update render data provider's Transform reference
            if (transform) {
                this._renderDataProvider.register(particle, transform);
            }
        }

        // 标记渲染数据需要更新 | Mark render data as dirty
        this._renderDataProvider.markDirty();
    }

    protected override onAdded(entity: Entity): void {
        const particle = entity.getComponent(ParticleSystemComponent) as ParticleSystemComponent | null;
        if (particle) {
            particle.initialize();

            // 注册到渲染数据提供者 | Register to render data provider
            if (this._transformType) {
                const transform = entity.getComponent(this._transformType as any) as ITransformComponent | null;
                if (transform) {
                    this._renderDataProvider.register(particle, transform);
                }
            }
        }
    }

    protected override onRemoved(entity: Entity): void {
        const particle = entity.getComponent(ParticleSystemComponent) as ParticleSystemComponent | null;
        if (particle) {
            // 从渲染数据提供者注销 | Unregister from render data provider
            this._renderDataProvider.unregister(particle);
        }
    }

    /**
     * 系统销毁时清理
     * Cleanup on system destroy
     */
    public override destroy(): void {
        super.destroy();
        this._renderDataProvider.dispose();
    }
}
