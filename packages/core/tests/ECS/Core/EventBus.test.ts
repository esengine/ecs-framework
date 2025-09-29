import { EventBus, GlobalEventBus } from '../../../src/ECS/Core/EventBus';
import { IEventListenerConfig, IEventStats } from '../../../src/Types';
import { ECSEventType, EventPriority } from '../../../src/ECS/CoreEvents';

// 测试数据接口
interface TestEventData {
    message: string;
    value: number;
}

interface MockEntityData {
    entityId: number;
    timestamp: number;
    eventId?: string;
    source?: string;
}

interface MockComponentData {
    entityId: number;
    componentType: string;
    timestamp: number;
    eventId?: string;
    source?: string;
}

describe('EventBus - 事件总线测试', () => {
    let eventBus: EventBus;

    beforeEach(() => {
        eventBus = new EventBus(false);
    });

    afterEach(() => {
        eventBus.clear();
    });

    describe('基本事件功能', () => {
        test('应该能够创建事件总线', () => {
            expect(eventBus).toBeInstanceOf(EventBus);
        });

        test('应该能够发射和监听同步事件', () => {
            let receivedData: TestEventData | null = null;
            
            const listenerId = eventBus.on<TestEventData>('test:event', (data) => {
                receivedData = data;
            });

            const testData: TestEventData = { message: 'hello', value: 42 };
            eventBus.emit('test:event', testData);

            expect(receivedData).not.toBeNull();
            expect(receivedData!.message).toBe('hello');
            expect(receivedData!.value).toBe(42);
            expect(typeof listenerId).toBe('string');
        });

        test('应该能够发射和监听异步事件', async () => {
            let receivedData: TestEventData | null = null;
            
            eventBus.onAsync<TestEventData>('async:event', async (data) => {
                receivedData = data;
            });

            const testData: TestEventData = { message: 'async hello', value: 100 };
            await eventBus.emitAsync('async:event', testData);

            expect(receivedData).not.toBeNull();
            expect(receivedData!.message).toBe('async hello');
            expect(receivedData!.value).toBe(100);
        });

        test('应该能够一次性监听事件', () => {
            let callCount = 0;
            
            eventBus.once<TestEventData>('once:event', () => {
                callCount++;
            });

            eventBus.emit('once:event', { message: 'first', value: 1 });
            eventBus.emit('once:event', { message: 'second', value: 2 });

            expect(callCount).toBe(1);
        });

        test('应该能够移除事件监听器', () => {
            let callCount = 0;
            
            const listenerId = eventBus.on<TestEventData>('removable:event', () => {
                callCount++;
            });

            eventBus.emit('removable:event', { message: 'test', value: 1 });
            expect(callCount).toBe(1);

            const removed = eventBus.off('removable:event', listenerId);
            expect(removed).toBe(true);

            eventBus.emit('removable:event', { message: 'test', value: 2 });
            expect(callCount).toBe(1); // 应该没有增加
        });

        test('应该能够移除所有事件监听器', () => {
            let callCount1 = 0;
            let callCount2 = 0;
            
            eventBus.on<TestEventData>('multi:event', () => { callCount1++; });
            eventBus.on<TestEventData>('multi:event', () => { callCount2++; });

            eventBus.emit('multi:event', { message: 'test', value: 1 });
            expect(callCount1).toBe(1);
            expect(callCount2).toBe(1);

            eventBus.offAll('multi:event');
            
            eventBus.emit('multi:event', { message: 'test', value: 2 });
            expect(callCount1).toBe(1);
            expect(callCount2).toBe(1);
        });
    });

    describe('事件配置和优先级', () => {
        test('应该能够使用事件监听器配置', () => {
            let receivedData: TestEventData | null = null;
            const config: IEventListenerConfig = {
                once: false,
                priority: EventPriority.HIGH,
                async: false
            };
            
            eventBus.on<TestEventData>('config:event', (data) => {
                receivedData = data;
            }, config);

            eventBus.emit('config:event', { message: 'configured', value: 99 });
            expect(receivedData).not.toBeNull();
            expect(receivedData!.message).toBe('configured');
        });

        test('应该能够检查事件是否有监听器', () => {
            expect(eventBus.hasListeners('nonexistent:event')).toBe(false);
            
            eventBus.on('existing:event', () => {});
            expect(eventBus.hasListeners('existing:event')).toBe(true);
        });

        test('应该能够获取监听器数量', () => {
            expect(eventBus.getListenerCount('count:event')).toBe(0);
            
            eventBus.on('count:event', () => {});
            eventBus.on('count:event', () => {});
            
            expect(eventBus.getListenerCount('count:event')).toBe(2);
        });
    });

    describe('系统配置和管理', () => {
        test('应该能够启用和禁用事件系统', () => {
            let callCount = 0;
            
            eventBus.on('disable:event', () => { callCount++; });
            
            eventBus.emit('disable:event', { message: 'enabled', value: 1 });
            expect(callCount).toBe(1);
            
            eventBus.setEnabled(false);
            eventBus.emit('disable:event', { message: 'disabled', value: 2 });
            expect(callCount).toBe(1); // 应该没有增加
            
            eventBus.setEnabled(true);
            eventBus.emit('disable:event', { message: 'enabled again', value: 3 });
            expect(callCount).toBe(2);
        });

        test('应该能够设置调试模式', () => {
            const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
            
            eventBus.setDebugMode(true);
            eventBus.on('debug:event', () => {});
            eventBus.emit('debug:event', { message: 'debug', value: 1 });
            
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        test('应该能够设置最大监听器数量', () => {
            expect(() => {
                eventBus.setMaxListeners(5);
            }).not.toThrow();
        });

        test('应该能够清空所有监听器', () => {
            eventBus.on('clear:event1', () => {});
            eventBus.on('clear:event2', () => {});
            
            expect(eventBus.hasListeners('clear:event1')).toBe(true);
            expect(eventBus.hasListeners('clear:event2')).toBe(true);
            
            eventBus.clear();
            
            expect(eventBus.hasListeners('clear:event1')).toBe(false);
            expect(eventBus.hasListeners('clear:event2')).toBe(false);
        });
    });

    describe('批处理功能', () => {
        test('应该能够设置批处理配置', () => {
            expect(() => {
                eventBus.setBatchConfig('batch:event', 5, 100);
            }).not.toThrow();
        });

        test('应该能够刷新批处理队列', () => {
            eventBus.setBatchConfig('flush:event', 10, 200);
            
            expect(() => {
                eventBus.flushBatch('flush:event');
            }).not.toThrow();
        });
    });

    describe('事件统计', () => {
        test('应该能够获取事件统计信息', () => {
            eventBus.on('stats:event', () => {});
            eventBus.emit('stats:event', { message: 'stat test', value: 1 });
            eventBus.emit('stats:event', { message: 'stat test', value: 2 });

            const stats = eventBus.getStats('stats:event') as IEventStats;
            
            expect(stats).toBeDefined();
            expect(stats.eventType).toBe('stats:event');
            expect(stats.triggerCount).toBe(2);
            expect(stats.listenerCount).toBe(1);
        });

        test('应该能够获取所有事件的统计信息', () => {
            eventBus.on('all-stats:event1', () => {});
            eventBus.on('all-stats:event2', () => {});
            eventBus.emit('all-stats:event1', { message: 'test1', value: 1 });
            eventBus.emit('all-stats:event2', { message: 'test2', value: 2 });

            const allStats = eventBus.getStats() as Map<string, IEventStats>;
            
            expect(allStats).toBeInstanceOf(Map);
            expect(allStats.size).toBeGreaterThan(0);
        });

        test('应该能够重置事件统计', () => {
            eventBus.on('reset:event', () => {});
            eventBus.emit('reset:event', { message: 'before reset', value: 1 });

            let stats = eventBus.getStats('reset:event') as IEventStats;
            expect(stats.triggerCount).toBe(1);

            eventBus.resetStats('reset:event');
            
            stats = eventBus.getStats('reset:event') as IEventStats;
            expect(stats.triggerCount).toBe(0);
        });
    });

    describe('预定义ECS事件', () => {
        test('应该能够发射和监听实体创建事件', () => {
            let receivedData: MockEntityData | null = null;
            
            eventBus.onEntityCreated((data) => {
                receivedData = data;
            });

            const entityData: MockEntityData = {
                entityId: 1,
                timestamp: Date.now()
            };

            eventBus.emit(ECSEventType.ENTITY_CREATED, entityData, true);

            expect(receivedData).not.toBeNull();
            expect(receivedData!.entityId).toBe(1);
            expect(receivedData!.timestamp).toBeDefined();
            expect(receivedData!.eventId).toBeDefined();
            expect(receivedData!.source).toBeDefined();
        });

        test('应该能够发射和监听组件添加事件', () => {
            let receivedData: MockComponentData | null = null;
            
            eventBus.onComponentAdded((data) => {
                receivedData = data;
            });

            const componentData: MockComponentData = {
                entityId: 1,
                componentType: 'PositionComponent',
                timestamp: Date.now()
            };

            eventBus.emitComponentAdded(componentData);

            expect(receivedData).not.toBeNull();
            expect(receivedData!.entityId).toBe(1);
            expect(receivedData!.componentType).toBe('PositionComponent');
        });

        test('应该能够监听系统错误事件', () => {
            let errorReceived = false;
            
            eventBus.onSystemError(() => {
                errorReceived = true;
            });

            eventBus.emit(ECSEventType.SYSTEM_ERROR, {
                systemName: 'TestSystem',
                error: 'Test error'
            });

            expect(errorReceived).toBe(true);
        });

        test('应该能够监听性能警告事件', () => {
            let warningReceived = false;
            
            eventBus.onPerformanceWarning(() => {
                warningReceived = true;
            });

            eventBus.emitPerformanceWarning({
                operation: 'frame_render',
                executionTime: 16.67,
                metadata: { fps: 30, threshold: 60, message: 'FPS dropped below threshold' },
                timestamp: Date.now()
            });

            expect(warningReceived).toBe(true);
        });

        test('应该能够发射其他预定义事件', () => {
            let entityDestroyedReceived = false;
            let componentRemovedReceived = false;
            let systemAddedReceived = false;
            let systemRemovedReceived = false;
            let sceneChangedReceived = false;

            eventBus.on(ECSEventType.ENTITY_DESTROYED, () => { entityDestroyedReceived = true; });
            eventBus.on(ECSEventType.COMPONENT_REMOVED, () => { componentRemovedReceived = true; });
            eventBus.on(ECSEventType.SYSTEM_ADDED, () => { systemAddedReceived = true; });
            eventBus.on(ECSEventType.SYSTEM_REMOVED, () => { systemRemovedReceived = true; });
            eventBus.on(ECSEventType.SCENE_ACTIVATED, () => { sceneChangedReceived = true; });

            eventBus.emitEntityDestroyed({ entityId: 1, timestamp: Date.now() });
            eventBus.emitComponentRemoved({ entityId: 1, componentType: 'Test', timestamp: Date.now() });
            eventBus.emitSystemAdded({ systemName: 'TestSystem', systemType: 'EntitySystem', timestamp: Date.now() });
            eventBus.emitSystemRemoved({ systemName: 'TestSystem', systemType: 'EntitySystem', timestamp: Date.now() });
            eventBus.emitSceneChanged({ sceneName: 'TestScene', timestamp: Date.now() });

            expect(entityDestroyedReceived).toBe(true);
            expect(componentRemovedReceived).toBe(true);
            expect(systemAddedReceived).toBe(true);
            expect(systemRemovedReceived).toBe(true);
            expect(sceneChangedReceived).toBe(true);
        });
    });

    describe('数据增强功能', () => {
        test('应该能够自动增强事件数据', () => {
            let receivedData: any = null;
            
            eventBus.on('enhanced:event', (data) => {
                receivedData = data;
            });

            const originalData = { message: 'test' };
            eventBus.emit('enhanced:event', originalData, true);

            expect(receivedData.message).toBe('test');
            expect(receivedData.timestamp).toBeDefined();
            expect(receivedData.eventId).toBeDefined();
            expect(receivedData.source).toBeDefined();
            expect(typeof receivedData.timestamp).toBe('number');
            expect(typeof receivedData.eventId).toBe('string');
            expect(receivedData.source).toBe('EventBus');
        });

        test('增强数据时不应该覆盖现有属性', () => {
            let receivedData: any = null;
            
            eventBus.on('no-override:event', (data) => {
                receivedData = data;
            });

            const originalData = { 
                message: 'test',
                timestamp: 12345,
                eventId: 'custom-id',
                source: 'CustomSource'
            };
            eventBus.emit('no-override:event', originalData);

            expect(receivedData.timestamp).toBe(12345);
            expect(receivedData.eventId).toBe('custom-id');
            expect(receivedData.source).toBe('CustomSource');
        });
    });

    describe('边界情况和错误处理', () => {
        test('移除不存在的监听器应该返回false', () => {
            const removed = eventBus.off('nonexistent:event', 'invalid-id');
            expect(removed).toBe(false);
        });

        test('获取不存在事件的监听器数量应该返回0', () => {
            const count = eventBus.getListenerCount('nonexistent:event');
            expect(count).toBe(0);
        });

        test('检查不存在事件的监听器应该返回false', () => {
            const hasListeners = eventBus.hasListeners('nonexistent:event');
            expect(hasListeners).toBe(false);
        });

        test('对不存在的事件类型执行操作应该安全', () => {
            expect(() => {
                eventBus.offAll('nonexistent:event');
                eventBus.resetStats('nonexistent:event');
                eventBus.flushBatch('nonexistent:event');
            }).not.toThrow();
        });

        test('传入空数据应该安全处理', () => {
            let receivedData: any = null;
            
            eventBus.on('null-data:event', (data) => {
                receivedData = data;
            });

            expect(() => {
                eventBus.emit('null-data:event', null);
                eventBus.emit('null-data:event', undefined);
                eventBus.emit('null-data:event', {});
            }).not.toThrow();
            
            expect(receivedData).toBeDefined();
        });
    });
});

describe('GlobalEventBus - 全局事件总线测试', () => {
    afterEach(() => {
        // 重置全局实例以避免测试间干扰
        GlobalEventBus.reset();
    });

    test('应该能够获取全局事件总线实例', () => {
        const instance1 = GlobalEventBus.getInstance();
        const instance2 = GlobalEventBus.getInstance();
        
        expect(instance1).toBeInstanceOf(EventBus);
        expect(instance1).toBe(instance2); // 应该是同一个实例
    });

    test('应该能够重置全局事件总线实例', () => {
        const instance1 = GlobalEventBus.getInstance();
        instance1.on('test:event', () => {});
        
        expect(instance1.hasListeners('test:event')).toBe(true);
        
        const instance2 = GlobalEventBus.reset();
        
        expect(instance2).toBeInstanceOf(EventBus);
        expect(instance2).not.toBe(instance1);
        expect(instance2.hasListeners('test:event')).toBe(false);
    });

    test('应该能够使用调试模式创建全局实例', () => {
        const instance = GlobalEventBus.getInstance(true);
        expect(instance).toBeInstanceOf(EventBus);
    });
});

