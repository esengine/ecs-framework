import { SyncVarUpdateMessage, SyncVarFieldUpdate, MessageType } from '../src/Messaging/MessageTypes';
import { SyncVar, getSyncVarMetadata, SyncVarManager } from '../src/SyncVar';
import { createSyncVarProxy } from '../src/SyncVar/SyncVarProxy';
import { NetworkEnvironment, NetworkEnvironmentState } from '../src/Core/NetworkEnvironment';

// 模拟NetworkComponent基类
class MockNetworkComponent {
    private _hasAuthority: boolean = false;
    
    constructor() {}
    
    public isClient(): boolean { 
        return NetworkEnvironment.isClient; 
    }
    
    public isServer(): boolean { 
        return NetworkEnvironment.isServer; 
    }
    
    public getRole(): string { 
        return NetworkEnvironment.getPrimaryRole(); 
    }
    
    public hasAuthority(): boolean {
        return this._hasAuthority;
    }
    
    public setAuthority(hasAuthority: boolean): void {
        this._hasAuthority = hasAuthority;
    }
}

// 测试用的组件类
class TestPlayerComponent extends MockNetworkComponent {
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

describe('SyncVar消息系统测试', () => {
    let syncVarManager: SyncVarManager;
    
    beforeEach(() => {
        // 重置网络环境 - 先清除所有状态再设置服务端
        const env = NetworkEnvironment['Instance'];
        env['_state'] = NetworkEnvironmentState.None;
        env['_serverStartTime'] = 0;
        env['_clientConnectTime'] = 0;
        NetworkEnvironment.SetServerMode();
        
        // 获取SyncVar管理器实例
        syncVarManager = SyncVarManager.Instance;
        
        // 清理管理器状态
        syncVarManager['_componentChanges'].clear();
        syncVarManager['_lastSyncTimes'].clear();
    });
    
    describe('SyncVarUpdateMessage基础功能', () => {
        test('应该能正确创建SyncVarUpdateMessage', () => {
            const fieldUpdates: SyncVarFieldUpdate[] = [
                {
                    fieldNumber: 1,
                    propertyKey: 'health',
                    newValue: 80,
                    oldValue: 100,
                    timestamp: Date.now(),
                    authorityOnly: false
                }
            ];
            
            const message = new SyncVarUpdateMessage(
                'player_001',
                'TestPlayerComponent',
                fieldUpdates,
                false,
                'server_001',
                123
            );
            
            expect(message.messageType).toBe(MessageType.SYNC_VAR_UPDATE);
            expect(message.networkId).toBe('player_001');
            expect(message.componentType).toBe('TestPlayerComponent');
            expect(message.fieldUpdates.length).toBe(1);
            expect(message.isFullSync).toBe(false);
            expect(message.senderId).toBe('server_001');
            expect(message.syncSequence).toBe(123);
        });
        
        test('应该能添加和移除字段更新', () => {
            const message = new SyncVarUpdateMessage();
            
            expect(message.hasUpdates()).toBe(false);
            expect(message.getUpdateCount()).toBe(0);
            
            const fieldUpdate: SyncVarFieldUpdate = {
                fieldNumber: 1,
                propertyKey: 'health',
                newValue: 80,
                timestamp: Date.now()
            };
            
            message.addFieldUpdate(fieldUpdate);
            expect(message.hasUpdates()).toBe(true);
            expect(message.getUpdateCount()).toBe(1);
            
            const retrieved = message.getFieldUpdate(1);
            expect(retrieved).toBeDefined();
            expect(retrieved?.propertyKey).toBe('health');
            
            const removed = message.removeFieldUpdate(1);
            expect(removed).toBe(true);
            expect(message.hasUpdates()).toBe(false);
        });
        
        test('应该能序列化和反序列化消息', () => {
            const fieldUpdates: SyncVarFieldUpdate[] = [
                {
                    fieldNumber: 1,
                    propertyKey: 'health',
                    newValue: 75,
                    oldValue: 100,
                    timestamp: Date.now()
                },
                {
                    fieldNumber: 2,
                    propertyKey: 'playerName',
                    newValue: 'Hero',
                    oldValue: 'Player',
                    timestamp: Date.now()
                }
            ];
            
            const originalMessage = new SyncVarUpdateMessage(
                'player_001',
                'TestPlayerComponent',
                fieldUpdates,
                true,
                'server_001',
                456
            );
            
            // 序列化
            const serializedData = originalMessage.serialize();
            expect(serializedData.length).toBeGreaterThan(0);
            
            // 反序列化
            const deserializedMessage = new SyncVarUpdateMessage();
            deserializedMessage.deserialize(serializedData);
            
            // 验证反序列化结果
            expect(deserializedMessage.networkId).toBe(originalMessage.networkId);
            expect(deserializedMessage.componentType).toBe(originalMessage.componentType);
            expect(deserializedMessage.fieldUpdates.length).toBe(originalMessage.fieldUpdates.length);
            expect(deserializedMessage.isFullSync).toBe(originalMessage.isFullSync);
            expect(deserializedMessage.senderId).toBe(originalMessage.senderId);
            expect(deserializedMessage.syncSequence).toBe(originalMessage.syncSequence);
        });
        
        test('应该能获取消息统计信息', () => {
            const message = new SyncVarUpdateMessage();
            
            // 空消息统计
            let stats = message.getStats();
            expect(stats.updateCount).toBe(0);
            expect(stats.hasAuthorityOnlyFields).toBe(false);
            expect(stats.oldestUpdateTime).toBe(0);
            expect(stats.newestUpdateTime).toBe(0);
            
            // 添加字段更新
            const now = Date.now();
            message.addFieldUpdate({
                fieldNumber: 1,
                propertyKey: 'health',
                newValue: 80,
                timestamp: now - 1000
            });
            
            message.addFieldUpdate({
                fieldNumber: 2,
                propertyKey: 'isReady',
                newValue: true,
                timestamp: now,
                authorityOnly: true
            });
            
            stats = message.getStats();
            expect(stats.updateCount).toBe(2);
            expect(stats.hasAuthorityOnlyFields).toBe(true);
            expect(stats.oldestUpdateTime).toBe(now - 1000);
            expect(stats.newestUpdateTime).toBe(now);
        });
    });
    
    describe('SyncVarManager消息集成', () => {
        test('应该能从组件变化创建SyncVarUpdateMessage', () => {
            const component = new TestPlayerComponent();
            const proxy = createSyncVarProxy(component);
            
            // 初始化组件
            syncVarManager.initializeComponent(proxy);
            
            // 修改字段
            proxy.health = 75;
            proxy.playerName = 'Hero';
            
            // 创建消息
            const message = syncVarManager.createSyncVarUpdateMessage(
                proxy,
                'player_001',
                'server_001',
                100
            );
            
            expect(message).not.toBeNull();
            expect(message!.networkId).toBe('player_001');
            expect(message!.componentType).toBe('TestPlayerComponent');
            expect(message!.senderId).toBe('server_001');
            expect(message!.syncSequence).toBe(100);
            expect(message!.fieldUpdates.length).toBe(2);
            
            // 验证字段更新内容
            const healthUpdate = message!.fieldUpdates.find(u => u.propertyKey === 'health');
            expect(healthUpdate).toBeDefined();
            expect(healthUpdate!.newValue).toBe(75);
            expect(healthUpdate!.oldValue).toBe(100);
            
            const nameUpdate = message!.fieldUpdates.find(u => u.propertyKey === 'playerName');
            expect(nameUpdate).toBeDefined();
            expect(nameUpdate!.newValue).toBe('Hero');
            expect(nameUpdate!.oldValue).toBe('Player');
        });
        
        test('没有变化时应该返回null', () => {
            const component = new TestPlayerComponent();
            const proxy = createSyncVarProxy(component);
            
            syncVarManager.initializeComponent(proxy);
            
            // 没有修改任何字段
            const message = syncVarManager.createSyncVarUpdateMessage(proxy);
            
            expect(message).toBeNull();
        });
        
        test('应该能应用SyncVarUpdateMessage到组件', () => {
            const sourceComponent = new TestPlayerComponent();
            const sourceProxy = createSyncVarProxy(sourceComponent);
            
            const targetComponent = new TestPlayerComponent();
            const targetProxy = createSyncVarProxy(targetComponent);
            
            // 初始化组件
            syncVarManager.initializeComponent(sourceProxy);
            syncVarManager.initializeComponent(targetProxy);
            
            // 修改源组件
            sourceProxy.health = 60;
            sourceProxy.playerName = 'Warrior';
            
            // 创建消息
            const message = syncVarManager.createSyncVarUpdateMessage(
                sourceProxy,
                'player_001'
            );
            
            expect(message).not.toBeNull();
            
            // 应用到目标组件
            syncVarManager.applySyncVarUpdateMessage(targetProxy, message!);
            
            // 验证目标组件状态
            expect(targetProxy.health).toBe(60);
            expect(targetProxy.playerName).toBe('Warrior');
            
            // 验证hook被触发
            expect(targetProxy.onNameChangedCallCount).toBe(1);
            expect(targetProxy.lastNameChange).toEqual({
                oldName: 'Player',
                newName: 'Warrior'
            });
        });
        
        test('应该能批量创建多个组件的消息', () => {
            const component1 = createSyncVarProxy(new TestPlayerComponent());
            const component2 = createSyncVarProxy(new TestPlayerComponent());
            
            syncVarManager.initializeComponent(component1);
            syncVarManager.initializeComponent(component2);
            
            // 修改组件
            component1.health = 80;
            component2.playerName = 'Hero2';
            
            // 批量创建消息
            const messages = syncVarManager.createBatchSyncVarUpdateMessages(
                [component1, component2],
                ['player_001', 'player_002'],
                'server_001',
                200
            );
            
            expect(messages.length).toBe(2);
            
            expect(messages[0].networkId).toBe('player_001');
            expect(messages[0].syncSequence).toBe(200);
            
            expect(messages[1].networkId).toBe('player_002');
            expect(messages[1].syncSequence).toBe(201);
        });
        
        test('应该能过滤有变化的组件', () => {
            const component1 = createSyncVarProxy(new TestPlayerComponent());
            const component2 = createSyncVarProxy(new TestPlayerComponent());
            const component3 = createSyncVarProxy(new TestPlayerComponent());
            
            syncVarManager.initializeComponent(component1);
            syncVarManager.initializeComponent(component2);
            syncVarManager.initializeComponent(component3);
            
            // 只修改component1和component3
            component1.health = 80;
            component3.playerName = 'Hero3';
            // component2没有修改
            
            const componentsWithChanges = syncVarManager.filterComponentsWithChanges([
                component1, component2, component3
            ]);
            
            expect(componentsWithChanges.length).toBe(2);
            expect(componentsWithChanges).toContain(component1);
            expect(componentsWithChanges).toContain(component3);
            expect(componentsWithChanges).not.toContain(component2);
        });
        
        test('应该能获取组件变化统计', () => {
            const component = createSyncVarProxy(new TestPlayerComponent());
            syncVarManager.initializeComponent(component);
            
            // 修改多个字段
            component.health = 80;
            component.health = 70; // 再次修改同一字段
            component.playerName = 'Hero';
            
            const stats = syncVarManager.getComponentChangeStats(component);
            
            expect(stats.totalChanges).toBe(3);
            expect(stats.pendingChanges).toBe(3);
            expect(stats.lastChangeTime).toBeGreaterThan(0);
            expect(stats.fieldChangeCounts.get('health')).toBe(2);
            expect(stats.fieldChangeCounts.get('playerName')).toBe(1);
            expect(stats.hasAuthorityOnlyChanges).toBe(false);
        });
    });
    
    describe('权限和环境检查', () => {
        test('权威字段应该被正确处理', () => {
            // 重置环境为纯客户端模式
            const env = NetworkEnvironment['Instance'];
            env['_state'] = NetworkEnvironmentState.None;
            env['_serverStartTime'] = 0;
            env['_clientConnectTime'] = 0;
            NetworkEnvironment.SetClientMode(); // 切换到纯客户端模式
            
            const component = createSyncVarProxy(new TestPlayerComponent());
            // 明确设置没有权限
            component.setAuthority(false);
            
            syncVarManager.initializeComponent(component);
            
            console.log('当前环境:', NetworkEnvironment.isServer ? 'server' : 'client');
            console.log('isServer:', NetworkEnvironment.isServer);
            console.log('isClient:', NetworkEnvironment.isClient);
            console.log('组件权限:', component.hasAuthority());
            
            // 修改权威字段（客户端没有权限）
            component.isReady = true;
            
            // 检查待同步变化
            const pendingChanges = syncVarManager.getPendingChanges(component);
            console.log('待同步变化:', pendingChanges);
            
            const message = syncVarManager.createSyncVarUpdateMessage(component);
            console.log('创建的消息:', message);
            
            // 在客户端模式下，权威字段不应该被同步
            expect(message).toBeNull();
        });
        
        test('客户端应该能接受来自服务端的权威字段更新', () => {
            NetworkEnvironment.SetClientMode(); // 客户端模式
            
            const component = createSyncVarProxy(new TestPlayerComponent());
            syncVarManager.initializeComponent(component);
            
            const fieldUpdates: SyncVarFieldUpdate[] = [
                {
                    fieldNumber: 3, // isReady字段
                    propertyKey: 'isReady',
                    newValue: true,
                    oldValue: false,
                    timestamp: Date.now(),
                    authorityOnly: true
                }
            ];
            
            const message = new SyncVarUpdateMessage(
                'player_001',
                'TestPlayerComponent',
                fieldUpdates
            );
            
            // 记录初始值
            const initialValue = component.isReady;
            expect(initialValue).toBe(false);
            
            // 应用消息（客户端应该接受来自服务端的权威字段更新）
            syncVarManager.applySyncVarUpdateMessage(component, message);
            
            // 值应该改变
            expect(component.isReady).toBe(true);
        });
    });
    
    afterEach(() => {
        // 清理
        NetworkEnvironment.SetServerMode(); // 重置为服务器模式
    });
});