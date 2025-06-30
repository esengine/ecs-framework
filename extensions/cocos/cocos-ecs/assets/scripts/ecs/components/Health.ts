import { Component } from '@esengine/ecs-framework';

/**
 * 生命值组件
 * 管理实体的生命值、最大生命值等
 */
export class Health extends Component {
    /** 当前生命值 */
    public currentHealth: number = 100;
    
    /** 最大生命值 */
    public maxHealth: number = 100;
    
    /** 是否死亡 */
    public isDead: boolean = false;
    
    /** 生命值回复速度 (每秒) */
    public regenRate: number = 0;
    
    constructor(maxHealth: number = 100) {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
    }
    
    /**
     * 受到伤害
     */
    public takeDamage(damage: number): void {
        this.currentHealth = Math.max(0, this.currentHealth - damage);
        this.isDead = this.currentHealth <= 0;
    }
    
    /**
     * 治疗
     */
    public heal(amount: number): void {
        if (!this.isDead) {
            this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
        }
    }
    
    /**
     * 复活
     */
    public revive(healthPercent: number = 1.0): void {
        this.isDead = false;
        this.currentHealth = Math.floor(this.maxHealth * Math.max(0, Math.min(1, healthPercent)));
    }
    
    /**
     * 获取生命值百分比
     */
    public getHealthPercent(): number {
        return this.maxHealth > 0 ? this.currentHealth / this.maxHealth : 0;
    }
    
    /**
     * 重置组件
     */
    public reset(): void {
        this.currentHealth = this.maxHealth;
        this.isDead = false;
        this.regenRate = 0;
    }
} 