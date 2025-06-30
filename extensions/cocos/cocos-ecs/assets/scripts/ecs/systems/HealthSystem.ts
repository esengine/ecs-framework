import { EntitySystem, Entity, Matcher, Time } from '@esengine/ecs-framework';
import { Health } from '../components';

/**
 * 生命值系统
 * 处理生命值回复、死亡检测等逻辑
 */
export class HealthSystem extends EntitySystem {
    
    constructor() {
        // 处理具有Health组件的实体
        super(Matcher.empty().all(Health));
    }
    
    /**
     * 处理所有实体
     */
    protected process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;
        
        for (const entity of entities) {
            this.processEntity(entity, deltaTime);
        }
    }
    
    /**
     * 处理单个实体
     */
    private processEntity(entity: Entity, deltaTime: number): void {
        const health = entity.getComponent(Health);
        
        if (!health) return;
        
        // 如果实体已死亡，跳过处理
        if (health.isDead) return;
        
        // 处理生命值回复
        if (health.regenRate > 0) {
            const regenAmount = health.regenRate * deltaTime;
            health.heal(regenAmount);
        }
        
        // 检查是否需要标记为死亡
        if (health.currentHealth <= 0 && !health.isDead) {
            health.isDead = true;
            this.onEntityDied(entity);
        }
    }
    
    /**
     * 当实体死亡时调用
     */
    private onEntityDied(entity: Entity): void {
        console.log(`💀 实体 ${entity.name} 已死亡`);
        
        // 这里可以添加死亡相关的逻辑
        // 比如播放死亡动画、掉落物品等
    }
    
    /**
     * 系统初始化时调用
     */
    public initialize(): void {
        super.initialize();
        console.log('❤️ 生命值系统已启动');
    }
} 