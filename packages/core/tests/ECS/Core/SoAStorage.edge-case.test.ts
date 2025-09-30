import { Component } from '../../../src/ECS/Component';
import { ComponentStorageManager } from '../../../src/ECS/Core/ComponentStorage';
import { EnableSoA } from '../../../src/ECS/Core/SoAStorage';

// 模拟复杂对象（如cocos的node节点）
class MockNode {
    public name: string;
    public active: boolean;
    
    constructor(name: string) {
        this.name = name;
        this.active = true;
    }
    
    public toString() {
        return `Node(${this.name})`;
    }
}

// 包含复杂属性的组件
@EnableSoA
class ProblematicComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    public node: MockNode | null = null;
    public callback: Function | null = null;
    public data: any = null;
    
    constructor() {
        super();
        this.node = new MockNode('test');
        this.callback = () => console.log('test');
        this.data = { complex: 'object' };
    }
}

// 安全的数值组件
@EnableSoA
class SafeComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    public active: boolean = true;
}

describe('SoA边界情况和复杂属性测试', () => {
    let manager: ComponentStorageManager;

    beforeEach(() => {
        manager = new ComponentStorageManager();
    });

    test('包含复杂对象的组件会有什么问题', () => {
        console.log('\\n=== 测试复杂对象处理 ===');
        
        // 创建包含复杂属性的组件
        const originalComponent = new ProblematicComponent();
        console.log('原始组件:', {
            x: originalComponent.x,
            y: originalComponent.y,
            node: originalComponent.node?.name,
            callback: typeof originalComponent.callback,
            data: originalComponent.data
        });
        
        // 添加到SoA存储
        manager.addComponent(1, originalComponent);
        
        // 获取组件看看发生了什么
        const retrievedComponent = manager.getComponent(1, ProblematicComponent);
        console.log('取回的组件:', {
            x: retrievedComponent?.x,
            y: retrievedComponent?.y,
            node: retrievedComponent?.node,
            callback: retrievedComponent?.callback,
            data: retrievedComponent?.data
        });
        
        // 验证数据完整性
        expect(retrievedComponent?.x).toBe(0);
        expect(retrievedComponent?.y).toBe(0);
        
        // 复杂对象的问题
        console.log('\\n⚠️ 问题发现:');
        console.log('- node对象:', retrievedComponent?.node);
        console.log('- callback函数:', retrievedComponent?.callback);
        console.log('- data对象:', retrievedComponent?.data);
        
        // 复杂属性现在应该正确保存
        expect(retrievedComponent?.node?.name).toBe('test'); // 应该保持原始值
        expect(retrievedComponent?.callback).toBe(originalComponent.callback); // 应该是同一个函数
        expect(retrievedComponent?.data).toEqual({ complex: 'object' }); // 应该保持原始数据
        
        console.log('✅ 修复成功：复杂对象现在能正确处理！');
    });

    test('纯数值组件工作正常', () => {
        console.log('\\n=== 测试纯数值组件 ===');
        
        const safeComponent = new SafeComponent();
        safeComponent.x = 100;
        safeComponent.y = 200;
        safeComponent.active = false;
        
        manager.addComponent(1, safeComponent);
        const retrieved = manager.getComponent(1, SafeComponent);
        
        console.log('纯数值组件正常工作:', {
            x: retrieved?.x,
            y: retrieved?.y,
            active: retrieved?.active
        });
        
        expect(retrieved?.x).toBe(100);
        expect(retrieved?.y).toBe(200);
        expect(retrieved?.active).toBe(false);
    });

    test('SoA是否能检测到不适合的组件类型', () => {
        console.log('\\n=== 测试类型检测 ===');
        
        // 当前实现会静默忽略复杂字段
        // 这是一个潜在的问题！
        const storage = manager.getStorage(ProblematicComponent);
        console.log('存储类型:', storage.constructor.name);
        
        // SoA存储应该能警告或拒绝不适合的组件
        expect(storage.constructor.name).toBe('SoAStorage');
    });
});