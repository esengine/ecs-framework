import { Component } from '@esengine/ecs-framework';
import { Color } from 'cc';

/**
 * 渲染组件
 * 存储实体的渲染相关信息
 */
export class Renderer extends Component {
    /** 颜色 */
    public color: Color = new Color(255, 255, 255, 255);
    
    /** 是否可见 */
    public visible: boolean = true;
    
    /** 渲染层级 */
    public layer: number = 0;
    
    /** 精灵名称或纹理路径 */
    public spriteName: string = '';
    
    /** 大小 */
    public size: { width: number, height: number } = { width: 32, height: 32 };
    
    /** 透明度 (0-1) */
    public alpha: number = 1.0;
    
    constructor(spriteName: string = '', color?: Color) {
        super();
        this.spriteName = spriteName;
        if (color) {
            this.color = color;
        }
    }
    
    /**
     * 设置颜色
     */
    public setColor(r: number, g: number, b: number, a: number = 255): void {
        this.color.set(r, g, b, a);
    }
    
    /**
     * 设置透明度
     */
    public setAlpha(alpha: number): void {
        this.alpha = Math.max(0, Math.min(1, alpha));
        this.color.a = Math.floor(this.alpha * 255);
    }
    
    /**
     * 设置大小
     */
    public setSize(width: number, height: number): void {
        this.size.width = width;
        this.size.height = height;
    }
    
    /**
     * 显示/隐藏
     */
    public setVisible(visible: boolean): void {
        this.visible = visible;
    }
    
    /**
     * 重置组件
     */
    public reset(): void {
        this.color.set(255, 255, 255, 255);
        this.visible = true;
        this.layer = 0;
        this.spriteName = '';
        this.size = { width: 32, height: 32 };
        this.alpha = 1.0;
    }
} 