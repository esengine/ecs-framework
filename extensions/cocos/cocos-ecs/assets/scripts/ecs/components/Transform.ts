import { Component } from '@esengine/ecs-framework';
import { Vec3 } from 'cc';

/**
 * 变换组件
 * 存储实体的位置、旋转和缩放信息
 */
export class Transform extends Component {
    /** 位置 */
    public position: Vec3 = new Vec3(0, 0, 0);
    
    /** 旋转 (度数) */
    public rotation: Vec3 = new Vec3(0, 0, 0);
    
    /** 缩放 */
    public scale: Vec3 = new Vec3(1, 1, 1);
    
    /** 移动速度 */
    public speed: number = 100;
    
    constructor() {
        super();
    }
    
    /**
     * 设置位置
     */
    public setPosition(x: number, y: number, z: number = 0): void {
        this.position.set(x, y, z);
    }
    
    /**
     * 移动
     */
    public move(deltaX: number, deltaY: number, deltaZ: number = 0): void {
        this.position.x += deltaX;
        this.position.y += deltaY;
        this.position.z += deltaZ;
    }
    
    /**
     * 重置组件
     */
    public reset(): void {
        this.position.set(0, 0, 0);
        this.rotation.set(0, 0, 0);
        this.scale.set(1, 1, 1);
        this.speed = 100;
    }
} 