import { Component } from '@esengine/ecs-framework';
import { Vec3 } from 'cc';

/**
 * 速度组件 - 存储实体的运动速度信息
 * 
 * 设计原则展示：
 * 1. 与PositionComponent分离：遵循单一职责原则
 * 2. 包含速度限制：避免无限加速
 * 3. 提供常用的速度操作方法
 */
export class VelocityComponent extends Component {
    /** 当前速度向量 */
    public velocity: Vec3 = new Vec3();
    /** 最大速度限制 */
    public maxSpeed: number = 100;
    /** 阻尼系数（0-1，1为无阻尼） */
    public damping: number = 1.0;
    
    constructor(x: number = 0, y: number = 0, z: number = 0, maxSpeed: number = 100) {
        super();
        this.velocity.set(x, y, z);
        this.maxSpeed = maxSpeed;
    }
    
    /**
     * 设置速度
     */
    setVelocity(x: number, y: number, z: number = 0) {
        this.velocity.set(x, y, z);
        this.clampToMaxSpeed();
    }
    
    /**
     * 添加速度（加速度效果）
     */
    addVelocity(x: number, y: number, z: number = 0) {
        this.velocity.x += x;
        this.velocity.y += y;
        this.velocity.z += z;
        this.clampToMaxSpeed();
    }
    
    /**
     * 应用阻尼
     */
    applyDamping(deltaTime: number) {
        if (this.damping < 1.0) {
            const dampingFactor = Math.pow(this.damping, deltaTime);
            this.velocity.multiplyScalar(dampingFactor);
        }
    }
    
    /**
     * 限制速度不超过最大值
     */
    private clampToMaxSpeed() {
        const speed = this.velocity.length();
        if (speed > this.maxSpeed) {
            this.velocity.normalize();
            this.velocity.multiplyScalar(this.maxSpeed);
        }
    }
    
    /**
     * 获取当前速度大小
     */
    getSpeed(): number {
        return this.velocity.length();
    }
    
    /**
     * 获取速度方向（单位向量）
     */
    getDirection(): Vec3 {
        const result = new Vec3();
        Vec3.normalize(result, this.velocity);
        return result;
    }
    
    /**
     * 停止移动
     */
    stop() {
        this.velocity.set(0, 0, 0);
    }
    
    /**
     * 检查是否在移动
     */
    isMoving(): boolean {
        return this.velocity.lengthSqr() > 0.01; // 避免浮点数精度问题
    }
} 