import { Component } from '@esengine/ecs-framework';
import { Vec2 } from 'cc';

/**
 * 玩家输入组件 - 存储玩家的输入状态
 * 
 * 标记组件示例：
 * 1. 标识这是一个玩家控制的实体
 * 2. 存储输入状态数据
 * 3. 输入处理逻辑在InputSystem中实现
 */
export class PlayerInputComponent extends Component {
    /** 移动输入方向（-1到1） */
    public moveDirection: Vec2 = new Vec2();
    /** 按键状态 */
    public keys: { [key: string]: boolean } = {};
    /** 鼠标位置 */
    public mousePosition: Vec2 = new Vec2();
    /** 鼠标按键状态 */
    public mouseButtons: { left: boolean; right: boolean; middle: boolean } = {
        left: false,
        right: false,
        middle: false
    };
    
    /** 是否启用输入 */
    public inputEnabled: boolean = true;
    /** 输入敏感度 */
    public sensitivity: number = 1.0;
    
    constructor() {
        super();
    }
    
    /**
     * 设置移动方向
     */
    setMoveDirection(x: number, y: number) {
        this.moveDirection.set(x, y);
        // 标准化方向向量（对角线移动不应该更快）
        if (this.moveDirection.lengthSqr() > 1) {
            this.moveDirection.normalize();
        }
    }
    
    /**
     * 设置按键状态
     */
    setKey(key: string, pressed: boolean) {
        this.keys[key] = pressed;
    }
    
    /**
     * 检查按键是否按下
     */
    isKeyPressed(key: string): boolean {
        return this.keys[key] || false;
    }
    
    /**
     * 检查是否有移动输入
     */
    hasMovementInput(): boolean {
        return this.moveDirection.lengthSqr() > 0.01;
    }
    
    /**
     * 获取标准化的移动方向
     */
    getNormalizedMoveDirection(): Vec2 {
        const result = new Vec2(this.moveDirection);
        if (result.lengthSqr() > 0) {
            result.normalize();
        }
        return result;
    }
    
    /**
     * 设置鼠标位置
     */
    setMousePosition(x: number, y: number) {
        this.mousePosition.set(x, y);
    }
    
    /**
     * 设置鼠标按键状态
     */
    setMouseButton(button: 'left' | 'right' | 'middle', pressed: boolean) {
        this.mouseButtons[button] = pressed;
    }
    
    /**
     * 检查鼠标按键是否按下
     */
    isMouseButtonPressed(button: 'left' | 'right' | 'middle'): boolean {
        return this.mouseButtons[button];
    }
    
    /**
     * 清除所有输入状态
     */
    clearInput() {
        this.moveDirection.set(0, 0);
        this.keys = {};
        this.mouseButtons.left = false;
        this.mouseButtons.right = false;
        this.mouseButtons.middle = false;
    }
    
    /**
     * 禁用输入
     */
    disableInput() {
        this.inputEnabled = false;
        this.clearInput();
    }
    
    /**
     * 启用输入
     */
    enableInput() {
        this.inputEnabled = true;
    }
} 