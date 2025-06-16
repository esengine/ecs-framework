import { EntitySystem, Entity, Matcher, Time } from '@esengine/ecs-framework';
import { PositionComponent } from '../components/PositionComponent';
import { VelocityComponent } from '../components/VelocityComponent';

/**
 * 移动系统 - 处理实体的移动逻辑
 * 
 * EntitySystem示例：
 * 1. 使用Matcher指定需要的组件（Position + Velocity）
 * 2. 每帧更新所有移动实体的位置
 * 3. 展示组件间的协作
 */
export class MovementSystem extends EntitySystem {
    constructor() {
        // 只处理同时拥有PositionComponent和VelocityComponent的实体
        super(Matcher.empty().all(PositionComponent, VelocityComponent));
    }
    
    /**
     * 每帧执行：更新所有移动实体的位置
     */
    protected process(entities: Entity[]): void {
        for (const entity of entities) {
            const position = entity.getComponent(PositionComponent);
            const velocity = entity.getComponent(VelocityComponent);
            
            // 基本移动：位置 = 当前位置 + 速度 * 时间
            position.move(
                velocity.velocity.x * Time.deltaTime,
                velocity.velocity.y * Time.deltaTime,
                velocity.velocity.z * Time.deltaTime
            );
            
            // 应用阻尼（摩擦力）
            velocity.applyDamping(Time.deltaTime);
            
            // 可选：添加边界检查
            this.checkBoundaries(position, velocity);
        }
    }
    
    /**
     * 边界检查（可选功能）
     * 这个方法演示了如何在系统中实现额外的游戏逻辑
     */
    private checkBoundaries(position: PositionComponent, velocity: VelocityComponent) {
        const bounds = {
            left: -400,
            right: 400,
            top: 300,
            bottom: -300
        };
        
        // 检查X轴边界
        if (position.position.x < bounds.left) {
            position.position.x = bounds.left;
            velocity.velocity.x = Math.abs(velocity.velocity.x); // 反弹
        } else if (position.position.x > bounds.right) {
            position.position.x = bounds.right;
            velocity.velocity.x = -Math.abs(velocity.velocity.x); // 反弹
        }
        
        // 检查Y轴边界
        if (position.position.y < bounds.bottom) {
            position.position.y = bounds.bottom;
            velocity.velocity.y = Math.abs(velocity.velocity.y); // 反弹
        } else if (position.position.y > bounds.top) {
            position.position.y = bounds.top;
            velocity.velocity.y = -Math.abs(velocity.velocity.y); // 反弹
        }
    }
    
    /**
     * 系统初始化时调用
     * 可以在这里设置系统级别的配置
     */
    public initialize(): void {
        super.initialize();
        console.log("MovementSystem 已初始化 - 开始处理实体移动");
    }
    
    /**
     * 获取系统统计信息（用于调试）
     */
    public getStats(): { processedEntities: number; totalMovement: number } {
        let totalMovement = 0;
        const entities = this.entities;
        
        for (const entity of entities) {
            const position = entity.getComponent(PositionComponent);
            totalMovement += position.getMovementDistance();
        }
        
        return {
            processedEntities: entities.length,
            totalMovement: totalMovement
        };
    }
} 