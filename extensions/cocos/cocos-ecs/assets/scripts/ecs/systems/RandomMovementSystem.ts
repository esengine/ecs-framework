import { EntitySystem, Entity, Matcher, Time } from '@esengine/ecs-framework';
import { Transform, Velocity } from '../components';

/**
 * 随机移动系统
 * 让实体随机改变移动方向
 */
export class RandomMovementSystem extends EntitySystem {
    
    /** 每个实体的下次方向改变时间 */
    private nextDirectionChangeTime: Map<number, number> = new Map();
    
    constructor() {
        // 处理具有Transform和Velocity组件的实体
        super(Matcher.empty().all(Transform, Velocity));
    }
    
    /**
     * 处理所有实体
     */
    protected process(entities: Entity[]): void {
        const currentTime = Time.totalTime;
        
        for (const entity of entities) {
            this.processEntity(entity, currentTime);
        }
    }
    
    /**
     * 处理单个实体
     */
    private processEntity(entity: Entity, currentTime: number): void {
        const velocity = entity.getComponent(Velocity);
        
        if (!velocity) return;
        
        // 检查是否需要改变方向
        const nextChangeTime = this.nextDirectionChangeTime.get(entity.id) || 0;
        
        if (currentTime >= nextChangeTime) {
            // 随机生成新的移动方向
            const angle = Math.random() * Math.PI * 2; // 0-360度
            const speed = 50 + Math.random() * 100; // 50-150的随机速度
            
            const newVelocityX = Math.cos(angle) * speed;
            const newVelocityY = Math.sin(angle) * speed;
            
            velocity.setVelocity(newVelocityX, newVelocityY);
            
            // 设置下次改变方向的时间（1-3秒后）
            const nextInterval = 1 + Math.random() * 2;
            this.nextDirectionChangeTime.set(entity.id, currentTime + nextInterval);
        }
    }
    
    /**
     * 当实体被添加到系统时
     */
    protected onAdded(entity: Entity): void {
        // 为新实体设置初始方向改变时间
        const initialDelay = Math.random() * 2; // 0-2秒的初始延迟
        this.nextDirectionChangeTime.set(entity.id, Time.totalTime + initialDelay);
    }
    
    /**
     * 当实体从系统中移除时
     */
    protected onRemoved(entity: Entity): void {
        // 清理实体的时间记录
        this.nextDirectionChangeTime.delete(entity.id);
    }
    
    /**
     * 系统初始化时调用
     */
    public initialize(): void {
        super.initialize();
        console.log('🎲 随机移动系统已启动');
    }
} 