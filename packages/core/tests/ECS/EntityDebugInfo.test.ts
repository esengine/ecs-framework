import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';

// 测试组件
class DebugTestComponent1 extends Component {
    public value: number = 1;
}

class DebugTestComponent2 extends Component {
    public value: number = 2;
}

class DebugTestComponent3 extends Component {
    public value: number = 3;
}

// 添加更多组件以测试位掩码分组
class DebugTestComponent4 extends Component { public value = 4; }
class DebugTestComponent5 extends Component { public value = 5; }
class DebugTestComponent6 extends Component { public value = 6; }
class DebugTestComponent7 extends Component { public value = 7; }
class DebugTestComponent8 extends Component { public value = 8; }

describe('Entity Debug Info Optimization', () => {
    let entity: Entity;

    beforeEach(() => {
        entity = new Entity('DebugTestEntity', 1);
    });

    describe('componentMask 调试信息优化', () => {
        it('空实体的掩码调试信息应该正确显示', () => {
            const debugInfo = entity.getDebugInfo();
            
            expect(debugInfo.componentMask).toBeDefined();
            expect(debugInfo.componentMask.binary).toBe('0');
            expect(debugInfo.componentMask.hex).toBe('0x0');
            expect(debugInfo.componentMask.decimal).toBe('0');
            expect(debugInfo.componentMask.registeredComponents).toEqual({});
        });

        it('带组件实体的掩码调试信息应该包含所有格式', () => {
            const comp1 = new DebugTestComponent1();
            const comp2 = new DebugTestComponent2();
            
            entity.addComponent(comp1);
            entity.addComponent(comp2);
            
            const debugInfo = entity.getDebugInfo();
            const mask = debugInfo.componentMask;
            
            // 验证所有格式都存在
            expect(mask.binary).toBeDefined();
            expect(mask.hex).toBeDefined();
            expect(mask.decimal).toBeDefined();
            expect(mask.registeredComponents).toBeDefined();
            
            // 验证十六进制格式
            expect(mask.hex).toMatch(/^0x[0-9A-F]+$/);
            
            // 验证十进制格式
            expect(mask.decimal).toMatch(/^[0-9]+$/);
            expect(parseInt(mask.decimal)).toBeGreaterThan(0);
            
            // 验证二进制格式（应该包含分组的下划线）
            expect(typeof mask.binary).toBe('string');
            
            // 验证组件映射
            expect(mask.registeredComponents).toHaveProperty('DebugTestComponent1', true);
            expect(mask.registeredComponents).toHaveProperty('DebugTestComponent2', true);
            expect(Object.keys(mask.registeredComponents)).toHaveLength(2);
        });

        it('二进制掩码应该按4位分组显示', () => {
            entity.addComponent(new DebugTestComponent1());
            entity.addComponent(new DebugTestComponent2());
            entity.addComponent(new DebugTestComponent3());
            
            const debugInfo = entity.getDebugInfo();
            const binaryMask = debugInfo.componentMask.binary;
            
            // 如果掩码长度超过4位，应该包含分组下划线
            if (binaryMask.replace(/_/g, '').length > 4) {
                expect(binaryMask).toContain('_');
            }
            
            // 验证分组后的格式：每组最多4位，用下划线分隔
            const groups = binaryMask.split('_');
            for (const group of groups) {
                expect(group.length).toBeLessThanOrEqual(4);
                expect(group).toMatch(/^[01]+$/);
            }
        });

        it('格式之间应该保持一致性', () => {
            entity.addComponent(new DebugTestComponent1());
            entity.addComponent(new DebugTestComponent2());
            
            const debugInfo = entity.getDebugInfo();
            const mask = debugInfo.componentMask;
            
            // 移除二进制格式中的分组下划线
            const cleanBinary = mask.binary.replace(/_/g, '');
            const hexValue = mask.hex.replace('0x', '');
            
            // 验证二进制转十六进制的一致性
            const binaryToHex = parseInt(cleanBinary, 2).toString(16).toUpperCase();
            expect(binaryToHex).toBe(hexValue);
            
            // 验证十进制的一致性
            const binaryToDecimal = parseInt(cleanBinary, 2).toString(10);
            expect(binaryToDecimal).toBe(mask.decimal);
        });

        it('组件映射应该反映实际拥有的组件', () => {
            const comp1 = new DebugTestComponent1();
            const comp2 = new DebugTestComponent2();
            
            entity.addComponent(comp1);
            entity.addComponent(comp2);
            
            const debugInfo = entity.getDebugInfo();
            const registeredComponents = debugInfo.componentMask.registeredComponents;
            
            // 验证映射中的组件与实际组件列表一致
            const actualComponentTypes = debugInfo.componentTypes;
            expect(Object.keys(registeredComponents).sort()).toEqual(actualComponentTypes.sort());
            
            // 验证所有映射值都是 true
            for (const [typeName, hasComponent] of Object.entries(registeredComponents)) {
                expect(hasComponent).toBe(true);
                expect(actualComponentTypes).toContain(typeName);
            }
        });

        it('移除组件后调试信息应该正确更新', () => {
            const comp1 = new DebugTestComponent1();
            const comp2 = new DebugTestComponent2();
            const comp3 = new DebugTestComponent3();
            
            entity.addComponent(comp1);
            entity.addComponent(comp2);
            entity.addComponent(comp3);
            
            const beforeDebugInfo = entity.getDebugInfo();
            expect(Object.keys(beforeDebugInfo.componentMask.registeredComponents)).toHaveLength(3);
            
            // 移除一个组件
            entity.removeComponent(comp2);
            
            const afterDebugInfo = entity.getDebugInfo();
            const afterMask = afterDebugInfo.componentMask;
            
            // 验证组件映射更新
            expect(Object.keys(afterMask.registeredComponents)).toHaveLength(2);
            expect(afterMask.registeredComponents).toHaveProperty('DebugTestComponent1', true);
            expect(afterMask.registeredComponents).not.toHaveProperty('DebugTestComponent2');
            expect(afterMask.registeredComponents).toHaveProperty('DebugTestComponent3', true);
            
            // 验证掩码值也相应变化
            const beforeDecimal = parseInt(beforeDebugInfo.componentMask.decimal);
            const afterDecimal = parseInt(afterDebugInfo.componentMask.decimal);
            expect(beforeDecimal).toBeGreaterThan(afterDecimal);
        });

        it('调试信息应该易于人眼阅读', () => {
            entity.addComponent(new DebugTestComponent1());
            entity.addComponent(new DebugTestComponent2());
            entity.addComponent(new DebugTestComponent3());
            
            const debugInfo = entity.getDebugInfo();
            const mask = debugInfo.componentMask;
            
            
            // 这个测试主要是为了在控制台输出示例，验证可读性
            expect(mask.binary).toBeDefined();
            expect(mask.hex).toBeDefined();
            expect(mask.decimal).toBeDefined();
            expect(Object.keys(mask.registeredComponents).length).toBeGreaterThan(0);
        });

        it('大量组件时的位掩码分组显示', () => {
            // 添加8个组件，产生更长的位掩码
            entity.addComponent(new DebugTestComponent1());
            entity.addComponent(new DebugTestComponent2());
            entity.addComponent(new DebugTestComponent3());
            entity.addComponent(new DebugTestComponent4());
            entity.addComponent(new DebugTestComponent5());
            entity.addComponent(new DebugTestComponent6());
            entity.addComponent(new DebugTestComponent7());
            entity.addComponent(new DebugTestComponent8());
            
            const debugInfo = entity.getDebugInfo();
            const mask = debugInfo.componentMask;
            
            
            // 验证位掩码分组
            expect(mask.binary).toContain('_'); // 应该包含分组分隔符
            expect(Object.keys(mask.registeredComponents)).toHaveLength(8);
            
            // 验证格式一致性
            const cleanBinary = mask.binary.replace(/_/g, '');
            const expectedDecimal = parseInt(cleanBinary, 2).toString(10);
            expect(expectedDecimal).toBe(mask.decimal);
        });
    });
});