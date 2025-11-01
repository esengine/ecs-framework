import { Component } from '../../Component';

/**
 * 组件构建器 - 提供流式API创建组件
 */
export class ComponentBuilder<T extends Component> {
    private component: T;

    constructor(componentClass: new (...args: unknown[]) => T, ...args: unknown[]) {
        this.component = new componentClass(...args);
    }

    /**
     * 设置组件属性
     * @param property 属性名
     * @param value 属性值
     * @returns 组件构建器
     */
    public set<K extends keyof T>(property: K, value: T[K]): ComponentBuilder<T> {
        this.component[property] = value;
        return this;
    }

    /**
     * 使用配置函数设置组件
     * @param configurator 配置函数
     * @returns 组件构建器
     */
    public configure(configurator: (component: T) => void): ComponentBuilder<T> {
        configurator(this.component);
        return this;
    }

    /**
     * 条件性设置属性
     * @param condition 条件
     * @param property 属性名
     * @param value 属性值
     * @returns 组件构建器
     */
    public setIf<K extends keyof T>(condition: boolean, property: K, value: T[K]): ComponentBuilder<T> {
        if (condition) {
            this.component[property] = value;
        }
        return this;
    }

    /**
     * 构建并返回组件
     * @returns 构建的组件
     */
    public build(): T {
        return this.component;
    }
}
