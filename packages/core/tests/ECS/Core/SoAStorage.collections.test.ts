import { Component } from '../../../src/ECS/Component';
import { ComponentStorageManager } from '../../../src/ECS/Core/ComponentStorage';
import { EnableSoA, SerializeMap, SerializeSet, SerializeArray, DeepCopy } from '../../../src/ECS/Core/SoAStorage';

// 测试组件：使用集合类型装饰器
@EnableSoA
class CollectionsComponent extends Component {
    // 序列化Map存储
    @SerializeMap
    public playerStats: Map<string, number> = new Map();
    
    // 序列化Set存储
    @SerializeSet
    public achievements: Set<string> = new Set();
    
    // 序列化Array存储
    @SerializeArray
    public inventory: string[] = [];
    
    // 深拷贝对象存储
    @DeepCopy
    public config: { settings: { volume: number } } = { settings: { volume: 0.5 } };
    
    // 普通对象（引用存储）
    public metadata: any = null;
    
    constructor() {
        super();
    }
}

describe('SoA集合类型装饰器测试', () => {
    let manager: ComponentStorageManager;

    beforeEach(() => {
        manager = new ComponentStorageManager();
    });

    test('验证Map序列化存储', () => {
        console.log('\\n=== 测试Map序列化存储 ===');
        
        const component = new CollectionsComponent();
        
        // 设置Map数据
        component.playerStats.set('health', 100);
        component.playerStats.set('mana', 50);
        component.playerStats.set('experience', 1250);
        
        console.log('原始Map数据:', {
            size: component.playerStats.size,
            entries: Array.from(component.playerStats.entries())
        });
        
        manager.addComponent(1, component);
        const retrieved = manager.getComponent(1, CollectionsComponent);
        
        console.log('取回Map数据:', {
            size: retrieved?.playerStats.size,
            entries: Array.from(retrieved?.playerStats.entries() || [])
        });
        
        // 验证Map数据完整性
        expect(retrieved?.playerStats).toBeInstanceOf(Map);
        expect(retrieved?.playerStats.size).toBe(3);
        expect(retrieved?.playerStats.get('health')).toBe(100);
        expect(retrieved?.playerStats.get('mana')).toBe(50);
        expect(retrieved?.playerStats.get('experience')).toBe(1250);
        
        console.log('✅ Map序列化存储验证通过');
    });

    test('验证Set序列化存储', () => {
        console.log('\\n=== 测试Set序列化存储 ===');
        
        const component = new CollectionsComponent();
        
        // 设置Set数据
        component.achievements.add('first_kill');
        component.achievements.add('level_10');
        component.achievements.add('boss_defeated');
        
        console.log('原始Set数据:', {
            size: component.achievements.size,
            values: Array.from(component.achievements)
        });
        
        manager.addComponent(1, component);
        const retrieved = manager.getComponent(1, CollectionsComponent);
        
        console.log('取回Set数据:', {
            size: retrieved?.achievements.size,
            values: Array.from(retrieved?.achievements || [])
        });
        
        // 验证Set数据完整性
        expect(retrieved?.achievements).toBeInstanceOf(Set);
        expect(retrieved?.achievements.size).toBe(3);
        expect(retrieved?.achievements.has('first_kill')).toBe(true);
        expect(retrieved?.achievements.has('level_10')).toBe(true);
        expect(retrieved?.achievements.has('boss_defeated')).toBe(true);
        
        console.log('✅ Set序列化存储验证通过');
    });

    test('验证Array序列化存储', () => {
        console.log('\\n=== 测试Array序列化存储 ===');
        
        const component = new CollectionsComponent();
        
        // 设置Array数据
        component.inventory.push('sword', 'shield', 'potion');
        
        console.log('原始Array数据:', component.inventory);
        
        manager.addComponent(1, component);
        const retrieved = manager.getComponent(1, CollectionsComponent);
        
        console.log('取回Array数据:', retrieved?.inventory);
        
        // 验证Array数据完整性
        expect(Array.isArray(retrieved?.inventory)).toBe(true);
        expect(retrieved?.inventory.length).toBe(3);
        expect(retrieved?.inventory).toEqual(['sword', 'shield', 'potion']);
        
        console.log('✅ Array序列化存储验证通过');
    });

    test('验证深拷贝对象存储', () => {
        console.log('\\n=== 测试深拷贝对象存储 ===');
        
        const component = new CollectionsComponent();
        const originalConfig = component.config;
        
        // 修改配置
        component.config.settings.volume = 0.8;
        
        console.log('原始配置:', component.config);
        
        manager.addComponent(1, component);
        const retrieved = manager.getComponent(1, CollectionsComponent);
        
        console.log('取回配置:', retrieved?.config);
        
        // 验证深拷贝
        expect(retrieved?.config).toEqual(component.config);
        expect(retrieved?.config).not.toBe(originalConfig); // 不是同一个引用
        expect(retrieved?.config.settings.volume).toBe(0.8);
        
        // 修改原始对象不应该影响取回的对象
        component.config.settings.volume = 0.3;
        expect(retrieved?.config.settings.volume).toBe(0.8); // 保持不变
        
        console.log('✅ 深拷贝对象存储验证通过');
    });

    test('对比普通对象存储（引用存储）', () => {
        console.log('\\n=== 测试普通对象存储（引用存储）===');
        
        const component = new CollectionsComponent();
        const sharedObject = { data: 'shared' };
        component.metadata = sharedObject;
        
        console.log('原始metadata:', component.metadata);
        
        manager.addComponent(1, component);
        const retrieved = manager.getComponent(1, CollectionsComponent);
        
        console.log('取回metadata:', retrieved?.metadata);
        
        // 验证引用存储
        expect(retrieved?.metadata).toBe(sharedObject); // 是同一个引用
        expect(retrieved?.metadata.data).toBe('shared');
        
        console.log('✅ 普通对象存储验证通过');
    });

    test('复杂场景：多种类型混合使用', () => {
        console.log('\\n=== 测试复杂场景 ===');
        
        const component = new CollectionsComponent();
        
        // 设置复杂数据
        component.playerStats.set('level', 25);
        component.playerStats.set('gold', 5000);
        
        component.achievements.add('explorer');
        component.achievements.add('warrior');
        
        component.inventory.push('legendary_sword', 'magic_potion');
        
        component.config = {
            settings: {
                volume: 0.75
            }
        };
        
        component.metadata = { timestamp: Date.now() };
        
        console.log('复杂数据设置完成');
        
        manager.addComponent(1, component);
        const retrieved = manager.getComponent(1, CollectionsComponent);
        
        // 全面验证
        expect(retrieved?.playerStats.get('level')).toBe(25);
        expect(retrieved?.achievements.has('explorer')).toBe(true);
        expect(retrieved?.inventory).toContain('legendary_sword');
        expect(retrieved?.config.settings.volume).toBe(0.75);
        expect(retrieved?.metadata).toBeDefined();
        
        console.log('✅ 复杂场景验证通过');
    });

    test('性能测试：序列化 vs 深拷贝', () => {
        console.log('\\n=== 性能对比测试 ===');
        
        const entityCount = 100;
        
        // 准备测试数据
        const startTime = performance.now();
        
        for (let i = 0; i < entityCount; i++) {
            const component = new CollectionsComponent();
            
            // 设置数据
            component.playerStats.set('id', i);
            component.playerStats.set('score', i * 100);
            
            component.achievements.add(`achievement_${i}`);
            component.inventory.push(`item_${i}`);
            
            component.config = { settings: { volume: i / entityCount } };
            
            manager.addComponent(i, component);
        }
        
        const createTime = performance.now() - startTime;
        
        // 读取测试
        const readStartTime = performance.now();
        for (let i = 0; i < entityCount; i++) {
            const component = manager.getComponent(i, CollectionsComponent);
            expect(component?.playerStats.get('id')).toBe(i);
        }
        const readTime = performance.now() - readStartTime;
        
        console.log(`创建${entityCount}个复杂组件: ${createTime.toFixed(2)}ms`);
        console.log(`读取${entityCount}个复杂组件: ${readTime.toFixed(2)}ms`);
        console.log(`平均每个组件: ${((createTime + readTime) / entityCount).toFixed(4)}ms`);
        
        console.log('✅ 性能测试完成');
    });
});