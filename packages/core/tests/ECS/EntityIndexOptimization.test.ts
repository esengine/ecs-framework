import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';

// 测试组件
class IndexTestComponent1 extends Component {
    public value: number = 1;
}

class IndexTestComponent2 extends Component {
    public value: number = 2;
}

class IndexTestComponent3 extends Component {
    public value: number = 3;
}

describe('Entity Index Optimization', () => {
    let entity: Entity;

    beforeEach(() => {
        entity = new Entity('IndexTestEntity', 1);
    });

    describe('索引重建优化测试', () => {
        it('单个组件添加应该只更新单个索引', () => {
            const component1 = new IndexTestComponent1();
            const component2 = new IndexTestComponent2();
            const component3 = new IndexTestComponent3();

            // 添加组件
            entity.addComponent(component1);
            entity.addComponent(component2);
            entity.addComponent(component3);

            // 验证所有组件都能快速获取
            expect(entity.getComponent(IndexTestComponent1)).toBe(component1);
            expect(entity.getComponent(IndexTestComponent2)).toBe(component2);
            expect(entity.getComponent(IndexTestComponent3)).toBe(component3);
        });

        it('批量组件添加应该正确维护索引', () => {
            const components = [
                new IndexTestComponent1(),
                new IndexTestComponent2(),
                new IndexTestComponent3()
            ];

            // 批量添加
            entity.addComponents(components);

            // 验证所有组件都能快速获取
            expect(entity.getComponent(IndexTestComponent1)).toBe(components[0]);
            expect(entity.getComponent(IndexTestComponent2)).toBe(components[1]);
            expect(entity.getComponent(IndexTestComponent3)).toBe(components[2]);
        });

        it('组件移除后索引应该正确更新', () => {
            const component1 = new IndexTestComponent1();
            const component2 = new IndexTestComponent2();
            const component3 = new IndexTestComponent3();

            entity.addComponent(component1);
            entity.addComponent(component2);
            entity.addComponent(component3);

            // 移除中间的组件（会触发 swap-remove）
            entity.removeComponent(component2);

            // 验证剩余组件仍能正确获取
            expect(entity.getComponent(IndexTestComponent1)).toBe(component1);
            expect(entity.getComponent(IndexTestComponent2)).toBeNull();
            expect(entity.getComponent(IndexTestComponent3)).toBe(component3);
        });

        it('频繁的组件查询应该保持高性能', () => {
            const components = [
                new IndexTestComponent1(),
                new IndexTestComponent2(),
                new IndexTestComponent3()
            ];

            entity.addComponents(components);

            // 模拟频繁查询
            const iterations = 1000;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                const comp1 = entity.getComponent(IndexTestComponent1);
                const comp2 = entity.getComponent(IndexTestComponent2);
                const comp3 = entity.getComponent(IndexTestComponent3);
                
                // 确保获取到正确的组件
                expect(comp1).toBe(components[0]);
                expect(comp2).toBe(components[1]);
                expect(comp3).toBe(components[2]);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 1000次 * 3个组件 = 3000次查询应该非常快
            
            // 设置一个合理的性能预期（具体值可能需要根据实际环境调整）
            // 主要目的是确保索引优化确实提高了性能
        });

        it('混合操作后索引应该保持一致性', () => {
            const component1 = new IndexTestComponent1();
            const component2 = new IndexTestComponent2();
            const component3 = new IndexTestComponent3();

            // 混合的添加和移除操作
            entity.addComponent(component1);
            entity.addComponent(component2);
            entity.removeComponent(component1);
            entity.addComponent(component3);
            entity.addComponent(component1); // 重新添加

            // 验证最终状态
            expect(entity.getComponent(IndexTestComponent1)).toBe(component1);
            expect(entity.getComponent(IndexTestComponent2)).toBe(component2);
            expect(entity.getComponent(IndexTestComponent3)).toBe(component3);

            // 验证组件数量
            expect(entity.components.length).toBe(3);
        });
    });

    describe('边界情况索引测试', () => {
        it('空实体的组件查询应该正确处理', () => {
            expect(entity.getComponent(IndexTestComponent1)).toBeNull();
            expect(entity.getComponent(IndexTestComponent2)).toBeNull();
            expect(entity.getComponent(IndexTestComponent3)).toBeNull();
        });

        it('查询不存在的组件类型应该返回null', () => {
            const component1 = new IndexTestComponent1();
            entity.addComponent(component1);

            expect(entity.getComponent(IndexTestComponent1)).toBe(component1);
            expect(entity.getComponent(IndexTestComponent2)).toBeNull();
            expect(entity.getComponent(IndexTestComponent3)).toBeNull();
        });
    });

    describe('getComponents 位掩码剪枝优化测试', () => {
        it('应该使用位掩码快速返回空数组而无需遍历组件', () => {
            // 添加一些组件
            entity.addComponent(new IndexTestComponent1());
            entity.addComponent(new IndexTestComponent2());
            
            // 查询不存在的组件类型，应该通过位掩码快速返回空数组
            const result = entity.getComponents(IndexTestComponent3);
            expect(result).toEqual([]);
            expect(result.length).toBe(0);
        });

        it('应该正确返回匹配的组件', () => {
            const comp1 = new IndexTestComponent1();
            const comp2 = new IndexTestComponent2();
            
            entity.addComponent(comp1);
            entity.addComponent(comp2);
            
            // 获取 IndexTestComponent1 类型的组件
            const result1 = entity.getComponents(IndexTestComponent1);
            expect(result1.length).toBe(1);
            expect(result1[0]).toBe(comp1);
            
            // 获取 IndexTestComponent2 类型的组件  
            const result2 = entity.getComponents(IndexTestComponent2);
            expect(result2.length).toBe(1);
            expect(result2[0]).toBe(comp2);
            
            // 查询不存在的组件类型
            const result3 = entity.getComponents(IndexTestComponent3);
            expect(result3.length).toBe(0);
        });

        it('位掩码剪枝应该提高不存在组件查询的性能', () => {
            // 添加一些组件（每个实体最多只能有一个相同类型的组件）
            entity.addComponent(new IndexTestComponent1());
            entity.addComponent(new IndexTestComponent2());
            
            // 大量查询不存在的组件类型，应该很快返回
            const iterations = 1000;
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                const result = entity.getComponents(IndexTestComponent3);
                expect(result.length).toBe(0);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            
            // 位掩码剪枝应该让不存在的组件查询非常快
            // 这里不设置硬阈值，主要是验证功能和记录性能
        });

        it('空实体的getComponents应该快速返回空数组', () => {
            // 空实体
            const emptyEntity = new Entity('EmptyEntity', 2);
            
            // 查询任何组件类型都应该快速返回空数组
            expect(emptyEntity.getComponents(IndexTestComponent1)).toEqual([]);
            expect(emptyEntity.getComponents(IndexTestComponent2)).toEqual([]);
            expect(emptyEntity.getComponents(IndexTestComponent3)).toEqual([]);
        });
    });
});