import { NetworkIdentity, NetworkIdentityRegistry } from '../src/Core/NetworkIdentity';
import { SyncVar, SyncVarManager } from '../src/SyncVar';
import { createSyncVarProxy } from '../src/SyncVar/SyncVarProxy';
import { SyncVarSyncScheduler } from '../src/SyncVar/SyncVarSyncScheduler';
import { SyncVarOptimizer } from '../src/SyncVar/SyncVarOptimizer';
import { SyncVarUpdateMessage } from '../src/Messaging/MessageTypes';
import { NetworkComponent } from '../src/NetworkComponent';
import { NetworkEnvironment, NetworkEnvironmentState } from '../src/Core/NetworkEnvironment';

// 测试用网络组件
class TestGameObject extends NetworkComponent {
    @SyncVar()
    public health: number = 100;
    
    @SyncVar({ hook: 'onPositionChanged' })
    public position: { x: number; y: number } = { x: 0, y: 0 };
    
    @SyncVar({ authorityOnly: true })
    public serverFlag: boolean = false;
    
    @SyncVar()
    public playerName: string = 'TestPlayer';
    
    public positionChangeCount: number = 0;
    
    onPositionChanged(oldPos: any, newPos: any) {
        this.positionChangeCount++;
        console.log(`Position changed from ${JSON.stringify(oldPos)} to ${JSON.stringify(newPos)}`);
    }
}

describe('SyncVar端到端测试', () => {
    let gameObject1: TestGameObject;
    let gameObject2: TestGameObject;
    let identity1: NetworkIdentity;
    let identity2: NetworkIdentity;
    let syncVarManager: SyncVarManager;
    let syncScheduler: SyncVarSyncScheduler;
    let optimizer: SyncVarOptimizer;
    
    // 消息交换模拟
    let messageExchange: Map<string, SyncVarUpdateMessage[]> = new Map();
    
    beforeEach(async () => {
        // 重置环境
        const env = NetworkEnvironment['Instance'];
        env['_state'] = NetworkEnvironmentState.None;
        env['_serverStartTime'] = 0;
        env['_clientConnectTime'] = 0;
        NetworkEnvironment.SetServerMode();
        
        // 清理组件
        syncVarManager = SyncVarManager.Instance;
        syncVarManager['_componentChanges'].clear();
        syncVarManager['_lastSyncTimes'].clear();
        
        syncScheduler = SyncVarSyncScheduler.Instance;
        optimizer = new SyncVarOptimizer();
        messageExchange.clear();
        
        // 创建测试对象
        gameObject1 = createSyncVarProxy(new TestGameObject()) as TestGameObject;
        gameObject2 = createSyncVarProxy(new TestGameObject()) as TestGameObject;
        
        // 创建网络身份
        identity1 = new NetworkIdentity('player1', true);
        identity2 = new NetworkIdentity('player2', false);
        
        // 初始化SyncVar系统
        syncVarManager.initializeComponent(gameObject1);
        syncVarManager.initializeComponent(gameObject2);
        
        // 模拟消息发送回调
        syncScheduler.setMessageSendCallback(async (message: SyncVarUpdateMessage) => {
            // 将消息添加到交换队列
            const messages = messageExchange.get(message.networkId) || [];
            messages.push(message);
            messageExchange.set(message.networkId, messages);
            
            console.log(`[E2E] 模拟发送消息: ${message.networkId} -> ${message.fieldUpdates.length} 字段更新`);
        });
    });
    
    afterEach(async () => {
        // 清理
        identity1.cleanup();
        identity2.cleanup();
        NetworkIdentityRegistry.Instance.clear();
        syncScheduler.stop();
        optimizer.cleanup();
        // NetworkManager.Stop();
    });
    
    test('基本SyncVar同步流程', async () => {
        // 修改gameObject1的属性
        gameObject1.health = 80;
        gameObject1.playerName = 'Hero';
        gameObject1.position = { x: 10, y: 20 };
        
        // 检查是否有待同步的变化
        const changes = syncVarManager.getPendingChanges(gameObject1);
        expect(changes.length).toBe(3);
        
        // 创建同步消息
        const message = syncVarManager.createSyncVarUpdateMessage(
            gameObject1,
            identity1.networkId,
            'server',
            1
        );
        
        expect(message).not.toBeNull();
        expect(message!.fieldUpdates.length).toBe(3);
        expect(message!.networkId).toBe('player1');
        
        // 验证字段更新内容
        const healthUpdate = message!.fieldUpdates.find(u => u.propertyKey === 'health');
        expect(healthUpdate).toBeDefined();
        expect(healthUpdate!.newValue).toBe(80);
        expect(healthUpdate!.oldValue).toBe(100);
    });
    
    test('消息序列化和反序列化', async () => {
        // 修改属性
        gameObject1.health = 75;
        gameObject1.position = { x: 5, y: 15 };
        
        // 创建消息
        const originalMessage = syncVarManager.createSyncVarUpdateMessage(
            gameObject1,
            identity1.networkId
        );
        
        expect(originalMessage).not.toBeNull();
        
        // 序列化
        const serialized = originalMessage!.serialize();
        expect(serialized.length).toBeGreaterThan(0);
        
        // 反序列化
        const deserializedMessage = new SyncVarUpdateMessage();
        deserializedMessage.deserialize(serialized);
        
        // 验证反序列化结果
        expect(deserializedMessage.networkId).toBe(originalMessage!.networkId);
        expect(deserializedMessage.componentType).toBe(originalMessage!.componentType);
        expect(deserializedMessage.fieldUpdates.length).toBe(originalMessage!.fieldUpdates.length);
        
        // 验证字段内容
        for (let i = 0; i < originalMessage!.fieldUpdates.length; i++) {
            const original = originalMessage!.fieldUpdates[i];
            const deserialized = deserializedMessage.fieldUpdates[i];
            
            expect(deserialized.fieldNumber).toBe(original.fieldNumber);
            expect(deserialized.propertyKey).toBe(original.propertyKey);
            expect(deserialized.newValue).toEqual(original.newValue);
        }
    });
    
    test('SyncVar消息应用', async () => {
        // 在gameObject1上创建变化
        gameObject1.health = 60;
        gameObject1.playerName = 'Warrior';
        
        // 创建消息
        const message = syncVarManager.createSyncVarUpdateMessage(
            gameObject1,
            identity1.networkId
        );
        
        expect(message).not.toBeNull();
        
        // 清除gameObject1的变化记录
        syncVarManager.clearChanges(gameObject1);
        
        // 应用到gameObject2
        syncVarManager.applySyncVarUpdateMessage(gameObject2, message!);
        
        // 验证gameObject2的状态
        expect(gameObject2.health).toBe(60);
        expect(gameObject2.playerName).toBe('Warrior');
        
        // 验证Hook被触发
        expect(gameObject2.positionChangeCount).toBe(0); // position没有改变
    });
    
    test('Hook回调触发', async () => {
        // 修改position触发hook
        gameObject1.position = { x: 100, y: 200 };
        
        // 创建并应用消息
        const message = syncVarManager.createSyncVarUpdateMessage(
            gameObject1,
            identity1.networkId
        );
        
        expect(message).not.toBeNull();
        
        // 应用到gameObject2
        syncVarManager.applySyncVarUpdateMessage(gameObject2, message!);
        
        // 验证Hook被触发
        expect(gameObject2.positionChangeCount).toBe(1);
        expect(gameObject2.position).toEqual({ x: 100, y: 200 });
    });
    
    test('权威字段保护', async () => {
        // 切换到客户端环境
        const env = NetworkEnvironment['Instance'];
        env['_state'] = NetworkEnvironmentState.None;
        NetworkEnvironment.SetClientMode();
        
        // 客户端尝试修改权威字段
        gameObject1.serverFlag = true; // 这应该被阻止
        
        // 检查是否有待同步变化
        const changes = syncVarManager.getPendingChanges(gameObject1);
        expect(changes.length).toBe(0); // 应该没有变化被记录
        
        // 尝试创建消息
        const message = syncVarManager.createSyncVarUpdateMessage(
            gameObject1,
            identity1.networkId
        );
        
        expect(message).toBeNull(); // 应该没有消息
    });
    
    test('消息优化器功能', async () => {
        // 配置优化器
        optimizer.configure({
            enableMessageMerging: true,
            mergeTimeWindow: 50,
            enableRateLimit: true,
            maxMessagesPerSecond: 10
        });
        
        // 快速连续修改属性
        gameObject1.health = 90;
        gameObject1.health = 80;
        gameObject1.health = 70;
        
        const messages: SyncVarUpdateMessage[] = [];
        
        // 创建多个消息
        for (let i = 0; i < 3; i++) {
            const msg = syncVarManager.createSyncVarUpdateMessage(
                gameObject1,
                identity1.networkId,
                'server',
                i + 1
            );
            if (msg) {
                messages.push(msg);
            }
        }
        
        expect(messages.length).toBeGreaterThan(0);
        
        // 测试优化器处理
        let optimizedCount = 0;
        
        for (const message of messages) {
            optimizer.optimizeMessage(message, ['observer1'], (optimizedMessages, observers) => {
                optimizedCount++;
                expect(optimizedMessages.length).toBeGreaterThan(0);
                expect(observers.length).toBeGreaterThan(0);
            });
        }
        
        // 等待合并完成
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 强制刷新优化器
        optimizer.flush(() => {
            optimizedCount++;
        });
        
        expect(optimizedCount).toBeGreaterThan(0);
        
        // 检查统计信息
        const stats = optimizer.getStats();
        expect(stats.messagesProcessed).toBeGreaterThan(0);
    });
    
    test('网络对象身份管理', async () => {
        const registry = NetworkIdentityRegistry.Instance;
        
        // 验证对象已注册
        const foundIdentity1 = registry.find(identity1.networkId);
        const foundIdentity2 = registry.find(identity2.networkId);
        
        expect(foundIdentity1).toBeDefined();
        expect(foundIdentity2).toBeDefined();
        expect(foundIdentity1!.networkId).toBe('player1');
        expect(foundIdentity2!.networkId).toBe('player2');
        
        // 测试权威对象查询
        const authorityObjects = registry.getAuthorityObjects();
        expect(authorityObjects.length).toBe(1);
        expect(authorityObjects[0].networkId).toBe('player1');
        
        // 测试激活状态
        identity1.activate();
        identity2.activate();
        
        const activeObjects = registry.getActiveObjects();
        expect(activeObjects.length).toBe(2);
        
        // 测试统计信息
        const stats = registry.getStats();
        expect(stats.totalObjects).toBe(2);
        expect(stats.activeObjects).toBe(2);
        expect(stats.authorityObjects).toBe(1);
    });
    
    test('同步调度器集成测试', async () => {
        // 配置调度器
        syncScheduler.configure({
            syncInterval: 50,
            maxBatchSize: 5,
            enablePrioritySort: true
        });
        
        // 激活网络对象
        identity1.activate();
        identity2.activate();
        
        // 修改多个对象的属性
        gameObject1.health = 85;
        gameObject1.playerName = 'Hero1';
        
        gameObject2.health = 75;
        gameObject2.playerName = 'Hero2';
        
        // 启动调度器
        syncScheduler.start();
        
        // 等待调度器处理
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 检查消息交换
        const messages1 = messageExchange.get('player1') || [];
        const messages2 = messageExchange.get('player2') || [];
        
        console.log(`Player1 messages: ${messages1.length}, Player2 messages: ${messages2.length}`);
        
        // 停止调度器
        syncScheduler.stop();
        
        // 检查统计信息
        const schedulerStats = syncScheduler.getStats();
        expect(schedulerStats.totalSyncCycles).toBeGreaterThan(0);
    });
    
    test('完整的客户端-服务端模拟', async () => {
        // 服务端环境设置
        NetworkEnvironment.SetServerMode();
        const serverObject = createSyncVarProxy(new TestGameObject()) as TestGameObject;
        const serverIdentity = new NetworkIdentity('server_obj', true);
        serverIdentity.activate();
        
        syncVarManager.initializeComponent(serverObject);
        
        // 客户端环境设置
        const env = NetworkEnvironment['Instance'];
        env['_state'] = NetworkEnvironmentState.None;
        NetworkEnvironment.SetClientMode();
        
        const clientObject = createSyncVarProxy(new TestGameObject()) as TestGameObject;
        syncVarManager.initializeComponent(clientObject);
        
        // 服务端修改数据
        NetworkEnvironment.SetServerMode();
        serverObject.health = 50;
        serverObject.playerName = 'ServerPlayer';
        serverObject.position = { x: 30, y: 40 };
        
        // 创建服务端消息
        const serverMessage = syncVarManager.createSyncVarUpdateMessage(
            serverObject,
            serverIdentity.networkId,
            'server'
        );
        
        expect(serverMessage).not.toBeNull();
        
        // 切换到客户端接收消息
        NetworkEnvironment.SetClientMode();
        syncVarManager.applySyncVarUpdateMessage(clientObject, serverMessage!);
        
        // 验证客户端状态
        expect(clientObject.health).toBe(50);
        expect(clientObject.playerName).toBe('ServerPlayer');
        expect(clientObject.position).toEqual({ x: 30, y: 40 });
        expect(clientObject.positionChangeCount).toBe(1);
        
        console.log('[E2E] 客户端-服务端同步测试完成');
    });
});