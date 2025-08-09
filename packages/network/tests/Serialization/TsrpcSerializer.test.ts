import { Component } from '@esengine/ecs-framework';
import { TsrpcSerializer, SyncField } from '../../src/Serialization';
import { TsrpcSerializable } from '../../src/Serialization/TsrpcDecorators';

@TsrpcSerializable()
class TestComponent extends Component {
    @SyncField()
    public health: number = 100;
    
    @SyncField()
    public name: string = 'Test';
    
    @SyncField()
    public isActive: boolean = true;
}

describe('TsrpcSerializer', () => {
    let serializer: TsrpcSerializer;
    let testComponent: TestComponent;
    
    beforeEach(() => {
        serializer = TsrpcSerializer.getInstance();
        testComponent = new TestComponent();
        testComponent.health = 80;
        testComponent.name = 'Player';
        testComponent.isActive = false;
    });
    
    describe('序列化', () => {
        it('应该能序列化TSRPC组件', () => {
            const result = serializer.serialize(testComponent);
            
            expect(result).not.toBeNull();
            expect(result?.type).toBe('tsrpc');
            expect(result?.componentType).toBe('TestComponent');
            expect(result?.data).toBeInstanceOf(Uint8Array);
            expect(result?.size).toBeGreaterThan(0);
        });
        
        it('不支持的组件应该返回null', () => {
            // 创建一个没有装饰器的组件类
            class UnsupportedComponent extends Component {}
            const unsupportedComponent = new UnsupportedComponent();
            const result = serializer.serialize(unsupportedComponent);
            
            expect(result).toBeNull();
        });
    });
    
    describe('反序列化', () => {
        it('应该能反序列化TSRPC数据', () => {
            // 先序列化
            const serializedData = serializer.serialize(testComponent);
            expect(serializedData).not.toBeNull();
            
            // 再反序列化
            const deserializedComponent = serializer.deserialize(serializedData!, TestComponent);
            
            expect(deserializedComponent).not.toBeNull();
            expect(deserializedComponent?.health).toBe(80);
            expect(deserializedComponent?.name).toBe('Player');
            expect(deserializedComponent?.isActive).toBe(false);
        });
        
        it('错误的数据类型应该返回null', () => {
            const invalidData = {
                type: 'json' as const,
                componentType: 'TestComponent',
                data: {},
                size: 0
            };
            
            const result = serializer.deserialize(invalidData);
            expect(result).toBeNull();
        });
    });
    
    describe('统计信息', () => {
        it('应该正确更新统计信息', () => {
            const initialStats = serializer.getStats();
            
            // 执行序列化
            serializer.serialize(testComponent);
            
            const afterSerializeStats = serializer.getStats();
            expect(afterSerializeStats.serializeCount).toBe(initialStats.serializeCount + 1);
            
            // 执行反序列化
            const serializedData = serializer.serialize(testComponent);
            if (serializedData) {
                serializer.deserialize(serializedData, TestComponent);
            }
            
            const finalStats = serializer.getStats();
            expect(finalStats.deserializeCount).toBe(initialStats.deserializeCount + 1);
        });
    });
    
    describe('性能功能', () => {
        it('应该正确计算序列化大小', () => {
            const initialStats = serializer.getStats();
            
            // 执行序列化
            const result = serializer.serialize(testComponent);
            
            expect(result).not.toBeNull();
            expect(result?.size).toBeGreaterThan(0);
            
            const finalStats = serializer.getStats();
            expect(finalStats.averageSerializedSize).toBeGreaterThan(0);
        });
    });
});