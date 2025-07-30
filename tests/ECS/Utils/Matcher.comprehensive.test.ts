import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentTypeManager } from '../../../src/ECS/Utils/ComponentTypeManager';

// 测试组件定义
class PositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class VelocityComponent extends Component {
    constructor(public vx: number = 0, public vy: number = 0) {
        super();
    }
}

class HealthComponent extends Component {
    constructor(public health: number = 100, public maxHealth: number = 100) {
        super();
    }
}

class RenderComponent extends Component {
    constructor(public visible: boolean = true, public layer: number = 0) {
        super();
    }
}

class AIComponent extends Component {
    constructor(public behavior: string = 'idle') {
        super();
    }
}

class PlayerComponent extends Component {
    constructor(public playerId: number = 0) {
        super();
    }
}

class WeaponComponent extends Component {
    constructor(public damage: number = 10, public range: number = 100) {
        super();
    }
}

class ArmorComponent extends Component {
    constructor(public defense: number = 5) {
        super();
    }
}

describe('Matcher综合测试', () => {
    let typeManager: ComponentTypeManager;
    
    beforeEach(() => {
        // 重置组件类型管理器以确保测试隔离
        typeManager = ComponentTypeManager.instance;
        typeManager.reset();
    });
    
    describe('基础匹配器创建和配置', () => {
        test('空匹配器应该匹配所有实体', () => {
            const matcher = Matcher.empty();
            
            // 创建具有不同组件的实体
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            entity2.addComponent(new PositionComponent(10, 20));
            
            const entity3 = new Entity('Entity3', 3);
            entity3.addComponent(new PositionComponent(0, 0));
            entity3.addComponent(new VelocityComponent(1, 1));
            
            // 空匹配器应该匹配所有实体
            expect(matcher.isInterestedEntity(entity1)).toBe(true);
            expect(matcher.isInterestedEntity(entity2)).toBe(true);
            expect(matcher.isInterestedEntity(entity3)).toBe(true);
        });
        
        test('单一all条件匹配器', () => {
            const matcher = Matcher.empty().all(PositionComponent);
            
            const entityWithPosition = new Entity('WithPosition', 1);
            entityWithPosition.addComponent(new PositionComponent(10, 20));
            
            const entityWithoutPosition = new Entity('WithoutPosition', 2);
            entityWithoutPosition.addComponent(new VelocityComponent(1, 1));
            
            expect(matcher.isInterestedEntity(entityWithPosition)).toBe(true);
            expect(matcher.isInterestedEntity(entityWithoutPosition)).toBe(false);
        });
        
        test('多个all条件匹配器', () => {
            const matcher = Matcher.empty().all(PositionComponent, VelocityComponent);
            
            const completeEntity = new Entity('Complete', 1);
            completeEntity.addComponent(new PositionComponent(10, 20));
            completeEntity.addComponent(new VelocityComponent(1, 1));
            
            const partialEntity1 = new Entity('Partial1', 2);
            partialEntity1.addComponent(new PositionComponent(0, 0));
            
            const partialEntity2 = new Entity('Partial2', 3);
            partialEntity2.addComponent(new VelocityComponent(1, 1));
            
            const emptyEntity = new Entity('Empty', 4);
            
            expect(matcher.isInterestedEntity(completeEntity)).toBe(true);
            expect(matcher.isInterestedEntity(partialEntity1)).toBe(false);
            expect(matcher.isInterestedEntity(partialEntity2)).toBe(false);
            expect(matcher.isInterestedEntity(emptyEntity)).toBe(false);
        });
        
        test('exclude条件匹配器', () => {
            const matcher = Matcher.empty()
                .all(PositionComponent)
                .exclude(AIComponent);
            
            const playerEntity = new Entity('Player', 1);
            playerEntity.addComponent(new PositionComponent(10, 20));
            playerEntity.addComponent(new PlayerComponent(1));
            
            const aiEntity = new Entity('AI', 2);
            aiEntity.addComponent(new PositionComponent(50, 60));
            aiEntity.addComponent(new AIComponent('patrol'));
            
            const staticEntity = new Entity('Static', 3);
            staticEntity.addComponent(new RenderComponent());
            
            expect(matcher.isInterestedEntity(playerEntity)).toBe(true);
            expect(matcher.isInterestedEntity(aiEntity)).toBe(false); // 被exclude排除
            expect(matcher.isInterestedEntity(staticEntity)).toBe(false); // 缺少required组件
        });
        
        test('one条件匹配器', () => {
            const matcher = Matcher.empty().one(WeaponComponent, ArmorComponent);
            
            const weaponEntity = new Entity('Weapon', 1);
            weaponEntity.addComponent(new WeaponComponent(15, 150));
            
            const armorEntity = new Entity('Armor', 2);
            armorEntity.addComponent(new ArmorComponent(8));
            
            const bothEntity = new Entity('Both', 3);
            bothEntity.addComponent(new WeaponComponent(20, 200));
            bothEntity.addComponent(new ArmorComponent(10));
            
            const neitherEntity = new Entity('Neither', 4);
            neitherEntity.addComponent(new PositionComponent(0, 0));
            
            expect(matcher.isInterestedEntity(weaponEntity)).toBe(true);
            expect(matcher.isInterestedEntity(armorEntity)).toBe(true);
            expect(matcher.isInterestedEntity(bothEntity)).toBe(true);
            expect(matcher.isInterestedEntity(neitherEntity)).toBe(false);
        });
    });
    
    describe('复杂匹配器组合', () => {
        test('all + exclude组合', () => {
            // 匹配有位置和速度，但不是AI的实体
            const matcher = Matcher.empty()
                .all(PositionComponent, VelocityComponent)
                .exclude(AIComponent);
            
            const playerEntity = new Entity('Player', 1);
            playerEntity.addComponent(new PositionComponent(10, 20));
            playerEntity.addComponent(new VelocityComponent(2, 2));
            playerEntity.addComponent(new PlayerComponent(1));
            
            const aiEntity = new Entity('AI', 2);
            aiEntity.addComponent(new PositionComponent(50, 60));
            aiEntity.addComponent(new VelocityComponent(1, 0));
            aiEntity.addComponent(new AIComponent('chase'));
            
            const incompleteEntity = new Entity('Incomplete', 3);
            incompleteEntity.addComponent(new PositionComponent(0, 0));
            
            expect(matcher.isInterestedEntity(playerEntity)).toBe(true);
            expect(matcher.isInterestedEntity(aiEntity)).toBe(false);
            expect(matcher.isInterestedEntity(incompleteEntity)).toBe(false);
        });
        
        test('all + one组合', () => {
            // 匹配有位置，且有武器或护甲的实体
            const matcher = Matcher.empty()
                .all(PositionComponent)
                .one(WeaponComponent, ArmorComponent);
            
            const warriorEntity = new Entity('Warrior', 1);
            warriorEntity.addComponent(new PositionComponent(10, 20));
            warriorEntity.addComponent(new WeaponComponent(25, 180));
            
            const guardEntity = new Entity('Guard', 2);
            guardEntity.addComponent(new PositionComponent(30, 40));
            guardEntity.addComponent(new ArmorComponent(12));
            
            const knightEntity = new Entity('Knight', 3);
            knightEntity.addComponent(new PositionComponent(50, 60));
            knightEntity.addComponent(new WeaponComponent(30, 200));
            knightEntity.addComponent(new ArmorComponent(15));
            
            const civilianEntity = new Entity('Civilian', 4);
            civilianEntity.addComponent(new PositionComponent(70, 80));
            civilianEntity.addComponent(new HealthComponent(80));
            
            const weaponNoPositionEntity = new Entity('WeaponNoPos', 5);
            weaponNoPositionEntity.addComponent(new WeaponComponent(20, 160));
            
            expect(matcher.isInterestedEntity(warriorEntity)).toBe(true);
            expect(matcher.isInterestedEntity(guardEntity)).toBe(true);
            expect(matcher.isInterestedEntity(knightEntity)).toBe(true);
            expect(matcher.isInterestedEntity(civilianEntity)).toBe(false);
            expect(matcher.isInterestedEntity(weaponNoPositionEntity)).toBe(false);
        });
        
        test('all + exclude + one组合', () => {
            // 匹配有位置和健康，有武器或护甲，但不是AI的实体
            const matcher = Matcher.empty()
                .all(PositionComponent, HealthComponent)
                .exclude(AIComponent)
                .one(WeaponComponent, ArmorComponent);
            
            const playerWarriorEntity = new Entity('PlayerWarrior', 1);
            playerWarriorEntity.addComponent(new PositionComponent(10, 20));
            playerWarriorEntity.addComponent(new HealthComponent(120));
            playerWarriorEntity.addComponent(new WeaponComponent(25, 180));
            playerWarriorEntity.addComponent(new PlayerComponent(1));
            
            const aiWarriorEntity = new Entity('AIWarrior', 2);
            aiWarriorEntity.addComponent(new PositionComponent(30, 40));
            aiWarriorEntity.addComponent(new HealthComponent(100));
            aiWarriorEntity.addComponent(new WeaponComponent(20, 160));
            aiWarriorEntity.addComponent(new AIComponent('attack'));
            
            const civilianEntity = new Entity('Civilian', 3);
            civilianEntity.addComponent(new PositionComponent(50, 60));
            civilianEntity.addComponent(new HealthComponent(80));
            // 没有武器或护甲
            
            const incompleteEntity = new Entity('Incomplete', 4);
            incompleteEntity.addComponent(new PositionComponent(70, 80));
            incompleteEntity.addComponent(new WeaponComponent(15, 140));
            // 没有健康组件
            
            expect(matcher.isInterestedEntity(playerWarriorEntity)).toBe(true);
            expect(matcher.isInterestedEntity(aiWarriorEntity)).toBe(false); // 被AI排除
            expect(matcher.isInterestedEntity(civilianEntity)).toBe(false); // 缺少武器/护甲
            expect(matcher.isInterestedEntity(incompleteEntity)).toBe(false); // 缺少健康组件
        });
    });
    
    describe('匹配器性能和缓存测试', () => {
        test('位掩码缓存应该正确工作', () => {
            const matcher = Matcher.empty().all(PositionComponent, VelocityComponent);
            
            // 创建测试实体
            const entity = new Entity('TestEntity', 1);
            entity.addComponent(new PositionComponent(10, 20));
            entity.addComponent(new VelocityComponent(1, 1));
            
            // 第一次匹配会构建缓存
            const result1 = matcher.isInterestedEntity(entity);
            
            // 再次匹配应该使用缓存
            const result2 = matcher.isInterestedEntity(entity);
            const result3 = matcher.isInterestedEntity(entity);
            
            expect(result1).toBe(true);
            expect(result2).toBe(true);
            expect(result3).toBe(true);
        });
        
        test('修改匹配器后应该重新构建缓存', () => {
            const matcher = Matcher.empty().all(PositionComponent);
            
            const entity = new Entity('TestEntity', 1);
            entity.addComponent(new PositionComponent(10, 20));
            entity.addComponent(new VelocityComponent(1, 1));
            
            // 初始匹配
            expect(matcher.isInterestedEntity(entity)).toBe(true);
            
            // 修改匹配器
            matcher.all(HealthComponent);
            
            // 应该重新计算匹配结果
            expect(matcher.isInterestedEntity(entity)).toBe(false);
            
            // 添加健康组件后应该匹配
            entity.addComponent(new HealthComponent(100));
            expect(matcher.isInterestedEntity(entity)).toBe(true);
        });
        
        test('适量实体匹配性能测试', () => {
            const matcher = Matcher.empty()
                .all(PositionComponent, VelocityComponent)
                .exclude(AIComponent);
            
            // 创建适量测试实体
            const entities: Entity[] = [];
            for (let i = 0; i < 100; i++) {
                const entity = new Entity(`Entity${i}`, i);
                entity.addComponent(new PositionComponent(i, i));
                
                if (i % 2 === 0) {
                    entity.addComponent(new VelocityComponent(1, 1));
                }
                
                if (i % 5 === 0) {
                    entity.addComponent(new AIComponent('patrol'));
                }
                
                entities.push(entity);
            }
            
            // 测试匹配性能
            const startTime = performance.now();
            let matchCount = 0;
            
            for (const entity of entities) {
                if (matcher.isInterestedEntity(entity)) {
                    matchCount++;
                }
            }
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            // 性能验证：100个实体的匹配应该在合理时间内完成
            expect(executionTime).toBeLessThan(50); // 50ms内完成
            
            // 逻辑验证：只有偶数索引且不是5的倍数的实体应该匹配
            // 偶数：50个，5的倍数：20个，重叠的偶数且是5倍数：10个
            // 所以匹配的应该是：50 - 10 = 40个
            expect(matchCount).toBe(40);
        });
    });
    
    describe('边界情况和错误处理', () => {
        test('重复添加同一组件类型', () => {
            const matcher = Matcher.empty()
                .all(PositionComponent)
                .all(PositionComponent); // 重复添加
            
            const entity = new Entity('TestEntity', 1);
            entity.addComponent(new PositionComponent(10, 20));
            
            // 应该仍然正常工作
            expect(matcher.isInterestedEntity(entity)).toBe(true);
            
            // 检查内部状态
            expect(matcher.getAllSet().length).toBe(2); // 会有重复
        });
        
        test('空实体匹配测试', () => {
            const matchers = [
                Matcher.empty().all(PositionComponent),
                Matcher.empty().exclude(PositionComponent),
                Matcher.empty().one(PositionComponent, VelocityComponent)
            ];
            
            const emptyEntity = new Entity('EmptyEntity', 1);
            
            expect(matchers[0].isInterestedEntity(emptyEntity)).toBe(false); // all
            expect(matchers[1].isInterestedEntity(emptyEntity)).toBe(true);  // exclude
            expect(matchers[2].isInterestedEntity(emptyEntity)).toBe(false); // one
        });
        
        test('实体组件动态变化', () => {
            const matcher = Matcher.empty()
                .all(PositionComponent, VelocityComponent)
                .exclude(AIComponent);
            
            const entity = new Entity('DynamicEntity', 1);
            
            // 初始状态：无组件
            expect(matcher.isInterestedEntity(entity)).toBe(false);
            
            // 添加位置组件
            entity.addComponent(new PositionComponent(10, 20));
            expect(matcher.isInterestedEntity(entity)).toBe(false);
            
            // 添加速度组件
            entity.addComponent(new VelocityComponent(1, 1));
            expect(matcher.isInterestedEntity(entity)).toBe(true);
            
            // 添加AI组件（被排除）
            entity.addComponent(new AIComponent('idle'));
            expect(matcher.isInterestedEntity(entity)).toBe(false);
            
            // 移除AI组件
            const aiComponent = entity.getComponent(AIComponent);
            if (aiComponent) {
                entity.removeComponent(aiComponent);
            }
            expect(matcher.isInterestedEntity(entity)).toBe(true);
        });
        
        test('链式调用应该返回同一个匹配器实例', () => {
            const matcher = Matcher.empty();
            const result = matcher
                .all(PositionComponent)
                .exclude(AIComponent)
                .one(WeaponComponent, ArmorComponent);
            
            expect(result).toBe(matcher);
        });
    });
    
    describe('匹配器调试和工具方法', () => {
        test('toString方法应该返回有意义的描述', () => {
            const emptyMatcher = Matcher.empty();
            expect(emptyMatcher.toString()).toBe('Matcher()');
            
            const simpleMatcher = Matcher.empty().all(PositionComponent);
            expect(simpleMatcher.toString()).toContain('all: [PositionComponent]');
            
            const complexMatcher = Matcher.empty()
                .all(PositionComponent, VelocityComponent)
                .exclude(AIComponent)
                .one(WeaponComponent, ArmorComponent);
            
            const str = complexMatcher.toString();
            expect(str).toContain('all: [PositionComponent, VelocityComponent]');
            expect(str).toContain('exclude: [AIComponent]');
            expect(str).toContain('one: [WeaponComponent, ArmorComponent]');
        });
        
        test('获取匹配器配置', () => {
            const matcher = Matcher.empty()
                .all(PositionComponent, VelocityComponent)
                .exclude(AIComponent, PlayerComponent)
                .one(WeaponComponent);
            
            expect(matcher.getAllSet()).toEqual([PositionComponent, VelocityComponent]);
            expect(matcher.getExclusionSet()).toEqual([AIComponent, PlayerComponent]);
            expect(matcher.getOneSet()).toEqual([WeaponComponent]);
        });
    });
    
    describe('位掩码直接匹配测试', () => {
        test('isInterested方法应该正确处理Bits对象', () => {
            const matcher = Matcher.empty().all(PositionComponent, VelocityComponent);
            
            // 创建包含Position和Velocity的位掩码
            const matchingBits = typeManager.createBits(PositionComponent, VelocityComponent);
            expect(matcher.isInterested(matchingBits)).toBe(true);
            
            // 创建只包含Position的位掩码
            const partialBits = typeManager.createBits(PositionComponent);
            expect(matcher.isInterested(partialBits)).toBe(false);
            
            // 创建包含Position、Velocity和Health的位掩码
            const extraBits = typeManager.createBits(PositionComponent, VelocityComponent, HealthComponent);
            expect(matcher.isInterested(extraBits)).toBe(true);
        });
        
        test('复杂位掩码匹配测试', () => {
            const matcher = Matcher.empty()
                .all(PositionComponent)
                .exclude(AIComponent)
                .one(WeaponComponent, ArmorComponent);
            
            // 匹配情况：Position + Weapon
            const bits1 = typeManager.createBits(PositionComponent, WeaponComponent);
            expect(matcher.isInterested(bits1)).toBe(true);
            
            // 匹配情况：Position + Armor
            const bits2 = typeManager.createBits(PositionComponent, ArmorComponent);
            expect(matcher.isInterested(bits2)).toBe(true);
            
            // 不匹配：Position + AI + Weapon（被排除）
            const bits3 = typeManager.createBits(PositionComponent, AIComponent, WeaponComponent);
            expect(matcher.isInterested(bits3)).toBe(false);
            
            // 不匹配：Position only（缺少one条件）
            const bits4 = typeManager.createBits(PositionComponent);
            expect(matcher.isInterested(bits4)).toBe(false);
            
            // 不匹配：Weapon only（缺少all条件）
            const bits5 = typeManager.createBits(WeaponComponent);
            expect(matcher.isInterested(bits5)).toBe(false);
        });
    });
    
    afterEach(() => {
        // 清理组件类型管理器
        typeManager.reset();
    });
});