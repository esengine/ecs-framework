import 'reflect-metadata';
import { SyncVar } from '../src/SyncVar';
import { createSyncVarProxy } from '../src/SyncVar/SyncVarProxy';
import { NetworkComponent } from '../src/NetworkComponent';

// 简化的测试用网络组件
class SimpleTestComponent extends NetworkComponent {
    @SyncVar()
    public health: number = 100;
    
    @SyncVar()
    public name: string = 'TestPlayer';
}

describe('SyncVar端到端简单测试', () => {
    test('基本的SyncVar代理创建', () => {
        const component = new SimpleTestComponent();
        const proxiedComponent = createSyncVarProxy(component) as SimpleTestComponent;
        
        expect(proxiedComponent).toBeDefined();
        expect(proxiedComponent.health).toBe(100);
        expect(proxiedComponent.name).toBe('TestPlayer');
        
        // 修改值应该能正常工作
        proxiedComponent.health = 80;
        expect(proxiedComponent.health).toBe(80);
    });
    
    test('SyncVar变化记录', () => {
        const component = createSyncVarProxy(new SimpleTestComponent()) as SimpleTestComponent;
        
        // 修改值
        component.health = 75;
        component.name = 'Hero';
        
        // 检查是否有变化记录
        const changes = component.getSyncVarChanges();
        expect(changes.length).toBeGreaterThan(0);
    });
});