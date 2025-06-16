import { EntitySystem, Entity, Matcher, Time } from '@esengine/ecs-framework';
import { HealthComponent } from '../components/HealthComponent';

/**
 * 生命值系统 - 处理生命值相关的逻辑
 * 
 * 展示生命值管理：
 * 1. 自动回血
 * 2. 无敌状态管理
 * 3. 死亡处理
 * 4. 事件触发
 */
export class HealthSystem extends EntitySystem {
    /** 回血延迟时间（受伤后多久开始回血，毫秒） */
    private regenDelay: number = 3000;
    
    constructor() {
        // 只处理拥有HealthComponent的实体
        super(Matcher.empty().all(HealthComponent));
    }
    
    public initialize(): void {
        super.initialize();
        console.log("HealthSystem 已初始化 - 开始处理生命值逻辑");
    }
    
    /**
     * 每帧处理：更新生命值相关逻辑
     */
    protected process(entities: Entity[]): void {
        for (const entity of entities) {
            const health = entity.getComponent(HealthComponent);
            
            // 处理无敌状态
            this.processInvincibility(health);
            
            // 处理生命值回复
            this.processHealthRegeneration(entity, health);
            
            // 检查死亡状态
            this.checkDeathStatus(entity, health);
        }
    }
    
    /**
     * 处理无敌状态
     */
    private processInvincibility(health: HealthComponent): void {
        if (health.invincible && health.invincibleDuration > 0) {
            health.invincibleDuration -= Time.deltaTime;
            
            // 无敌时间结束
            if (health.invincibleDuration <= 0) {
                health.invincible = false;
                health.invincibleDuration = 0;
                console.log("无敌状态结束");
            }
        }
    }
    
    /**
     * 处理生命值回复
     */
    private processHealthRegeneration(entity: Entity, health: HealthComponent): void {
        // 如果已经满血或者没有回复速度，则不处理
        if (health.isFullHealth() || health.regenRate <= 0) {
            return;
        }
        
        // 检查是否超过了回血延迟时间
        const currentTime = Date.now();
        if (currentTime - health.lastDamageTime < this.regenDelay) {
            return;
        }
        
        // 计算回血量
        const regenAmount = health.regenRate * Time.deltaTime;
        const oldHealth = health.currentHealth;
        
        // 执行回血
        health.heal(regenAmount);
        
        // 如果实际回了血，输出日志
        if (health.currentHealth > oldHealth) {
            console.log(`${entity.name} 回血: ${oldHealth.toFixed(1)} -> ${health.currentHealth.toFixed(1)} (${health.getHealthPercentage() * 100}%)`);
        }
    }
    
    /**
     * 检查死亡状态
     */
    private checkDeathStatus(entity: Entity, health: HealthComponent): void {
        if (health.isDead()) {
            this.handleEntityDeath(entity, health);
        }
    }
    
    /**
     * 处理实体死亡
     */
    private handleEntityDeath(entity: Entity, health: HealthComponent): void {
        console.log(`💀 ${entity.name} 已死亡！`);
        
        // 触发死亡事件（如果有事件系统）
        this.triggerDeathEvent(entity);
        
        // 可以在这里添加死亡效果、掉落物品等逻辑
        this.createDeathEffect(entity);
        
        // 标记实体为死亡状态（而不是立即销毁）
        // 这样其他系统可以处理死亡相关的逻辑
        entity.addComponent(new DeadMarkerComponent());
        
        // 可选：延迟销毁实体
        setTimeout(() => {
            if (entity && !entity.isDestroyed) {
                entity.destroy();
                console.log(`${entity.name} 已被销毁`);
            }
        }, 1000); // 1秒后销毁
    }
    
    /**
     * 触发死亡事件
     */
    private triggerDeathEvent(entity: Entity): void {
        // 如果项目中有事件系统，可以在这里发送死亡事件
        console.log(`触发死亡事件: ${entity.name}`);
        
        // 示例事件数据
        const deathEventData = {
            entityId: entity.id,
            entityName: entity.name,
            deathTime: Date.now(),
            position: this.getEntityPosition(entity)
        };
        
        // 这里可以调用事件系统发送事件
        // eventBus.emit('entity:died', deathEventData);
    }
    
    /**
     * 创建死亡效果
     */
    private createDeathEffect(entity: Entity): void {
        console.log(`💥 为 ${entity.name} 创建死亡效果`);
        
        // 在实际游戏中，这里可能会：
        // 1. 播放死亡动画
        // 2. 播放死亡音效
        // 3. 创建粒子效果
        // 4. 掉落物品
    }
    
    /**
     * 获取实体位置（辅助方法）
     */
    private getEntityPosition(entity: Entity): { x: number; y: number; z: number } {
        // 尝试获取位置组件
        const position = entity.getComponent(PositionComponent);
        if (position) {
            return {
                x: position.position.x,
                y: position.position.y,
                z: position.position.z
            };
        }
        
        return { x: 0, y: 0, z: 0 };
    }
    
    /**
     * 公共方法：对实体造成伤害
     * 这个方法可以被其他系统调用
     */
    public damageEntity(entity: Entity, damage: number, source?: Entity): boolean {
        const health = entity.getComponent(HealthComponent);
        if (!health || health.invincible) {
            return false; // 无生命值组件或处于无敌状态
        }
        
        const oldHealth = health.currentHealth;
        health.takeDamage(damage);
        
        console.log(`⚔️ ${entity.name} 受到 ${damage} 点伤害: ${oldHealth.toFixed(1)} -> ${health.currentHealth.toFixed(1)}`);
        
        // 如果有伤害来源，可以记录或处理
        if (source) {
            console.log(`伤害来源: ${source.name}`);
        }
        
        return true;
    }
    
    /**
     * 公共方法：治疗实体
     */
    public healEntity(entity: Entity, healAmount: number): boolean {
        const health = entity.getComponent(HealthComponent);
        if (!health || health.isFullHealth()) {
            return false;
        }
        
        const oldHealth = health.currentHealth;
        health.heal(healAmount);
        
        console.log(`💚 ${entity.name} 恢复 ${healAmount} 点生命值: ${oldHealth.toFixed(1)} -> ${health.currentHealth.toFixed(1)}`);
        
        return true;
    }
}

/**
 * 死亡标记组件 - 标记已死亡的实体
 * 这是一个简单的标记组件，用于标识死亡状态
 */
class DeadMarkerComponent extends Component {
    public deathTime: number;
    
    constructor() {
        super();
        this.deathTime = Date.now();
    }
}

// 导入位置组件（用于获取实体位置）
import { PositionComponent } from '../components/PositionComponent';
import { Component } from '@esengine/ecs-framework'; 