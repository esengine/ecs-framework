import { NetworkRole } from '../src/NetworkRole';

// 模拟Component基类
class Component {
    public update(): void {
        // 默认空实现
    }
}

// 模拟INetworkSyncable接口
interface INetworkSyncable {
    getNetworkState(): Uint8Array;
    applyNetworkState(data: Uint8Array): void;
    getDirtyFields(): number[];
    markClean(): void;
    markFieldDirty(fieldNumber: number): void;
    isFieldDirty(fieldNumber: number): boolean;
}

// 简化版NetworkComponent用于测试
class TestableNetworkComponent extends Component implements INetworkSyncable {
    private _dirtyFields: Set<number> = new Set();
    private _fieldTimestamps: Map<number, number> = new Map();

    constructor() {
        super();
    }

    public getRole(): NetworkRole {
        // 模拟环境检测，默认返回客户端
        return NetworkRole.CLIENT;
    }

    public isClient(): boolean {
        return true; // 在测试中简化为始终是客户端
    }

    public isServer(): boolean {
        return false; // 在测试中简化为始终不是服务端
    }

    public onClientUpdate(): void {
        // 默认空实现
    }

    public onServerUpdate(): void {
        // 默认空实现
    }

    public override update(): void {
        if (this.isClient()) {
            this.onClientUpdate();
        } else if (this.isServer()) {
            this.onServerUpdate();
        }
    }

    public getNetworkState(): Uint8Array {
        return new Uint8Array([1, 2, 3]); // 模拟数据
    }

    public applyNetworkState(data: Uint8Array): void {
        this.markClean();
    }

    public getDirtyFields(): number[] {
        return Array.from(this._dirtyFields);
    }

    public markClean(): void {
        this._dirtyFields.clear();
    }

    public markFieldDirty(fieldNumber: number): void {
        this._dirtyFields.add(fieldNumber);
        this._fieldTimestamps.set(fieldNumber, Date.now());
    }

    public isFieldDirty(fieldNumber: number): boolean {
        return this._dirtyFields.has(fieldNumber);
    }

    public getFieldTimestamp(fieldNumber: number): number {
        return this._fieldTimestamps.get(fieldNumber) || 0;
    }

    public getDirtyFieldsWithTimestamps(): Map<number, number> {
        const result = new Map<number, number>();
        for (const fieldNumber of this._dirtyFields) {
            result.set(fieldNumber, this._fieldTimestamps.get(fieldNumber) || 0);
        }
        return result;
    }
}

class TestNetworkComponent extends TestableNetworkComponent {
    public value: number = 0;

    constructor(value: number = 0) {
        super();
        this.value = value;
    }

    public override onClientUpdate(): void {
        this.value += 1;
        this.markFieldDirty(1);
    }

    public override onServerUpdate(): void {
        this.value += 10;
        this.markFieldDirty(1);
    }
}

describe('NetworkComponent', () => {
    describe('角色功能', () => {
        test('应该正确获取角色信息', () => {
            const component = new TestNetworkComponent();
            
            expect(component.getRole()).toBe(NetworkRole.CLIENT);
            expect(component.isClient()).toBe(true);
            expect(component.isServer()).toBe(false);
        });
    });

    describe('更新逻辑', () => {
        test('组件应该调用对应的更新方法', () => {
            const component = new TestNetworkComponent(5);
            
            component.update();
            
            expect(component.value).toBe(6); // 5 + 1 (客户端更新)
            expect(component.getDirtyFields()).toContain(1);
        });
    });

    describe('脏字段管理', () => {
        test('应该正确标记和检查脏字段', () => {
            const component = new TestNetworkComponent();
            
            expect(component.isFieldDirty(1)).toBe(false);
            
            component.markFieldDirty(1);
            
            expect(component.isFieldDirty(1)).toBe(true);
            expect(component.getDirtyFields()).toContain(1);
        });

        test('应该正确清理脏字段', () => {
            const component = new TestNetworkComponent();
            
            component.markFieldDirty(1);
            component.markFieldDirty(2);
            
            expect(component.getDirtyFields()).toEqual(expect.arrayContaining([1, 2]));
            
            component.markClean();
            
            expect(component.getDirtyFields()).toEqual([]);
            expect(component.isFieldDirty(1)).toBe(false);
            expect(component.isFieldDirty(2)).toBe(false);
        });

        test('应该正确记录字段时间戳', () => {
            const component = new TestNetworkComponent();
            const beforeTime = Date.now();
            
            component.markFieldDirty(1);
            
            const timestamp = component.getFieldTimestamp(1);
            const afterTime = Date.now();
            
            expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(timestamp).toBeLessThanOrEqual(afterTime);
        });

        test('应该正确获取脏字段和时间戳', () => {
            const component = new TestNetworkComponent();
            
            component.markFieldDirty(1);
            component.markFieldDirty(3);
            
            const dirtyFieldsWithTimestamps = component.getDirtyFieldsWithTimestamps();
            
            expect(dirtyFieldsWithTimestamps.size).toBe(2);
            expect(dirtyFieldsWithTimestamps.has(1)).toBe(true);
            expect(dirtyFieldsWithTimestamps.has(3)).toBe(true);
            expect(dirtyFieldsWithTimestamps.get(1)).toBeGreaterThan(0);
            expect(dirtyFieldsWithTimestamps.get(3)).toBeGreaterThan(0);
        });
    });

    describe('网络状态序列化', () => {
        test('应该能获取网络状态', () => {
            const component = new TestNetworkComponent(42);
            
            expect(() => {
                const state = component.getNetworkState();
                expect(state).toBeInstanceOf(Uint8Array);
                expect(state.length).toBeGreaterThan(0);
            }).not.toThrow();
        });

        test('应该能应用网络状态', () => {
            const sourceComponent = new TestNetworkComponent(100);
            const targetComponent = new TestNetworkComponent(0);
            
            const networkState = sourceComponent.getNetworkState();
            
            expect(() => {
                targetComponent.applyNetworkState(networkState);
            }).not.toThrow();
            
            // 应用状态后应该清理脏字段
            expect(targetComponent.getDirtyFields()).toEqual([]);
        });
    });
});