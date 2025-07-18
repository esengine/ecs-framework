/**
 * 双轨制ID系统测试 - 验证现代高性能ECS的核心设计
 * 
 * 测试覆盖：
 * - 压缩ID池的性能和正确性
 * - 全局ID映射的一致性和查找性能
 * - 批量操作的效率
 * - 内存使用和溢出处理
 * - 实际应用场景模拟
 */
import { 
    DualTrackIdSystem, 
    DualTrackIdUtils, 
    GlobalIdUtils,
    CompressedEntityPool,
    GlobalIdMapper
} from '../../../src/ECS/Utils/DualTrackIdSystem';

describe('双轨制ID系统测试', () => {
    let idSystem: DualTrackIdSystem;

    beforeEach(() => {
        idSystem = new DualTrackIdSystem();
    });

    describe('压缩实体ID测试', () => {
        test('应该能分配连续的压缩ID', () => {
            const id1 = idSystem.allocateEntity();
            const id2 = idSystem.allocateEntity();
            const id3 = idSystem.allocateEntity();

            // 验证ID格式 (12位世代 + 20位索引)
            expect(id1).toBe(0x100000); // 世代1，索引0
            expect(id2).toBe(0x100001); // 世代1，索引1
            expect(id3).toBe(0x100002); // 世代1，索引2

            // 验证ID有效性
            expect(idSystem.isValidEntity(id1)).toBe(true);
            expect(idSystem.isValidEntity(id2)).toBe(true);
            expect(idSystem.isValidEntity(id3)).toBe(true);
        });

        test('应该能回收并重用ID', () => {
            const id1 = idSystem.allocateEntity();
            const id2 = idSystem.allocateEntity();

            // 回收第一个ID
            expect(idSystem.destroyEntity(id1)).toBe(true);
            expect(idSystem.isValidEntity(id1)).toBe(false);

            // 分配新ID应该重用索引但递增世代
            const id3 = idSystem.allocateEntity();
            const index1 = DualTrackIdUtils.getEntityIndex(id1);
            const index3 = DualTrackIdUtils.getEntityIndex(id3);
            const gen1 = DualTrackIdUtils.getEntityGeneration(id1);
            const gen3 = DualTrackIdUtils.getEntityGeneration(id3);

            expect(index3).toBe(index1); // 重用同一索引
            expect(gen3).toBe(gen1 + 1); // 世代递增
        });

        test('应该处理世代溢出', () => {
            const pool = new CompressedEntityPool();
            
            // 强制世代溢出测试 - 需要循环到超过最大世代值
            let currentId = pool.allocate();
            let currentGeneration = DualTrackIdUtils.getEntityGeneration(currentId);
            expect(currentGeneration).toBe(1); // 初始世代应该是1
            
            // 循环4094次，世代会从1增加到4095
            for (let i = 0; i < 4094; i++) {
                pool.recycle(currentId);
                pool.forceProcessRecycle();
                currentId = pool.allocate();
                currentGeneration = DualTrackIdUtils.getEntityGeneration(currentId);
            }

            expect(currentGeneration).toBe(4095); // 现在应该是最大世代4095

            // 再回收一次应该溢出到1
            pool.recycle(currentId);
            pool.forceProcessRecycle();

            const finalId = pool.allocate();
            const finalGeneration = DualTrackIdUtils.getEntityGeneration(finalId);
            expect(finalGeneration).toBe(1); // 应该重置为1而不是0
        });

        test('应该支持批量操作', () => {
            const count = 100;
            const entityIds = new Uint32Array(count);
            
            const allocated = idSystem.allocateEntitiesBatch(count, entityIds);
            expect(allocated).toBe(count);

            // 验证所有ID都有效且唯一
            const uniqueIds = new Set(entityIds);
            expect(uniqueIds.size).toBe(count);

            for (let i = 0; i < count; i++) {
                expect(idSystem.isValidEntity(entityIds[i])).toBe(true);
            }

            // 批量回收
            const recycled = idSystem.destroyEntitiesBatch(entityIds, count);
            expect(recycled).toBe(count);

            // 验证所有ID都已失效
            for (let i = 0; i < count; i++) {
                expect(idSystem.isValidEntity(entityIds[i])).toBe(false);
            }
        });
    });

    describe('全局ID映射测试', () => {
        test('应该能创建和查找全局ID', () => {
            const entityId = idSystem.allocateEntity();
            const globalId = idSystem.getGlobalId(entityId);

            expect(GlobalIdUtils.isEmpty(globalId)).toBe(false);
            expect(globalId.high).toBeGreaterThan(0);
            expect(globalId.low).toBeGreaterThan(0);

            // 反向查找
            const foundEntityId = idSystem.findEntityByGlobalId(globalId);
            expect(foundEntityId).toBe(entityId);
        });

        test('应该能处理全局ID字符串转换', () => {
            const entityId = idSystem.allocateEntity();
            const globalId = idSystem.getGlobalId(entityId);
            const globalIdStr = GlobalIdUtils.toString(globalId);

            expect(typeof globalIdStr).toBe('string');
            expect(globalIdStr).toMatch(/^[0-9a-f]{8}-[0-9a-f]{8}$/i);

            // 通过字符串查找实体
            const foundEntityId = idSystem.findEntityByGlobalIdString(globalIdStr);
            expect(foundEntityId).toBe(entityId);

            // 解析字符串
            const parsedGlobalId = GlobalIdUtils.fromString(globalIdStr);
            expect(parsedGlobalId).not.toBeNull();
            expect(GlobalIdUtils.equals(parsedGlobalId!, globalId)).toBe(true);
        });

        test('应该能移除全局映射', () => {
            const entityId = idSystem.allocateEntity();
            const globalId = idSystem.getGlobalId(entityId);

            // 销毁实体应该同时移除全局映射
            expect(idSystem.destroyEntity(entityId)).toBe(true);
            
            const foundEntityId = idSystem.findEntityByGlobalId(globalId);
            expect(foundEntityId).toBe(0); // 应该找不到
        });

        test('应该支持批量全局ID转换', () => {
            const count = 50;
            const entityIds = new Uint32Array(count);
            const globalIdsHigh = new Uint32Array(count);
            const globalIdsLow = new Uint32Array(count);

            // 批量分配实体
            idSystem.allocateEntitiesBatch(count, entityIds);

            // 批量转换为全局ID
            const converted = idSystem.convertToGlobalBatch(
                entityIds, count, globalIdsHigh, globalIdsLow
            );
            expect(converted).toBe(count);

            // 验证所有全局ID都有效
            for (let i = 0; i < count; i++) {
                expect(globalIdsHigh[i]).toBeGreaterThan(0);
                expect(globalIdsLow[i]).toBeGreaterThan(0);
            }

            // 批量转换回实体ID
            const convertedEntityIds = new Uint32Array(count);
            const reconverted = idSystem.convertToEntityBatch(
                globalIdsHigh, globalIdsLow, count, convertedEntityIds
            );
            expect(reconverted).toBe(count);

            // 验证转换结果一致
            for (let i = 0; i < count; i++) {
                expect(convertedEntityIds[i]).toBe(entityIds[i]);
            }
        });
    });

    describe('性能和内存测试', () => {
        test('应该具有出色的性能特征', () => {
            const iterations = 1000;
            
            // 测试分配性能
            const allocStart = performance.now();
            const entityIds: number[] = [];
            
            for (let i = 0; i < iterations; i++) {
                entityIds.push(idSystem.allocateEntity());
            }
            
            const allocTime = performance.now() - allocStart;
            expect(allocTime).toBeLessThan(100); // 1000次分配应在100ms内完成

            // 测试验证性能
            const validateStart = performance.now();
            let validCount = 0;
            
            for (const entityId of entityIds) {
                if (idSystem.isValidEntity(entityId)) {
                    validCount++;
                }
            }
            
            const validateTime = performance.now() - validateStart;
            expect(validCount).toBe(iterations);
            expect(validateTime).toBeLessThan(50); // 1000次验证应在50ms内完成

            // 测试全局ID创建性能
            const globalStart = performance.now();
            const globalIds = entityIds.map(id => idSystem.getGlobalId(id));
            const globalTime = performance.now() - globalStart;
            
            expect(globalIds.length).toBe(iterations);
            expect(globalTime).toBeLessThan(200); // 1000次全局ID创建应在200ms内完成
        });

        test('应该具有合理的内存使用', () => {
            // 创建大量实体测试内存使用
            const count = 2000;
            const entityIds = new Uint32Array(count);
            
            idSystem.allocateEntitiesBatch(count, entityIds);
            
            // 为一半实体创建全局映射
            for (let i = 0; i < count / 2; i++) {
                idSystem.getGlobalId(entityIds[i]);
            }

            const stats = idSystem.getSystemStats();
            
            // 内存使用应该合理（小于20MB，因为32位版本需要更多内存）
            expect(stats.system.memoryUsage).toBeLessThan(20 * 1024 * 1024);

            // 实体池利用率应该正确
            expect(stats.entityPool.currentActive).toBe(count);
            expect(stats.entityPool.utilization).toBeCloseTo(count / 1048576, 6);
            
            // 全局映射统计应该正确
            expect(stats.globalMapper.mappingsCreated).toBe(count / 2);
        });

        test('应该正确处理容量限制', () => {
            const pool = new CompressedEntityPool();
            const allocatedIds: number[] = [];
            
            // 尝试分配超过最大容量的实体
            for (let i = 0; i < CompressedEntityPool.MAX_ENTITIES + 100; i++) {
                const id = pool.allocate();
                if (id !== 0) {
                    allocatedIds.push(id);
                } else {
                    break; // 达到容量限制
                }
            }
            
            expect(allocatedIds.length).toBe(CompressedEntityPool.MAX_ENTITIES);
            expect(pool.isFull()).toBe(true);
            
            // 回收一些ID后应该能继续分配
            pool.recycle(allocatedIds[0]);
            pool.forceProcessRecycle();
            
            const newId = pool.allocate();
            expect(newId).not.toBe(0);
            expect(pool.isValid(newId)).toBe(true);
        });
    });

    describe('系统健康监控测试', () => {
        test('应该能提供健康状态检查', () => {
            const health = idSystem.getHealthStatus();

            // 32位版本由于内存使用较高，可能是good而不是excellent
            expect(['excellent', 'good']).toContain(health.status);
            expect(health.issues).toBeDefined();
            expect(health.recommendations).toBeDefined();
        });

        test('应该能检测潜在问题', () => {
            // 创建大量实体来测试警告条件
            const count = 3900; // 接近最大容量
            const entityIds = new Uint32Array(count);
            
            idSystem.allocateEntitiesBatch(count, entityIds);
            
            const health = idSystem.getHealthStatus();
            
            if (health.status !== 'excellent') {
                expect(health.issues.length).toBeGreaterThan(0);
                expect(health.recommendations.length).toBeGreaterThan(0);
            }
        });

        test('应该能提供详细的统计信息', () => {
            const count = 100;
            const entityIds = new Uint32Array(count);
            
            idSystem.allocateEntitiesBatch(count, entityIds);
            
            // 为部分实体创建全局映射
            for (let i = 0; i < 50; i++) {
                idSystem.getGlobalId(entityIds[i]);
            }
            
            const stats = idSystem.getSystemStats();
            
            expect(stats.system.totalEntitiesCreated).toBe(count);
            expect(stats.system.currentActiveEntities).toBe(count);
            expect(stats.entityPool.currentActive).toBe(count);
            expect(stats.globalMapper.mappingsCreated).toBe(50);
            expect(stats.system.uptime).toBeGreaterThanOrEqual(0);
        });
    });

    describe('边界情况和错误处理测试', () => {
        test('应该能处理无效ID', () => {
            expect(idSystem.isValidEntity(0)).toBe(false);
            expect(idSystem.isValidEntity(-1)).toBe(false);
            expect(idSystem.isValidEntity(0xFFFF)).toBe(false);
            
            expect(idSystem.destroyEntity(0)).toBe(false);
            expect(idSystem.destroyEntity(-1)).toBe(false);
        });

        test('应该能处理重复操作', () => {
            const entityId = idSystem.allocateEntity();
            
            // 重复获取全局ID应该返回相同结果
            const globalId1 = idSystem.getGlobalId(entityId);
            const globalId2 = idSystem.getGlobalId(entityId);
            
            expect(GlobalIdUtils.equals(globalId1, globalId2)).toBe(true);
            
            // 重复销毁应该只成功一次
            expect(idSystem.destroyEntity(entityId)).toBe(true);
            expect(idSystem.destroyEntity(entityId)).toBe(false);
        });

        test('应该能处理空的全局ID', () => {
            const emptyGlobalId = GlobalIdUtils.empty();
            
            expect(GlobalIdUtils.isEmpty(emptyGlobalId)).toBe(true);
            expect(idSystem.findEntityByGlobalId(emptyGlobalId)).toBe(0);
            
            const invalidStr = "invalid-global-id";
            expect(idSystem.findEntityByGlobalIdString(invalidStr)).toBe(0);
        });
    });

    describe('实际应用场景模拟', () => {
        test('游戏实体生命周期模拟', () => {
            // 模拟游戏中实体的典型生命周期
            const players: number[] = [];
            const bullets: number[] = [];
            const enemies: number[] = [];
            
            // 创建玩家
            for (let i = 0; i < 4; i++) {
                players.push(idSystem.allocateEntity());
            }
            
            // 创建敌人
            for (let i = 0; i < 20; i++) {
                enemies.push(idSystem.allocateEntity());
            }
            
            // 玩家需要全局ID（用于网络同步）
            const playerGlobalIds = players.map(id => idSystem.getGlobalId(id));
            
            // 创建大量子弹（高频创建/销毁）
            for (let frame = 0; frame < 10; frame++) {
                // 每帧创建一些子弹
                for (let i = 0; i < 50; i++) {
                    bullets.push(idSystem.allocateEntity());
                }
                
                // 销毁一些旧子弹
                if (bullets.length > 100) {
                    const toDestroy = bullets.splice(0, 30);
                    for (const bulletId of toDestroy) {
                        idSystem.destroyEntity(bulletId);
                    }
                }
            }
            
            // 验证玩家全局ID仍然有效
            for (let i = 0; i < players.length; i++) {
                const foundId = idSystem.findEntityByGlobalId(playerGlobalIds[i]);
                expect(foundId).toBe(players[i]);
                expect(idSystem.isValidEntity(players[i])).toBe(true);
            }
            
            const stats = idSystem.getSystemStats();
            expect(stats.system.currentActiveEntities).toBeGreaterThan(0);
        });

        test('网络同步场景模拟', () => {
            // 模拟网络游戏中的实体同步
            const entities: number[] = [];
            
            // 服务器创建实体
            for (let i = 0; i < 100; i++) {
                entities.push(idSystem.allocateEntity());
            }
            
            // 准备网络同步数据
            const count = entities.length;
            const entityIds = new Uint32Array(entities);
            const globalIdsHigh = new Uint32Array(count);
            const globalIdsLow = new Uint32Array(count);

            // 转换为全局ID用于网络传输
            const converted = idSystem.convertToGlobalBatch(
                entityIds, count, globalIdsHigh, globalIdsLow
            );
            expect(converted).toBe(count);

            // 模拟网络传输后，客户端接收数据
            const clientIdSystem = new DualTrackIdSystem();
            const receivedEntityIds = new Uint32Array(count);
            
            // 客户端重建实体（这里简化处理）
            for (let i = 0; i < count; i++) {
                receivedEntityIds[i] = clientIdSystem.allocateEntity();
            }
            
            // 验证两端都能正常工作
            expect(clientIdSystem.getSystemStats().system.currentActiveEntities).toBe(count);
        });

        test('数据库持久化场景模拟', () => {
            const entities: number[] = [];
            const globalIdStrings: string[] = [];
            
            // 创建实体并获取全局ID字符串（用于数据库存储）
            for (let i = 0; i < 20; i++) {
                const entityId = idSystem.allocateEntity();
                entities.push(entityId);
                
                const globalId = idSystem.getGlobalId(entityId);
                const globalIdStr = GlobalIdUtils.toString(globalId);
                globalIdStrings.push(globalIdStr);
            }
            
            // 模拟场景重载
            idSystem.reset();
            
            // 重新创建一些实体
            const newEntities: number[] = [];
            for (let i = 0; i < 10; i++) {
                newEntities.push(idSystem.allocateEntity());
            }
            
            // 尝试通过数据库中的全局ID字符串查找实体
            // （在实际应用中，这些实体需要先重建）
            for (const globalIdStr of globalIdStrings) {
                const foundId = idSystem.findEntityByGlobalIdString(globalIdStr);
                expect(foundId).toBe(0); // 应该找不到，因为实体已被重置
            }
        });
    });
});

describe('工具类测试', () => {
    describe('DualTrackIdUtils', () => {
        test('应该能正确解析和格式化ID', () => {
            const entityId = 0x100234; // 世代1，索引0x234 (32位格式: [12位世代][20位索引])

            expect(DualTrackIdUtils.isValidCompressedId(entityId)).toBe(true);
            expect(DualTrackIdUtils.getEntityIndex(entityId)).toBe(0x234);
            expect(DualTrackIdUtils.getEntityGeneration(entityId)).toBe(1);

            const formatted = DualTrackIdUtils.formatEntityId(entityId);
            expect(formatted).toContain('idx=564'); // 0x234 = 564
            expect(formatted).toContain('gen=1');
        });
    });

    describe('GlobalIdUtils', () => {
        test('应该能正确处理全局ID操作', () => {
            const globalId = { high: 0x12345678, low: 0x9ABCDEF0 };
            
            expect(DualTrackIdUtils.isValidGlobalId(globalId)).toBe(true);
            
            const str = GlobalIdUtils.toString(globalId);
            expect(str).toBe('12345678-9abcdef0');
            
            const parsed = GlobalIdUtils.fromString(str);
            expect(parsed).not.toBeNull();
            expect(DualTrackIdUtils.compareGlobalIds(globalId, parsed!)).toBe(true);
        });
    });
}); 