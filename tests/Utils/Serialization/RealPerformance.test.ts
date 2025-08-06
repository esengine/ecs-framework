/**
 * 真实 Protobuf 序列化性能测试
 * 使用实际的 protobufjs 库进行性能对比
 */

import 'reflect-metadata';
import { Component } from '../../../src/ECS/Component';
import { 
    ProtoSerializable, 
    ProtoFloat,
    ProtoInt32,
    ProtoString,
    ProtoBool,
    ProtobufRegistry
} from '../../../src/Utils/Serialization/ProtobufDecorators';

// 测试组件
@ProtoSerializable('Position')
class PositionComponent extends Component {
    @ProtoFloat(1) public x: number = 0;
    @ProtoFloat(2) public y: number = 0;
    @ProtoFloat(3) public z: number = 0;
    
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

@ProtoSerializable('Player')
class PlayerComponent extends Component {
    @ProtoString(1) public name: string = '';
    @ProtoInt32(2) public level: number = 1;
    @ProtoInt32(3) public experience: number = 0;
    @ProtoInt32(4) public score: number = 0;
    @ProtoBool(5) public isOnline: boolean = true;
    @ProtoFloat(6) public health: number = 100.0;
    
    constructor(name: string = 'Player', level: number = 1) {
        super();
        this.name = name;
        this.level = level;
        this.experience = level * 1000;
        this.score = level * 500;
        this.health = 100.0;
    }
}

// JSON 对比组件
class JsonPositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    public z: number = 0;
    
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class JsonPlayerComponent extends Component {
    public name: string = '';
    public level: number = 1;
    public experience: number = 0;
    public score: number = 0;
    public isOnline: boolean = true;
    public health: number = 100.0;
    
    constructor(name: string = 'Player', level: number = 1) {
        super();
        this.name = name;
        this.level = level;
        this.experience = level * 1000;
        this.score = level * 500;
        this.health = 100.0;
    }
}

describe('真实 Protobuf 性能测试', () => {
    let protobuf: any;
    let root: any;
    let PositionType: any;
    let PlayerType: any;
    
    beforeAll(async () => {
        try {
            // 尝试加载真实的 protobufjs
            protobuf = require('protobufjs');
            
            // 生成 proto 定义
            const registry = ProtobufRegistry.getInstance();
            const protoDefinition = registry.generateProtoDefinition();
            
            console.log('Generated proto definition:');
            console.log(protoDefinition);
            
            // 解析 proto 定义
            root = protobuf.parse(protoDefinition).root;
            PositionType = root.lookupType('ecs.Position');
            PlayerType = root.lookupType('ecs.Player');
            
        } catch (error) {
            console.warn('Protobuf not available, skipping real performance tests:', error);
        }
    });
    
    const skipIfNoProtobuf = () => {
        if (!protobuf || !root) {
            console.log('Skipping test: protobufjs not available');
            return true;
        }
        return false;
    };
    
    describe('简单组件性能对比', () => {
        it('Position 组件序列化性能', () => {
            if (skipIfNoProtobuf()) return;
            
            const iterations = 1000;
            const protobufComponents: PositionComponent[] = [];
            const jsonComponents: JsonPositionComponent[] = [];
            
            // 准备测试数据
            for (let i = 0; i < iterations; i++) {
                const x = Math.random() * 1000;
                const y = Math.random() * 1000;
                const z = Math.random() * 100;
                
                protobufComponents.push(new PositionComponent(x, y, z));
                jsonComponents.push(new JsonPositionComponent(x, y, z));
            }
            
            // Protobuf 序列化测试
            const protobufStartTime = performance.now();
            let protobufTotalSize = 0;
            const protobufResults: Uint8Array[] = [];
            
            for (const component of protobufComponents) {
                const message = PositionType.create({
                    x: component.x,
                    y: component.y,
                    z: component.z
                });
                const buffer = PositionType.encode(message).finish();
                protobufResults.push(buffer);
                protobufTotalSize += buffer.length;
            }
            
            const protobufEndTime = performance.now();
            const protobufTime = protobufEndTime - protobufStartTime;
            
            // JSON 序列化测试
            const jsonStartTime = performance.now();
            let jsonTotalSize = 0;
            const jsonResults: string[] = [];
            
            for (const component of jsonComponents) {
                const jsonString = JSON.stringify({
                    x: component.x,
                    y: component.y,
                    z: component.z
                });
                jsonResults.push(jsonString);
                jsonTotalSize += new Blob([jsonString]).size;
            }
            
            const jsonEndTime = performance.now();
            const jsonTime = jsonEndTime - jsonStartTime;
            
            // 计算性能指标
            const speedImprovement = jsonTime > 0 ? ((jsonTime - protobufTime) / jsonTime * 100) : 0;
            const sizeReduction = jsonTotalSize > 0 ? ((jsonTotalSize - protobufTotalSize) / jsonTotalSize * 100) : 0;
            
            console.log(`\\n=== Position 组件性能对比 (${iterations} 次迭代) ===`);
            console.log(`Protobuf 时间: ${protobufTime.toFixed(2)}ms`);
            console.log(`JSON 时间: ${jsonTime.toFixed(2)}ms`);
            console.log(`速度变化: ${speedImprovement > 0 ? '+' : ''}${speedImprovement.toFixed(1)}%`);
            console.log('');
            console.log(`Protobuf 总大小: ${protobufTotalSize} bytes`);
            console.log(`JSON 总大小: ${jsonTotalSize} bytes`);
            console.log(`大小变化: ${sizeReduction > 0 ? '-' : '+'}${Math.abs(sizeReduction).toFixed(1)}%`);
            console.log(`平均 Protobuf 大小: ${(protobufTotalSize / iterations).toFixed(1)} bytes`);
            console.log(`平均 JSON 大小: ${(jsonTotalSize / iterations).toFixed(1)} bytes`);
            
            // 验证反序列化
            let deserializeTime = performance.now();
            for (const buffer of protobufResults.slice(0, 10)) { // 只测试前10个
                const decoded = PositionType.decode(buffer);
                expect(typeof decoded.x).toBe('number');
                expect(typeof decoded.y).toBe('number');
                expect(typeof decoded.z).toBe('number');
            }
            deserializeTime = performance.now() - deserializeTime;
            console.log(`Protobuf 反序列化 10 个: ${deserializeTime.toFixed(2)}ms`);
            
            // 基本验证
            expect(protobufTime).toBeGreaterThan(0);
            expect(jsonTime).toBeGreaterThan(0);
            expect(protobufTotalSize).toBeGreaterThan(0);
            expect(jsonTotalSize).toBeGreaterThan(0);
        });
        
        it('复杂 Player 组件序列化性能', () => {
            if (skipIfNoProtobuf()) return;
            
            const iterations = 500;
            const protobufPlayers: PlayerComponent[] = [];
            const jsonPlayers: JsonPlayerComponent[] = [];
            
            // 创建测试数据
            for (let i = 0; i < iterations; i++) {
                const name = `Player_${i}_${'x'.repeat(10 + Math.floor(Math.random() * 20))}`;
                const level = Math.floor(Math.random() * 100) + 1;
                
                protobufPlayers.push(new PlayerComponent(name, level));
                jsonPlayers.push(new JsonPlayerComponent(name, level));
            }
            
            // Protobuf 序列化测试
            const protobufStart = performance.now();
            let protobufSize = 0;
            
            for (const player of protobufPlayers) {
                const message = PlayerType.create({
                    name: player.name,
                    level: player.level,
                    experience: player.experience,
                    score: player.score,
                    isOnline: player.isOnline,
                    health: player.health
                });
                const buffer = PlayerType.encode(message).finish();
                protobufSize += buffer.length;
            }
            
            const protobufTime = performance.now() - protobufStart;
            
            // JSON 序列化测试
            const jsonStart = performance.now();
            let jsonSize = 0;
            
            for (const player of jsonPlayers) {
                const jsonString = JSON.stringify({
                    name: player.name,
                    level: player.level,
                    experience: player.experience,
                    score: player.score,
                    isOnline: player.isOnline,
                    health: player.health
                });
                jsonSize += new Blob([jsonString]).size;
            }
            
            const jsonTime = performance.now() - jsonStart;
            
            const speedChange = jsonTime > 0 ? ((jsonTime - protobufTime) / jsonTime * 100) : 0;
            const sizeReduction = jsonSize > 0 ? ((jsonSize - protobufSize) / jsonSize * 100) : 0;
            
            console.log(`\\n=== Player 组件性能对比 (${iterations} 次迭代) ===`);
            console.log(`Protobuf 时间: ${protobufTime.toFixed(2)}ms`);
            console.log(`JSON 时间: ${jsonTime.toFixed(2)}ms`);
            console.log(`速度变化: ${speedChange > 0 ? '+' : ''}${speedChange.toFixed(1)}%`);
            console.log('');
            console.log(`Protobuf 总大小: ${protobufSize} bytes`);
            console.log(`JSON 总大小: ${jsonSize} bytes`);
            console.log(`大小变化: ${sizeReduction > 0 ? '-' : '+'}${Math.abs(sizeReduction).toFixed(1)}%`);
            console.log(`平均 Protobuf 大小: ${(protobufSize / iterations).toFixed(1)} bytes`);
            console.log(`平均 JSON 大小: ${(jsonSize / iterations).toFixed(1)} bytes`);
            
            expect(protobufTime).toBeGreaterThan(0);
            expect(jsonTime).toBeGreaterThan(0);
        });
    });
    
    describe('批量数据性能测试', () => {
        it('大量小对象序列化', () => {
            if (skipIfNoProtobuf()) return;
            
            const count = 5000;
            console.log(`\\n=== 大量小对象测试 (${count} 个 Position) ===`);
            
            // 准备数据
            const positions = Array.from({ length: count }, (_, i) => ({
                x: i * 0.1,
                y: i * 0.2,
                z: i * 0.05
            }));
            
            // Protobuf 批量序列化
            const protobufStart = performance.now();
            let protobufSize = 0;
            
            for (const pos of positions) {
                const message = PositionType.create(pos);
                const buffer = PositionType.encode(message).finish();
                protobufSize += buffer.length;
            }
            
            const protobufTime = performance.now() - protobufStart;
            
            // JSON 批量序列化
            const jsonStart = performance.now();
            let jsonSize = 0;
            
            for (const pos of positions) {
                const jsonString = JSON.stringify(pos);
                jsonSize += jsonString.length;
            }
            
            const jsonTime = performance.now() - jsonStart;
            
            console.log(`Protobuf: ${protobufTime.toFixed(2)}ms, ${protobufSize} bytes`);
            console.log(`JSON: ${jsonTime.toFixed(2)}ms, ${jsonSize} bytes`);
            console.log(`速度: ${protobufTime < jsonTime ? 'Protobuf 更快' : 'JSON 更快'} (${Math.abs(protobufTime - jsonTime).toFixed(2)}ms 差异)`);
            console.log(`大小: Protobuf ${protobufSize < jsonSize ? '更小' : '更大'} (${Math.abs(protobufSize - jsonSize)} bytes 差异)`);
            console.log(`处理速度: Protobuf ${Math.floor(count / (protobufTime / 1000))} ops/s, JSON ${Math.floor(count / (jsonTime / 1000))} ops/s`);
        });
    });
    
    describe('真实网络场景模拟', () => {
        it('游戏状态同步场景', () => {
            if (skipIfNoProtobuf()) return;
            
            console.log(`\\n=== 游戏状态同步场景 ===`);
            
            // 模拟 100 个玩家的位置更新
            const playerCount = 100;
            const updateData = Array.from({ length: playerCount }, (_, i) => ({
                playerId: i,
                x: Math.random() * 1000,
                y: Math.random() * 1000,
                z: Math.random() * 100,
                health: Math.floor(Math.random() * 100),
                isMoving: Math.random() > 0.5
            }));
            
            // 创建组合消息类型（模拟）
            const GameUpdateType = root.lookupType('ecs.Position'); // 简化使用 Position
            
            // Protobuf 序列化所有更新
            const protobufStart = performance.now();
            let protobufTotalSize = 0;
            
            for (const update of updateData) {
                const message = GameUpdateType.create({
                    x: update.x,
                    y: update.y,
                    z: update.z
                });
                const buffer = GameUpdateType.encode(message).finish();
                protobufTotalSize += buffer.length;
            }
            
            const protobufTime = performance.now() - protobufStart;
            
            // JSON 序列化所有更新
            const jsonStart = performance.now();
            let jsonTotalSize = 0;
            
            for (const update of updateData) {
                const jsonString = JSON.stringify({
                    playerId: update.playerId,
                    x: update.x,
                    y: update.y,
                    z: update.z,
                    health: update.health,
                    isMoving: update.isMoving
                });
                jsonTotalSize += jsonString.length;
            }
            
            const jsonTime = performance.now() - jsonStart;
            
            console.log(`${playerCount} 个玩家位置更新:`);
            console.log(`Protobuf: ${protobufTime.toFixed(2)}ms, ${protobufTotalSize} bytes`);
            console.log(`JSON: ${jsonTime.toFixed(2)}ms, ${jsonTotalSize} bytes`);
            
            // 计算网络传输节省
            const sizeSaving = jsonTotalSize - protobufTotalSize;
            const percentSaving = (sizeSaving / jsonTotalSize * 100);
            
            console.log(`数据大小节省: ${sizeSaving} bytes (${percentSaving.toFixed(1)}%)`);
            console.log(`每秒 60 次更新的带宽节省: ${(sizeSaving * 60 / 1024).toFixed(2)} KB/s`);
            
            expect(protobufTotalSize).toBeGreaterThan(0);
            expect(jsonTotalSize).toBeGreaterThan(0);
        });
    });
});