import { Component } from '@esengine/ecs-framework';

/**
 * 属性绑定组件
 * 记录节点属性到黑板变量的绑定关系
 */
export class PropertyBindings extends Component {
    /**
     * 属性绑定映射
     * key: 属性名称 (如 'message')
     * value: 黑板变量名 (如 'test1')
     */
    bindings: Map<string, string> = new Map();

    /**
     * 添加属性绑定
     */
    addBinding(propertyName: string, blackboardKey: string): void {
        this.bindings.set(propertyName, blackboardKey);
    }

    /**
     * 获取属性绑定的黑板变量名
     */
    getBinding(propertyName: string): string | undefined {
        return this.bindings.get(propertyName);
    }

    /**
     * 检查属性是否绑定到黑板变量
     */
    hasBinding(propertyName: string): boolean {
        return this.bindings.has(propertyName);
    }

    /**
     * 清除所有绑定
     */
    clearBindings(): void {
        this.bindings.clear();
    }
}
