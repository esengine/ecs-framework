import { NetworkManager } from '../src/Core/NetworkManager';
import { MessageHandler } from '../src/Messaging/MessageHandler';
import { JsonMessage } from '../src/Messaging/NetworkMessage';

// 测试消息
class TestMessage extends JsonMessage<{ text: string }> {
    public override readonly messageType: number = 1000;
    
    constructor(text: string = 'test') {
        super({ text });
    }
}

describe('网络核心功能测试', () => {
    let serverPort: number;
    
    beforeAll(() => {
        // 使用随机端口避免冲突
        serverPort = 8000 + Math.floor(Math.random() * 1000);
    });
    
    afterEach(async () => {
        // 每个测试后清理
        await NetworkManager.Stop();
        MessageHandler.Instance.clear();
    });
    
    describe('NetworkManager', () => {
        test('应该能启动和停止服务端', async () => {
            // 启动服务端
            const startResult = await NetworkManager.StartServer(serverPort);
            expect(startResult).toBe(true);
            expect(NetworkManager.isServer).toBe(true);
            expect(NetworkManager.connectionCount).toBe(0);
            
            // 停止服务端
            await NetworkManager.StopServer();
            expect(NetworkManager.isServer).toBe(false);
        }, 10000);
        
        test('应该能启动和停止客户端', async () => {
            // 先启动服务端
            await NetworkManager.StartServer(serverPort);
            
            // 启动客户端
            const connectResult = await NetworkManager.StartClient(`ws://localhost:${serverPort}`);
            expect(connectResult).toBe(true);
            expect(NetworkManager.isClient).toBe(true);
            
            // 等待连接建立
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 检查连接数
            expect(NetworkManager.connectionCount).toBe(1);
            
            // 停止客户端
            await NetworkManager.StopClient();
            expect(NetworkManager.isClient).toBe(false);
        }, 10000);
    });
    
    describe('消息系统', () => {
        test('应该能注册和处理消息', async () => {
            let receivedMessage: TestMessage | null = null;
            
            // 注册消息处理器
            MessageHandler.Instance.registerHandler(
                1000,
                TestMessage,
                {
                    handle: (message: TestMessage) => {
                        receivedMessage = message;
                    }
                }
            );
            
            // 创建测试消息
            const testMessage = new TestMessage('Hello World');
            
            // 序列化和反序列化测试
            const serialized = testMessage.serialize();
            expect(serialized.length).toBeGreaterThan(0);
            
            // 模拟消息处理
            await MessageHandler.Instance.handleRawMessage(serialized);
            
            // 验证消息被正确处理
            expect(receivedMessage).not.toBeNull();
            expect(receivedMessage!.payload!.text).toBe('Hello World');
        });
        
        test('应该能处理多个处理器', async () => {
            let handler1Called = false;
            let handler2Called = false;
            
            // 注册多个处理器
            MessageHandler.Instance.registerHandler(1000, TestMessage, {
                handle: () => { handler1Called = true; }
            }, 0);
            
            MessageHandler.Instance.registerHandler(1000, TestMessage, {
                handle: () => { handler2Called = true; }
            }, 1);
            
            // 发送消息
            const testMessage = new TestMessage('Test');
            await MessageHandler.Instance.handleMessage(testMessage);
            
            // 验证两个处理器都被调用
            expect(handler1Called).toBe(true);
            expect(handler2Called).toBe(true);
        });
    });
    
    describe('端到端通信', () => {
        test('客户端和服务端应该能相互通信', async () => {
            let serverReceivedMessage: TestMessage | null = null;
            let clientReceivedMessage: TestMessage | null = null;
            
            // 注册服务端消息处理器
            MessageHandler.Instance.registerHandler(1000, TestMessage, {
                handle: (message: TestMessage, connection) => {
                    serverReceivedMessage = message;
                    
                    // 服务端回复消息
                    if (connection && NetworkManager.server) {
                        const reply = new TestMessage('Server Reply');
                        const replyData = reply.serialize();
                        connection.send(replyData);
                    }
                }
            });
            
            // 启动服务端
            await NetworkManager.StartServer(serverPort);
            
            // 启动客户端
            await NetworkManager.StartClient(`ws://localhost:${serverPort}`);
            
            // 等待连接建立
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // 设置客户端消息处理
            if (NetworkManager.client) {
                NetworkManager.client.on('message', async (data) => {
                    const handled = await MessageHandler.Instance.handleRawMessage(data);
                    if (handled) {
                        // 从消息数据中重建消息
                        const message = new TestMessage();
                        message.deserialize(data);
                        clientReceivedMessage = message;
                    }
                });
            }
            
            // 客户端发送消息
            if (NetworkManager.client) {
                const clientMessage = new TestMessage('Client Hello');
                const messageData = clientMessage.serialize();
                NetworkManager.client.send(messageData);
            }
            
            // 等待消息传输
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // 验证通信成功
            expect(serverReceivedMessage).not.toBeNull();
            expect(serverReceivedMessage!.payload!.text).toBe('Client Hello');
            
            expect(clientReceivedMessage).not.toBeNull();
            expect(clientReceivedMessage!.payload!.text).toBe('Server Reply');
        }, 15000);
    });
});