import { Component } from '../../../src/ECS/Component';
import { ComponentStorageManager } from '../../../src/ECS/Core/ComponentStorage';
import { EnableSoA } from '../../../src/ECS/Core/SoAStorage';

// 默认原始存储组件
class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    public z: number = 0;
}

// 启用SoA优化的组件（用于大规模批量操作）
@EnableSoA
class LargeScaleComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    public z: number = 0;
    public vx: number = 0;
    public vy: number = 0;
    public vz: number = 0;
}

describe('SoA优化选择测试', () => {
    let manager: ComponentStorageManager;

    beforeEach(() => {
        manager = new ComponentStorageManager();
    });

    test('默认使用原始存储', () => {
        const storage = manager.getStorage(PositionComponent);
        
        // 添加组件
        manager.addComponent(1, new PositionComponent());
        
        // 验证能正常工作
        const component = manager.getComponent(1, PositionComponent);
        expect(component).toBeTruthy();
        expect(component?.x).toBe(0);
        
        // 验证使用原始存储
        expect(storage.constructor.name).toBe('ComponentStorage');
    });

    test('@EnableSoA装饰器启用优化', () => {
        const storage = manager.getStorage(LargeScaleComponent);
        
        // 添加组件
        const component = new LargeScaleComponent();
        component.x = 100;
        component.vx = 10;
        manager.addComponent(1, component);
        
        // 验证能正常工作
        const retrieved = manager.getComponent(1, LargeScaleComponent);
        expect(retrieved).toBeTruthy();
        expect(retrieved?.x).toBe(100);
        expect(retrieved?.vx).toBe(10);
        
        // 验证使用SoA存储
        expect(storage.constructor.name).toBe('SoAStorage');
    });

    test('SoA存储功能验证', () => {
        const entityCount = 1000;
        
        // 创建实体（使用SoA优化）
        for (let i = 0; i < entityCount; i++) {
            const component = new LargeScaleComponent();
            component.x = i;
            component.y = i * 2;
            component.vx = 1;
            component.vy = 2;
            manager.addComponent(i, component);
        }
        
        // 验证数据正确性
        const testComponent = manager.getComponent(100, LargeScaleComponent);
        expect(testComponent?.x).toBe(100);
        expect(testComponent?.y).toBe(200);
        expect(testComponent?.vx).toBe(1);
        expect(testComponent?.vy).toBe(2);
        
        // 验证存储类型
        const storage = manager.getStorage(LargeScaleComponent);
        expect(storage.constructor.name).toBe('SoAStorage');
        console.log(`成功创建 ${entityCount} 个SoA实体，数据验证通过`);
    });
});