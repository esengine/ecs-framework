import { Component } from '@esengine/ecs-framework';
import { Vec3 } from 'cc';

/**
 * 位置组件 - 存储实体的空间位置信息
 * 
 * 这是最基础的组件示例，展示了ECS组件的设计原则：
 * 1. 主要存储数据，少量辅助方法
 * 2. 单一职责：只负责位置相关的数据
 * 3. 可复用：任何需要位置信息的实体都可以使用
 */
export class PositionComponent extends Component {
    /** 3D位置坐标 */
    public position: Vec3 = new Vec3();
    /** 上一帧的位置（用于计算移动距离） */
    public lastPosition: Vec3 = new Vec3();
    
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.position.set(x, y, z);
        this.lastPosition.set(x, y, z);
    }
    
    /**
     * 设置位置
     */
    setPosition(x: number, y: number, z: number = 0) {
        this.lastPosition.set(this.position);
        this.position.set(x, y, z);
    }
    
    /**
     * 移动位置
     */
    move(deltaX: number, deltaY: number, deltaZ: number = 0) {
        this.lastPosition.set(this.position);
        this.position.x += deltaX;
        this.position.y += deltaY;
        this.position.z += deltaZ;
    }
    
    /**
     * 计算到另一个位置的距离
     */
    distanceTo(other: PositionComponent): number {
        return Vec3.distance(this.position, other.position);
    }
    
    /**
     * 获取本帧移动的距离
     */
    getMovementDistance(): number {
        return Vec3.distance(this.position, this.lastPosition);
    }
    
    /**
     * 检查是否在指定范围内
     */
    isWithinRange(target: PositionComponent, range: number): boolean {
        return this.distanceTo(target) <= range;
    }
} 