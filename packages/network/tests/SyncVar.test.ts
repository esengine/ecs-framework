import { SyncVar, getSyncVarMetadata, SyncVarManager } from '../src/SyncVar';
import { createNetworkComponent } from '../src/SyncVar/SyncVarFactory';
import { createSyncVarProxy } from '../src/SyncVar/SyncVarProxy';
import { NetworkComponent } from '../src/NetworkComponent';

// 测试用的组件类
class TestPlayerComponent extends NetworkComponent {
    private _hasAuthority: boolean = false;
    
    public hasAuthority(): boolean {
        return this._hasAuthority;
    }
    
    public setAuthority(hasAuthority: boolean): void {
        this._hasAuthority = hasAuthority;
    }
    @SyncVar()
    public health: number = 100;
    
    @SyncVar({ hook: 'onNameChanged' })
    public playerName: string = 'Player';
    
    @SyncVar({ authorityOnly: true })
    public isReady: boolean = false;
    
    @SyncVar()
    public position = { x: 0, y: 0 };
    
    // Hook回调函数
    public onNameChangedCallCount = 0;
    public lastNameChange: { oldName: string; newName: string } | null = null;
    
    onNameChanged(oldName: string, newName: string) {
        this.onNameChangedCallCount++;
        this.lastNameChange = { oldName, newName };
        console.log(`Name changed: ${oldName} -> ${newName}`);
    }
}

class TestComponentWithoutSyncVar extends NetworkComponent {
    public normalField: number = 42;
    
    public hasAuthority(): boolean { return true; }
}

describe('SyncVar系统测试', () => {
    beforeEach(() => {
        // 清理SyncVar管理器
        const manager = SyncVarManager.Instance;
        manager['_componentChanges'].clear();
        manager['_lastSyncTimes'].clear();
    });
    
    describe('装饰器和元数据', () => {
        test('应该正确收集SyncVar元数据', () => {
            const metadata = getSyncVarMetadata(TestPlayerComponent);
            
            expect(metadata.length).toBe(4);
            
            const healthMeta = metadata.find(m => m.propertyKey === 'health');
            expect(healthMeta).toBeDefined();
            expect(healthMeta!.fieldNumber).toBe(1);
            expect(healthMeta!.options.hook).toBeUndefined();
            
            const nameMeta = metadata.find(m => m.propertyKey === 'playerName');
            expect(nameMeta).toBeDefined();
            expect(nameMeta!.options.hook).toBe('onNameChanged');
            
            const readyMeta = metadata.find(m => m.propertyKey === 'isReady');
            expect(readyMeta).toBeDefined();
            expect(readyMeta!.options.authorityOnly).toBe(true);
        });
        
        test('没有SyncVar的组件应该返回空元数据', () => {
            const metadata = getSyncVarMetadata(TestComponentWithoutSyncVar);
            expect(metadata.length).toBe(0);
        });
    });
    
    describe('代理和变化检测', () => {
        test('代理应该能检测到字段变化', () => {
            const instance = new TestPlayerComponent();
            const proxy = createSyncVarProxy(instance);
            
            // 修改SyncVar字段
            proxy.health = 80;
            
            const changes = proxy.getSyncVarChanges();
            expect(changes.length).toBe(1);
            expect(changes[0].propertyKey).toBe('health');
            expect(changes[0].oldValue).toBe(100);
            expect(changes[0].newValue).toBe(80);
        });
        
        test('非SyncVar字段不应该被记录', () => {
            class TestMixedComponent extends NetworkComponent {
                @SyncVar()
                public syncField: number = 1;
                
                public normalField: number = 2;
                
                public hasAuthority(): boolean { return true; }
            }
            
            const instance = new TestMixedComponent();
            const proxy = createSyncVarProxy(instance);
            
            // 修改SyncVar字段
            proxy.syncField = 10;
            // 修改普通字段
            proxy.normalField = 20;
            
            const changes = proxy.getSyncVarChanges();
            expect(changes.length).toBe(1);
            expect(changes[0].propertyKey).toBe('syncField');
        });
        
        test('Hook回调应该被触发', () => {
            const instance = new TestPlayerComponent();
            const proxy = createSyncVarProxy(instance);
            
            // 修改带hook的字段
            proxy.playerName = 'NewPlayer';
            
            expect(proxy.onNameChangedCallCount).toBe(1);
            expect(proxy.lastNameChange).toEqual({
                oldName: 'Player',
                newName: 'NewPlayer'
            });
        });
        
        test('相同值不应该触发变化记录', () => {
            const instance = new TestPlayerComponent();
            const proxy = createSyncVarProxy(instance);
            
            // 设置相同的值
            proxy.health = 100; // 原始值就是100
            
            const changes = proxy.getSyncVarChanges();
            expect(changes.length).toBe(0);
        });
    });
    
    describe('同步数据创建和应用', () => {
        test('应该能创建同步数据', () => {
            const instance = new TestPlayerComponent();
            const proxy = createSyncVarProxy(instance);
            
            // 修改多个字段
            proxy.health = 75;
            proxy.playerName = 'Hero';
            
            const syncData = proxy.createSyncVarData();
            expect(syncData).not.toBeNull();
            expect(syncData.componentType).toBe('TestPlayerComponent');
            expect(syncData.fieldUpdates.length).toBe(2);
        });
        
        test('没有变化时不应该创建同步数据', () => {
            const instance = new TestPlayerComponent();
            const proxy = createSyncVarProxy(instance);
            
            const syncData = proxy.createSyncVarData();
            expect(syncData).toBeNull();
        });
        
        test('应该能应用同步数据', () => {
            const sourceInstance = new TestPlayerComponent();
            const sourceProxy = createSyncVarProxy(sourceInstance);
            
            const targetInstance = new TestPlayerComponent();
            const targetProxy = createSyncVarProxy(targetInstance);
            
            // 修改源实例
            sourceProxy.health = 60;
            sourceProxy.playerName = 'Warrior';
            
            // 创建同步数据
            const syncData = sourceProxy.createSyncVarData();
            expect(syncData).not.toBeNull();
            
            // 应用到目标实例
            targetProxy.applySyncVarData(syncData);
            
            // 验证目标实例的值已更新
            expect(targetProxy.health).toBe(60);
            expect(targetProxy.playerName).toBe('Warrior');
            
            // 验证hook被触发
            expect(targetProxy.onNameChangedCallCount).toBe(1);
        });
    });
    
    describe('对象类型同步', () => {
        test('应该能同步对象类型', () => {
            const instance = new TestPlayerComponent();
            const proxy = createSyncVarProxy(instance);
            
            // 修改对象字段
            proxy.position = { x: 100, y: 200 };
            
            const changes = proxy.getSyncVarChanges();
            expect(changes.length).toBe(1);
            expect(changes[0].propertyKey).toBe('position');
            expect(changes[0].newValue).toEqual({ x: 100, y: 200 });
        });
        
        test('对象浅比较应该正确工作', () => {
            const instance = new TestPlayerComponent();
            const proxy = createSyncVarProxy(instance);
            
            // 设置相同的对象值
            proxy.position = { x: 0, y: 0 }; // 原始值
            
            const changes = proxy.getSyncVarChanges();
            expect(changes.length).toBe(0); // 应该没有变化
        });
    });
    
    describe('工厂函数', () => {
        test('createNetworkComponent应该为有SyncVar的组件创建代理', () => {
            const component = createNetworkComponent(TestPlayerComponent);
            
            expect(component.hasSyncVars()).toBe(true);
            
            // 测试代理功能
            component.health = 90;
            const changes = component.getSyncVarChanges();
            expect(changes.length).toBe(1);
        });
        
        test('createNetworkComponent应该为没有SyncVar的组件返回原实例', () => {
            const component = createNetworkComponent(TestComponentWithoutSyncVar);
            
            expect(component.hasSyncVars()).toBe(false);
            
            // 修改普通字段不应该有变化记录
            component.normalField = 999;
            const changes = component.getSyncVarChanges();
            expect(changes.length).toBe(0);
        });
    });
    
    describe('管理器统计', () => {
        test('应该能获取管理器统计信息', () => {
            const component1 = createNetworkComponent(TestPlayerComponent);
            const component2 = createNetworkComponent(TestPlayerComponent);
            
            component1.health = 80;
            component2.health = 70;
            component2.playerName = 'Test';
            
            const manager = SyncVarManager.Instance;
            const stats = manager.getStats();
            
            expect(stats.totalComponents).toBe(2);
            expect(stats.totalChanges).toBe(3); // 1 + 2 = 3
            expect(stats.pendingChanges).toBe(3);
        });
    });
});