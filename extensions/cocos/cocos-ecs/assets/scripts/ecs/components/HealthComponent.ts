import { Component } from '@esengine/ecs-framework';

/**
 * 生命值组件 - 管理实体的生命值和相关状态
 * 
 * 展示游戏逻辑组件的设计：
 * 1. 包含生命值的核心数据
 * 2. 提供简单的查询方法
 * 3. 复杂的伤害处理逻辑留给系统处理
 */
export class HealthComponent extends Component {
    /** 最大生命值 */
    public maxHealth: number;
    /** 当前生命值 */
    public currentHealth: number;
    /** 生命值回复速度（每秒回复量） */
    public regenRate: number = 0;
    /** 最后受到伤害的时间（用于延迟回血等机制） */
    public lastDamageTime: number = 0;
    /** 是否无敌 */
    public invincible: boolean = false;
    /** 无敌持续时间 */
    public invincibleDuration: number = 0;
    
    constructor(maxHealth: number = 100, regenRate: number = 0) {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.regenRate = regenRate;
    }
    
    /**
     * 检查是否死亡
     */
    isDead(): boolean {
        return this.currentHealth <= 0;
    }
    
    /**
     * 检查是否满血
     */
    isFullHealth(): boolean {
        return this.currentHealth >= this.maxHealth;
    }
    
    /**
     * 获取生命值百分比（0-1）
     */
    getHealthPercentage(): number {
        return this.currentHealth / this.maxHealth;
    }
    
    /**
     * 检查生命值是否低于指定百分比
     */
    isHealthBelowPercentage(percentage: number): boolean {
        return this.getHealthPercentage() < percentage;
    }
    
    /**
     * 设置生命值（不超过最大值）
     */
    setHealth(health: number) {
        this.currentHealth = Math.max(0, Math.min(health, this.maxHealth));
    }
    
    /**
     * 增加生命值（治疗）
     */
    heal(amount: number) {
        this.currentHealth = Math.min(this.currentHealth + amount, this.maxHealth);
    }
    
    /**
     * 减少生命值（受伤）
     * 注意：这里只修改数据，具体的伤害逻辑（如死亡处理）应该在系统中实现
     */
    takeDamage(damage: number) {
        if (this.invincible) return;
        
        this.currentHealth = Math.max(0, this.currentHealth - damage);
        this.lastDamageTime = Date.now();
    }
    
    /**
     * 设置无敌状态
     */
    setInvincible(duration: number) {
        this.invincible = true;
        this.invincibleDuration = duration;
    }
    
    /**
     * 重置到满血状态
     */
    reset() {
        this.currentHealth = this.maxHealth;
        this.invincible = false;
        this.invincibleDuration = 0;
        this.lastDamageTime = 0;
    }
} 