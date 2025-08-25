import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { SceneWorldAdapter } from '../../../src/ECS/Core/Snapshot/SceneWorldAdapter';
import { SnapshotRef } from '../../../src/ECS/Core/Snapshot/SnapshotStore';
import { 
    Recorder, 
    Replayer, 
    InputRecord, 
    Recording, 
    RecorderState, 
    ReplayerState,
    InputHandler
} from '../../../src/ECS/Core/Snapshot';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage/ComponentRegistry';
import { Serializable, SerializableField } from '../../../src/ECS/Decorators/SerializationDecorators';
import { SchemaRegistry } from '../../../src/ECS/Core/Serialization/SchemaRegistry';

// 全局初始化Schema注册表
SchemaRegistry.reset();
SchemaRegistry.init();

// 注册测试组件
SchemaRegistry.registerComponent('TestComponent', {
    value: { dataType: 'number' }
});

SchemaRegistry.registerComponent('MovementComponent', {
    x: { dataType: 'number' },
    y: { dataType: 'number' },
    speed: { dataType: 'number' }
});

@Serializable()
class TestComponent extends Component {
    @SerializableField({ id: 1, dataType: 'number' })
    public value: number = 0;
    
    @SerializableField({ id: 2, dataType: 'string' })
    public name: string = '';
}

@Serializable()
class InputComponent extends Component {
    @SerializableField({ id: 1, dataType: 'custom' })
    public inputHistory: Array<{ frame: number; playerId: number; data: string }> = [];
}

describe('Recorder & Replayer - 录制回放API', () => {
    let scene: Scene;
    let adapter: SceneWorldAdapter;
    let recorder: Recorder;
    let replayer: Replayer;

    beforeEach(() => {
        scene = new Scene();
        adapter = new SceneWorldAdapter(scene);
        recorder = new Recorder();
        replayer = new Replayer(adapter);

        
        ComponentRegistry.register(TestComponent);
        ComponentRegistry.register(InputComponent);
    });

    afterEach(() => {
        scene.unload();
        recorder.reset();
    });

    describe('Recorder - 录制器功能', () => {
        test('应正确管理录制状态', () => {
            expect(recorder.state).toBe(RecorderState.Idle);
            expect(recorder.recordCount).toBe(0);

            recorder.start(42);
            expect(recorder.state).toBe(RecorderState.Recording);
            expect(recorder.duration).toBeGreaterThanOrEqual(0);

            const recording = recorder.stop();
            expect(recorder.state).toBe(RecorderState.Stopped);
            expect(recording.seed).toBe(42);
            expect(recording.records).toEqual([]);
        });

        test('应正确记录输入事件', () => {
            recorder.start(123);

            const payload1 = new TextEncoder().encode('move_up');
            const payload2 = new TextEncoder().encode('attack');
            
            recorder.push(10, 1, payload1);
            recorder.push(15, 2, payload2);
            recorder.push(15, 1, new TextEncoder().encode('jump')); // 同一帧多个输入

            expect(recorder.recordCount).toBe(3);

            const recording = recorder.stop();
            expect(recording.records).toHaveLength(3);
            
            // 验证排序：先按帧号，后按玩家ID
            expect(recording.records[0].frame).toBe(10);
            expect(recording.records[0].playerId).toBe(1);
            
            expect(recording.records[1].frame).toBe(15);
            expect(recording.records[1].playerId).toBe(1);
            
            expect(recording.records[2].frame).toBe(15);
            expect(recording.records[2].playerId).toBe(2);
        });

        test('应拒绝无效输入', () => {
            recorder.start(42);

            // 负帧号
            recorder.push(-1, 1, new Uint8Array([1]));
            expect(recorder.recordCount).toBe(0);

            // 负玩家ID  
            recorder.push(1, -1, new Uint8Array([1]));
            expect(recorder.recordCount).toBe(0);

            // 帧序倒退
            recorder.push(10, 1, new Uint8Array([1]));
            recorder.push(5, 1, new Uint8Array([2])); // 倒退
            expect(recorder.recordCount).toBe(1);

            const recording = recorder.stop();
            expect(recording.records[0].frame).toBe(10);
        });

        test('应提供详细统计信息', () => {
            recorder.start(999);
            
            recorder.push(100, 1, new Uint8Array([1]));
            recorder.push(200, 2, new Uint8Array([2]));
            recorder.push(300, 1, new Uint8Array([3]));

            const stats = recorder.getStats();
            expect(stats.state).toBe(RecorderState.Recording);
            expect(stats.seed).toBe(999);
            expect(stats.recordCount).toBe(3);
            expect(stats.frameRange).toEqual({ min: 100, max: 300 });
            expect(stats.playerIds).toEqual([1, 2]);
        });
    });

    describe('Replayer - 回放器功能', () => {
        let testRecording: Recording;
        let testSnapshot: SnapshotRef;

        beforeEach(() => {
            // 创建测试场景
            const entity = new Entity('TestEntity', 1);
            const comp = new TestComponent();
            comp.value = 100;
            entity.addComponent(comp);
            scene.addEntity(entity);

            // 创建快照
            const snapshotData = adapter.encode({ deterministic: true, frame: 50, seed: 42 });
            const worldSig = adapter.signature();
            testSnapshot = new SnapshotRef(50, 42, worldSig, snapshotData);

            // 创建测试录制
            testRecording = {
                seed: 42,
                records: [
                    { frame: 60, playerId: 1, payload: new TextEncoder().encode('input1') },
                    { frame: 70, playerId: 2, payload: new TextEncoder().encode('input2') },
                    { frame: 80, playerId: 1, payload: new TextEncoder().encode('input3') }
                ]
            };
        });

        test('应正确管理回放状态', () => {
            expect(replayer.state).toBe(ReplayerState.Uninitialized);

            replayer.loadSnapshot(testSnapshot);
            expect(replayer.state).toBe(ReplayerState.SnapshotLoaded);
            expect(replayer.currentFrame).toBe(50);

            replayer.setRecording(testRecording);
            expect(replayer.state).toBe(ReplayerState.Ready);

            const info = replayer.recordingInfo;
            expect(info).toEqual({
                seed: 42,
                totalFrames: 80,
                recordCount: 3
            });
        });

        test('应正确处理输入事件', () => {
            replayer.loadSnapshot(testSnapshot);
            replayer.setRecording(testRecording);

            const receivedInputs: Array<{ frame: number; playerId: number; data: string }> = [];
            
            const inputHandler: InputHandler = (frame, playerId, payload) => {
                const data = new TextDecoder().decode(payload);
                receivedInputs.push({ frame, playerId, data });
            };

            replayer.addInputHandler(inputHandler);
            replayer.replayTo(80);

            expect(replayer.state).toBe(ReplayerState.Completed);
            expect(replayer.currentFrame).toBe(80);
            expect(receivedInputs).toHaveLength(3);
            
            expect(receivedInputs[0]).toEqual({ frame: 60, playerId: 1, data: 'input1' });
            expect(receivedInputs[1]).toEqual({ frame: 70, playerId: 2, data: 'input2' });
            expect(receivedInputs[2]).toEqual({ frame: 80, playerId: 1, data: 'input3' });
        });

        test('应支持部分回放', () => {
            replayer.loadSnapshot(testSnapshot);
            replayer.setRecording(testRecording);

            const receivedInputs: number[] = [];
            replayer.addInputHandler((frame) => receivedInputs.push(frame));

            // 只回放到帧70
            replayer.replayTo(70);

            expect(replayer.state).toBe(ReplayerState.Ready);
            expect(replayer.currentFrame).toBe(70);
            expect(receivedInputs).toEqual([60, 70]);
        });

        test('应支持重置和重新回放', () => {
            replayer.loadSnapshot(testSnapshot);
            replayer.setRecording(testRecording);

            // 第一次回放
            const firstInputs: number[] = [];
            replayer.addInputHandler((frame) => firstInputs.push(frame));
            replayer.replayTo(80);

            expect(replayer.currentFrame).toBe(80);
            expect(firstInputs).toEqual([60, 70, 80]);

            // 重置
            replayer.reset();
            expect(replayer.currentFrame).toBe(50);
            expect(replayer.state).toBe(ReplayerState.Ready);

            // 第二次回放
            const secondInputs: number[] = [];
            replayer.removeInputHandler(replayer['_inputHandlers'][0]);
            replayer.addInputHandler((frame) => secondInputs.push(frame));
            replayer.replayTo(70);

            expect(secondInputs).toEqual([60, 70]);
        });

        test('应验证种子兼容性', () => {
            const wrongSnapshot = new SnapshotRef(
                testSnapshot.frame, 
                999, // 错误的种子
                testSnapshot.worldSig,
                testSnapshot.payload
            );

            const wrongRecording: Recording = {
                ...testRecording,
                seed: 888 // 错误的种子
            };

            replayer.loadSnapshot(wrongSnapshot);
            
            // 严格模式下应抛出异常
            expect(() => {
                replayer.setRecording(wrongRecording);
            }).toThrow('种子不匹配');

            // 非严格模式下应只警告
            const lenientReplayer = new Replayer(adapter, { strictMode: false });
            lenientReplayer.loadSnapshot(wrongSnapshot);
            expect(() => {
                lenientReplayer.setRecording(wrongRecording);
            }).not.toThrow();
        });

        test('应提供进度回调', () => {
            replayer.loadSnapshot(testSnapshot);
            replayer.setRecording(testRecording);

            const progressUpdates: Array<{ current: number; total: number }> = [];
            
            const replayerWithProgress = new Replayer(adapter, {
                onProgress: (current, total) => {
                    progressUpdates.push({ current, total });
                }
            });

            replayerWithProgress.loadSnapshot(testSnapshot);
            replayerWithProgress.setRecording(testRecording);
            replayerWithProgress.replayTo(80);

            expect(progressUpdates.length).toBeGreaterThan(0);
            expect(progressUpdates[progressUpdates.length - 1]).toEqual({ current: 3, total: 3 });
        });

        test('应提供输入范围查询', () => {
            replayer.loadSnapshot(testSnapshot);
            replayer.setRecording(testRecording);

            const inputs60to70 = replayer.getInputsInRange(60, 70);
            expect(inputs60to70).toHaveLength(2);
            expect(inputs60to70.map(i => i.frame)).toEqual([60, 70]);

            const inputs65to75 = replayer.getInputsInRange(65, 75);
            expect(inputs65to75).toHaveLength(1);
            expect(inputs65to75[0].frame).toBe(70);
        });

        test('应提供详细统计信息', () => {
            replayer.loadSnapshot(testSnapshot);
            replayer.setRecording(testRecording);

            const stats = replayer.getStats();
            expect(stats.state).toBe(ReplayerState.Ready);
            expect(stats.currentFrame).toBe(50);
            expect(stats.snapshotFrame).toBe(50);
            expect(stats.recordingInfo).toEqual({
                seed: 42,
                totalFrames: 80,
                recordCount: 3
            });
            expect(stats.progress).toEqual({
                current: 0,
                total: 30, // 80 - 50
                percentage: 0
            });

            // 回放一半后检查进度
            replayer.replayTo(65);
            const midStats = replayer.getStats();
            expect(midStats.progress!.current).toBe(15); // 65 - 50
            expect(midStats.progress!.percentage).toBe(50); // 15/30 * 100
        });
    });

    describe('集成测试 - 录制与回放完整流程', () => {
        test('应支持完整的录制-快照-回放流程', () => {
            // 1. 设置初始场景
            const entity = new Entity('GameEntity', 1);
            const inputComp = new InputComponent();
            entity.addComponent(inputComp);
            scene.addEntity(entity);

            // 2. 开始录制
            recorder.start(12345);

            // 3. 模拟游戏运行和输入
            const inputs = [
                { frame: 10, playerId: 1, data: 'move_left' },
                { frame: 20, playerId: 1, data: 'jump' },
                { frame: 30, playerId: 2, data: 'attack' }
            ];

            // 处理输入并记录
            for (const input of inputs) {
                const payload = new TextEncoder().encode(input.data);
                recorder.push(input.frame, input.playerId, payload);
                
                // 模拟输入对游戏状态的影响
                const gameEntity = scene.entities.buffer[0];
                const gameInputComp = gameEntity.getComponent(InputComponent)!;
                gameInputComp.inputHistory.push(input);
            }

            // 4. 在帧25时拍快照
            const snapshotData = adapter.encode({ deterministic: true, frame: 25, seed: 12345 });
            const worldSig = adapter.signature();
            const snapshot = new SnapshotRef(25, 12345, worldSig, snapshotData);

            // 5. 停止录制
            const recording = recorder.stop();
            expect(recording.seed).toBe(12345);
            expect(recording.records).toHaveLength(3);

            // 6. 创建新场景进行回放
            const replayScene = new Scene();
            const replayAdapter = new SceneWorldAdapter(replayScene);
            const newReplayer = new Replayer(replayAdapter);

            // 7. 加载快照和录制数据
            newReplayer.loadSnapshot(snapshot);
            newReplayer.setRecording(recording);

            // 8. 处理回放输入
            let replayedInputs: Array<{ frame: number; playerId: number; data: string }> = [];
            
            newReplayer.addInputHandler((frame, playerId, payload) => {
                const data = new TextDecoder().decode(payload);
                replayedInputs.push({ frame, playerId, data });
                
                // 模拟在回放场景中应用输入
                const entity = replayScene.entities.buffer[0];
                const inputComp = entity.getComponent(InputComponent)!;
                inputComp.inputHistory.push({ frame, playerId, data });
            });

            // 9. 回放到帧30
            newReplayer.replayTo(30);

            // 10. 验证结果
            expect(newReplayer.currentFrame).toBe(30);
            expect(replayedInputs).toHaveLength(1); // 只有帧30的输入在快照之后
            expect(replayedInputs[0]).toEqual({ frame: 30, playerId: 2, data: 'attack' });

            // 11. 验证状态一致性
            const replayEntity = replayScene.entities.buffer[0];
            const replayInputComp = replayEntity.getComponent(InputComponent)!;
            expect(replayInputComp.inputHistory).toHaveLength(1);
            expect(replayInputComp.inputHistory[0]).toEqual({ frame: 30, playerId: 2, data: 'attack' });

            replayScene.unload();
        });

        test('应支持确定性验证', () => {
            // 创建相同的初始状态
            const entity1 = new Entity('Entity1', 1);
            const comp1 = new TestComponent();
            comp1.value = 42;
            entity1.addComponent(comp1);
            scene.addEntity(entity1);

            // 录制输入序列
            recorder.start(777);
            const inputSequence = [
                { frame: 5, playerId: 1, action: 'inc' },
                { frame: 10, playerId: 1, action: 'mul' },
                { frame: 15, playerId: 2, action: 'dec' }
            ];

            for (const input of inputSequence) {
                const payload = new TextEncoder().encode(JSON.stringify(input));
                recorder.push(input.frame, input.playerId, payload);
            }

            const recording = recorder.stop();

            // 多次回放验证确定性
            const signatures: number[] = [];
            
            for (let run = 0; run < 3; run++) {
                const testScene = new Scene();
                ComponentRegistry.register(TestComponent);
                const testAdapter = new SceneWorldAdapter(testScene);
                const testReplayer = new Replayer(testAdapter);

                // 重建相同的初始状态
                const testEntity = new Entity('Entity1', 1);
                const testComp = new TestComponent();
                testComp.value = 42;
                testEntity.addComponent(testComp);
                testScene.addEntity(testEntity);

                // 创建快照
                const snapshot = testAdapter.encode({ deterministic: true, frame: 0, seed: 777 });
                const worldSig = testAdapter.signature();
                testReplayer.loadSnapshot(new SnapshotRef(0, 777, worldSig, snapshot));
                testReplayer.setRecording(recording);

                // 设置输入处理器模拟确定性逻辑
                testReplayer.addInputHandler((frame, playerId, payload) => {
                    const input = JSON.parse(new TextDecoder().decode(payload));
                    const entity = testScene.entities.buffer[0];
                    const comp = entity.getComponent(TestComponent)!;
                    
                    switch (input.action) {
                        case 'inc':
                            comp.value += 1;
                            break;
                        case 'mul':
                            comp.value *= 2;
                            break;
                        case 'dec':
                            comp.value -= 1;
                            break;
                    }
                });

                // 回放所有输入
                testReplayer.replayTo(15);

                // 记录最终签名
                const signature = testAdapter.signature();
                signatures.push(signature);

                testScene.unload();
            }

            // 验证所有运行的签名相同
            expect(signatures).toHaveLength(3);
            expect(signatures[0]).toBe(signatures[1]);
            expect(signatures[1]).toBe(signatures[2]);
        });
    });
});