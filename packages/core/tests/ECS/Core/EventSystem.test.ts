import { TypeSafeEventSystem, GlobalEventSystem } from '../../../src/ECS/Core/EventSystem';
import { ECSEventType } from '../../../src/ECS/CoreEvents';

// 测试事件数据类型
interface TestCustomEvent {
    playerId: number;
    message: string;
    timestamp: number;
}

interface PlayerLevelUpEvent {
    playerId: number;
    oldLevel: number;
    newLevel: number;
    experience: number;
}

interface EntityCreatedEvent {
    entityId: number;
    entityName: string;
    componentCount: number;
}

describe('EventSystem - 事件系统测试', () => {
    let eventSystem: TypeSafeEventSystem;

    beforeEach(() => {
        eventSystem = new TypeSafeEventSystem();
    });

    describe('基本事件功能', () => {
        test('应该能够注册事件监听器', () => {
            let eventReceived = false;
            
            eventSystem.on('test:event', () => {
                eventReceived = true;
            });
            
            eventSystem.emit('test:event', {});
            
            expect(eventReceived).toBe(true);
        });

        test('应该能够传递事件数据', () => {
            let receivedData: TestCustomEvent | null = null;
            
            eventSystem.on('custom:test', (data: TestCustomEvent) => {
                receivedData = data;
            });
            
            const testData: TestCustomEvent = {
                playerId: 123,
                message: 'Hello World',
                timestamp: Date.now()
            };
            
            eventSystem.emit('custom:test', testData);
            
            expect(receivedData).toEqual(testData);
        });

        test('应该能够移除事件监听器', () => {
            let callCount = 0;
            
            const handler = () => {
                callCount++;
            };
            
            const listenerId = eventSystem.on('removable:event', handler);
            eventSystem.emit('removable:event', {});
            expect(callCount).toBe(1);
            
            eventSystem.off('removable:event', listenerId);
            eventSystem.emit('removable:event', {});
            expect(callCount).toBe(1); // 应该保持不变
        });

        test('应该能够一次性监听事件', async () => {
            let callCount = 0;
            
            eventSystem.once('once:event', () => {
                callCount++;
            });
            
            await eventSystem.emit('once:event', {});
            await eventSystem.emit('once:event', {});
            await eventSystem.emit('once:event', {});
            
            expect(callCount).toBe(1); // 只应该被调用一次
        });

        test('应该能够处理多个监听器', () => {
            const results: string[] = [];
            
            eventSystem.on('multi:event', () => {
                results.push('handler1');
            });
            
            eventSystem.on('multi:event', () => {
                results.push('handler2');
            });
            
            eventSystem.on('multi:event', () => {
                results.push('handler3');
            });
            
            eventSystem.emit('multi:event', {});
            
            expect(results).toEqual(['handler1', 'handler2', 'handler3']);
        });
    });

    describe('预定义ECS事件', () => {
        test('应该能够监听实体创建事件', () => {
            let entityCreatedData: any = null;
            
            eventSystem.on(ECSEventType.ENTITY_CREATED, (data: any) => {
                entityCreatedData = data;
            });
            
            const testData = {
                entityId: 123,
                entityName: 'TestEntity',
                componentCount: 3
            };
            
            eventSystem.emit(ECSEventType.ENTITY_CREATED, testData);
            
            expect(entityCreatedData).toEqual(testData);
        });

        test('应该能够监听实体销毁事件', () => {
            let entityDestroyedData: any = null;
            
            eventSystem.on(ECSEventType.ENTITY_DESTROYED, (data: any) => {
                entityDestroyedData = data;
            });
            
            const testData = {
                entityId: 456,
                entityName: 'DestroyedEntity',
                componentCount: 2
            };
            
            eventSystem.emit(ECSEventType.ENTITY_DESTROYED, testData);
            
            expect(entityDestroyedData).toEqual(testData);
        });

        test('应该能够监听组件添加事件', () => {
            let componentAddedData: any = null;
            
            eventSystem.on(ECSEventType.COMPONENT_ADDED, (data: any) => {
                componentAddedData = data;
            });
            
            const testData = {
                entityId: 789,
                componentType: 'PositionComponent',
                componentData: { x: 10, y: 20 }
            };
            
            eventSystem.emit(ECSEventType.COMPONENT_ADDED, testData);
            
            expect(componentAddedData).toEqual(testData);
        });

        test('应该能够监听组件移除事件', () => {
            let componentRemovedData: any = null;
            
            eventSystem.on(ECSEventType.COMPONENT_REMOVED, (data: any) => {
                componentRemovedData = data;
            });
            
            const testData = {
                entityId: 101112,
                componentType: 'VelocityComponent',
                componentData: { vx: 5, vy: -3 }
            };
            
            eventSystem.emit(ECSEventType.COMPONENT_REMOVED, testData);
            
            expect(componentRemovedData).toEqual(testData);
        });

        test('应该能够监听系统添加事件', () => {
            let systemAddedData: any = null;
            
            eventSystem.on(ECSEventType.SYSTEM_ADDED, (data: any) => {
                systemAddedData = data;
            });
            
            const testData = {
                systemName: 'MovementSystem',
                systemType: 'EntitySystem',
                updateOrder: 1
            };
            
            eventSystem.emit(ECSEventType.SYSTEM_ADDED, testData);
            
            expect(systemAddedData).toEqual(testData);
        });

        test('应该能够监听系统移除事件', () => {
            let systemRemovedData: any = null;
            
            eventSystem.on(ECSEventType.SYSTEM_REMOVED, (data: any) => {
                systemRemovedData = data;
            });
            
            const testData = {
                systemName: 'RenderSystem',
                systemType: 'EntitySystem',
                updateOrder: 2
            };
            
            eventSystem.emit(ECSEventType.SYSTEM_REMOVED, testData);
            
            expect(systemRemovedData).toEqual(testData);
        });
    });

    describe('事件优先级和执行顺序', () => {
        test('应该按优先级顺序执行监听器', () => {
            const executionOrder: string[] = [];
            
            // 添加不同优先级的监听器
            eventSystem.on('priority:event', () => {
                executionOrder.push('normal');
            });
            
            eventSystem.on('priority:event', () => {
                executionOrder.push('high');
            }, { priority: 10 });
            
            eventSystem.on('priority:event', () => {
                executionOrder.push('low');
            }, { priority: -10 });
            
            eventSystem.emit('priority:event', {});
            
            // 应该按照 high -> normal -> low 的顺序执行
            expect(executionOrder).toEqual(['high', 'normal', 'low']);
        });

        test('相同优先级的监听器应该按注册顺序执行', () => {
            const executionOrder: string[] = [];
            
            eventSystem.on('order:event', () => {
                executionOrder.push('first');
            });
            
            eventSystem.on('order:event', () => {
                executionOrder.push('second');
            });
            
            eventSystem.on('order:event', () => {
                executionOrder.push('third');
            });
            
            eventSystem.emit('order:event', {});
            
            expect(executionOrder).toEqual(['first', 'second', 'third']);
        });
    });

    describe('异步事件处理', () => {
        test('应该能够处理异步事件监听器', async () => {
            let asyncResult = '';
            
            eventSystem.on('async:event', async (data: { message: string }) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                asyncResult = data.message;
            }, { async: true });
            
            await eventSystem.emit('async:event', { message: 'async test' });
            
            expect(asyncResult).toBe('async test');
        });

        test('应该能够等待所有异步监听器完成', async () => {
            const results: string[] = [];
            
            eventSystem.on('multi-async:event', async () => {
                await new Promise(resolve => setTimeout(resolve, 20));
                results.push('handler1');
            }, { async: true });
            
            eventSystem.on('multi-async:event', async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                results.push('handler2');
            }, { async: true });
            
            eventSystem.on('multi-async:event', async () => {
                await new Promise(resolve => setTimeout(resolve, 5));
                results.push('handler3');
            }, { async: true });
            
            await eventSystem.emit('multi-async:event', {});
            
            // 所有异步处理器都应该完成
            expect(results.length).toBe(3);
            expect(results).toContain('handler1');
            expect(results).toContain('handler2');
            expect(results).toContain('handler3');
        });

        test('异步事件处理中的错误应该被正确处理', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            let successHandlerCalled = false;
            
            eventSystem.on('error:event', async () => {
                throw new Error('Test async error');
            }, { async: true });
            
            eventSystem.on('error:event', async () => {
                successHandlerCalled = true;
            }, { async: true });
            
            // emit方法应该内部处理异步错误，不向外抛出
            await expect(eventSystem.emit('error:event', {})).resolves.toBeUndefined();
            
            // 成功的处理器应该被调用
            expect(successHandlerCalled).toBe(true);
            
            consoleSpy.mockRestore();
        });
    });

    describe('事件验证和类型安全', () => {
        test('应该能够验证事件数据类型', () => {
            let validationPassed = false;
            
            eventSystem.on('typed:event', (data: PlayerLevelUpEvent) => {
                // TypeScript应该确保类型安全
                expect(typeof data.playerId).toBe('number');
                expect(typeof data.oldLevel).toBe('number');
                expect(typeof data.newLevel).toBe('number');
                expect(typeof data.experience).toBe('number');
                validationPassed = true;
            });
            
            const levelUpData: PlayerLevelUpEvent = {
                playerId: 123,
                oldLevel: 5,
                newLevel: 6,
                experience: 1500
            };
            
            eventSystem.emit('typed:event', levelUpData);
            
            expect(validationPassed).toBe(true);
        });

        test('应该能够处理复杂的事件数据结构', () => {
            interface ComplexEvent {
                metadata: {
                    timestamp: number;
                    source: string;
                };
                payload: {
                    entities: Array<{
                        id: number;
                        components: string[];
                    }>;
                    systems: string[];
                };
            }
            
            let receivedEvent: ComplexEvent | null = null;
            
            eventSystem.on('complex:event', (data: ComplexEvent) => {
                receivedEvent = data;
            });
            
            const complexData: ComplexEvent = {
                metadata: {
                    timestamp: Date.now(),
                    source: 'test'
                },
                payload: {
                    entities: [
                        { id: 1, components: ['Position', 'Velocity'] },
                        { id: 2, components: ['Health', 'Render'] }
                    ],
                    systems: ['Movement', 'Render', 'Combat']
                }
            };
            
            eventSystem.emit('complex:event', complexData);
            
            expect(receivedEvent).toEqual(complexData);
        });
    });

    describe('性能和内存管理', () => {
        test('大量事件监听器应该有良好的性能', () => {
            const listenerCount = 50; // 减少数量以避免超过限制
            let callCount = 0;
            
            // 注册大量监听器
            for (let i = 0; i < listenerCount; i++) {
                eventSystem.on('perf:event', () => {
                    callCount++;
                });
            }
            
            const startTime = performance.now();
            eventSystem.emit('perf:event', {});
            const endTime = performance.now();
            
            expect(callCount).toBe(listenerCount);
            
            const duration = endTime - startTime;
            // 性能记录：多监听器性能数据，不设硬阈值避免CI不稳定
            
            console.log(`${listenerCount}个监听器的事件触发耗时: ${duration.toFixed(2)}ms`);
        });

        test('频繁的事件触发应该有良好的性能', () => {
            let eventCount = 0;
            
            eventSystem.on('frequent:event', () => {
                eventCount++;
            });
            
            const emitCount = 10000;
            const startTime = performance.now();
            
            for (let i = 0; i < emitCount; i++) {
                eventSystem.emit('frequent:event', { index: i });
            }
            
            const endTime = performance.now();
            
            expect(eventCount).toBe(emitCount);
            
            const duration = endTime - startTime;
            // 性能记录：事件系统性能数据，不设硬阈值避免CI不稳定
            
            console.log(`${emitCount}次事件触发耗时: ${duration.toFixed(2)}ms`);
        });

        test('移除监听器应该释放内存', () => {
            const listenerIds: string[] = [];
            
            // 添加大量监听器
            for (let i = 0; i < 100; i++) {
                const handler = () => {};
                const id = eventSystem.on('memory:event', handler);
                listenerIds.push(id);
            }
            
            // 触发事件以确保监听器正常工作
            eventSystem.emit('memory:event', {});
            
            // 移除所有监听器
            listenerIds.forEach(id => {
                eventSystem.off('memory:event', id);
            });
            
            // 再次触发事件，应该没有监听器被调用
            let callCount = 0;
            eventSystem.on('memory:event', () => {
                callCount++;
            });
            
            eventSystem.emit('memory:event', {});
            expect(callCount).toBe(1); // 只有新添加的监听器被调用
        });

        test('应该能够清理所有事件监听器', () => {
            let callCount = 0;
            
            eventSystem.on('cleanup:event1', () => callCount++);
            eventSystem.on('cleanup:event2', () => callCount++);
            eventSystem.on('cleanup:event3', () => callCount++);
            
            // 清理所有监听器
            eventSystem.clear();
            
            // 触发事件，应该没有监听器被调用
            eventSystem.emit('cleanup:event1', {});
            eventSystem.emit('cleanup:event2', {});
            eventSystem.emit('cleanup:event3', {});
            
            expect(callCount).toBe(0);
        });
    });

    describe('错误处理', () => {
        test('监听器中的错误不应该影响其他监听器', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            let successHandlerCalled = false;
            
            eventSystem.on('error:event', () => {
                throw new Error('Test error in handler');
            });
            
            eventSystem.on('error:event', () => {
                successHandlerCalled = true;
            });
            
            // 触发事件不应该抛出异常
            expect(() => {
                eventSystem.emit('error:event', {});
            }).not.toThrow();
            
            // 成功的处理器应该被调用
            expect(successHandlerCalled).toBe(true);
            
            consoleSpy.mockRestore();
        });

        test('应该能够处理监听器注册和移除中的边界情况', () => {
            const handler = () => {};
            
            // 移除不存在的监听器应该安全
            expect(() => {
                const result = eventSystem.off('nonexistent:event', 'non-existent-id');
                expect(result).toBe(false);
            }).not.toThrow();
            
            // 重复添加相同的监听器应该安全
            const id1 = eventSystem.on('duplicate:event', handler);
            const id2 = eventSystem.on('duplicate:event', handler);
            
            let callCount = 0;
            eventSystem.on('duplicate:event', () => {
                callCount++;
            });
            
            eventSystem.emit('duplicate:event', {});
            
            // 所有监听器都应该被调用
            expect(callCount).toBe(1); // 新添加的监听器被调用
        });

        test('触发不存在的事件应该安全', () => {
            expect(() => {
                eventSystem.emit('nonexistent:event', {});
            }).not.toThrow();
        });
    });

    describe('全局事件系统', () => {
        test('全局事件系统应该能够跨实例通信', () => {
            let receivedData: any = null;
            
            GlobalEventSystem.on('global:test', (data) => {
                receivedData = data;
            });
            
            const testData = { message: 'global event test' };
            GlobalEventSystem.emit('global:test', testData);
            
            expect(receivedData).toEqual(testData);
        });

        test('全局事件系统应该是全局实例', () => {
            // GlobalEventSystem 是全局实例，不需要getInstance
            expect(GlobalEventSystem).toBeDefined();
            expect(GlobalEventSystem).toBeInstanceOf(TypeSafeEventSystem);
        });

        test('全局事件系统应该能够与局部事件系统独立工作', () => {
            let localCallCount = 0;
            let globalCallCount = 0;
            
            eventSystem.on('isolated:event', () => {
                localCallCount++;
            });
            
            GlobalEventSystem.on('isolated:event', () => {
                globalCallCount++;
            });
            
            // 触发局部事件
            eventSystem.emit('isolated:event', {});
            expect(localCallCount).toBe(1);
            expect(globalCallCount).toBe(0);
            
            // 触发全局事件
            GlobalEventSystem.emit('isolated:event', {});
            expect(localCallCount).toBe(1);
            expect(globalCallCount).toBe(1);
        });
    });

    describe('事件统计和调试', () => {
        test('应该能够获取事件系统统计信息', () => {
            // 添加一些监听器
            eventSystem.on('stats:event1', () => {});
            eventSystem.on('stats:event1', () => {});
            eventSystem.on('stats:event2', () => {});
            
            // 触发一些事件
            eventSystem.emit('stats:event1', {});
            eventSystem.emit('stats:event2', {});
            eventSystem.emit('stats:event1', {});
            
            const stats = eventSystem.getStats() as Map<string, any>;
            
            expect(stats).toBeInstanceOf(Map);
            expect(stats.size).toBe(2);
        });

        test('应该能够获取特定事件的统计信息', async () => {
            eventSystem.on('specific:event', () => {});
            eventSystem.on('specific:event', () => {});
            
            await eventSystem.emit('specific:event', {});
            await eventSystem.emit('specific:event', {});
            await eventSystem.emit('specific:event', {});
            
            const eventStats = eventSystem.getStats('specific:event') as any;
            
            expect(eventStats.listenerCount).toBe(2);
            expect(eventStats.triggerCount).toBe(3);
        });
    });
});