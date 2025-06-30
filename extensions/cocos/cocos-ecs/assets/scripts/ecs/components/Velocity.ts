import { Component } from '@esengine/ecs-framework';
import { Vec3 } from 'cc';

/**
 * 速度组件
 * 存储实体的移动速度和方向
 */
export class Velocity extends Component {
    /** 速度向量 */
    public velocity: Vec3 = new Vec3(0, 0, 0);
    
    /** 最大速度 */
    public maxSpeed: number = 200;
    
    /** 摩擦力 (0-1, 1表示无摩擦) */
    public friction: number = 0.98;
    
    constructor() {
        super();
    }
    
    /**
     * 设置速度
     */
    public setVelocity(x: number, y: number, z: number = 0): void {
        this.velocity.set(x, y, z);
        this.clampToMaxSpeed();
    }
    
    /**
     * 添加速度
     */
    public addVelocity(x: number, y: number, z: number = 0): void {
        this.velocity.x += x;
        this.velocity.y += y;
        this.velocity.z += z;
        this.clampToMaxSpeed();
    }
    
    /**
     * 应用摩擦力
     */
    public applyFriction(): void {
        this.velocity.multiplyScalar(this.friction);
        
        // 当速度很小时直接设为0，避免无限减小
        if (this.velocity.length() < 0.1) {
            this.velocity.set(0, 0, 0);
        }
    }
    
    /**
     * 限制到最大速度
     */
    private clampToMaxSpeed(): void {
        const currentSpeed = this.velocity.length();
        if (currentSpeed > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
    }
    
    /**
     * 获取当前速度大小
     */
    public getSpeed(): number {
        return this.velocity.length();
    }
    
    /**
     * 重置组件
     */
    public reset(): void {
        this.velocity.set(0, 0, 0);
        this.maxSpeed = 200;
        this.friction = 0.98;
    }
} 