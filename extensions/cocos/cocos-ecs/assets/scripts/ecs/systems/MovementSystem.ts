import { EntitySystem, Entity, Matcher, Time } from '@esengine/ecs-framework';
import { Transform, Velocity } from '../components';

/**
 * 移动系统
 * 处理具有Transform和Velocity组件的实体移动
 */
export class MovementSystem extends EntitySystem {
    
    constructor() {
        // 使用Matcher设置系统处理的组件类型
        super(Matcher.empty().all(Transform, Velocity));
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
        const transform = entity.getComponent(Transform);
        const velocity = entity.getComponent(Velocity);
        
        if (!transform || !velocity) return;
        
        // 应用摩擦力
        velocity.applyFriction();
        
        // 根据速度更新位置
        const deltaX = velocity.velocity.x * deltaTime;
        const deltaY = velocity.velocity.y * deltaTime;
        const deltaZ = velocity.velocity.z * deltaTime;
        
        transform.move(deltaX, deltaY, deltaZ);
        
        // 简单的边界检查 (假设游戏世界是 -500 到 500)
        const bounds = 500;
        if (transform.position.x > bounds) {
            transform.position.x = bounds;
            velocity.velocity.x = -Math.abs(velocity.velocity.x) * 0.5; // 反弹并减速
        } else if (transform.position.x < -bounds) {
            transform.position.x = -bounds;
            velocity.velocity.x = Math.abs(velocity.velocity.x) * 0.5;
        }
        
        if (transform.position.y > bounds) {
            transform.position.y = bounds;
            velocity.velocity.y = -Math.abs(velocity.velocity.y) * 0.5;
        } else if (transform.position.y < -bounds) {
            transform.position.y = -bounds;
            velocity.velocity.y = Math.abs(velocity.velocity.y) * 0.5;
        }
    }
    
    /**
     * 系统初始化时调用
     */
    public initialize(): void {
        super.initialize();
        console.log('🏃 移动系统已启动');
    }
} 