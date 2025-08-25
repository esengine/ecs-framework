import { Scene } from '../Scene';
import { SceneWorldAdapter } from './Snapshot/SceneWorldAdapter';
import { createLogger } from '../../Utils/Logger';

const logger = createLogger('DeterministicTestUtils');

/**
 * 确定性断言工具
 * 用于验证ECS系统的确定性行为
 */
export class DeterministicTestUtils {
    /**
     * 断言确定性：相同seed执行相同步数应得到相同签名
     * 
     * @param scene 场景实例
     * @param seed 随机种子
     * @param steps 执行步数
     * @returns 是否通过断言
     */
    public static assertDeterministic(scene: Scene, seed: number, steps: number): boolean {
        const adapter = new SceneWorldAdapter(scene);
        
        // 第一次运行
        const initialSnapshot = adapter.encode({ deterministic: true, seed });
        const signatures1: number[] = [];
        
        for (let i = 0; i < steps; i++) {
            scene.update();
            if (i % 10 === 0) { // 每10步记录一次签名
                signatures1.push(adapter.signature('simOnly'));
            }
        }
        
        // 恢复初始状态并第二次运行
        adapter.decode(initialSnapshot, { deterministic: true });
        const signatures2: number[] = [];
        
        for (let i = 0; i < steps; i++) {
            scene.update();
            if (i % 10 === 0) {
                signatures2.push(adapter.signature('simOnly'));
            }
        }
        
        // 比较签名
        const isEqual = JSON.stringify(signatures1) === JSON.stringify(signatures2);
        if (!isEqual) {
            logger.error(`确定性断言失败: seed=${seed}, steps=${steps}`);
            logger.error('第一次签名:', signatures1);
            logger.error('第二次签名:', signatures2);
        }
        
        return isEqual;
    }
    
    /**
     * 断言回滚：从t0快照到t1，然后回滚到t0，重放到t1应得到相同签名
     * 
     * @param scene 场景实例
     * @param seed 随机种子
     * @param t0 起始时间点
     * @param t1 结束时间点
     * @returns 是否通过断言
     */
    public static assertRollback(scene: Scene, _seed: number, t0: number, t1: number): boolean {
        if (t1 <= t0) {
            throw new Error('t1 must be greater than t0');
        }
        
        const adapter = new SceneWorldAdapter(scene);
        
        // 初始化到t0
        for (let i = 0; i < t0; i++) {
            scene.update();
        }
        
        // 在t0时刻拍快照
        const t0Snapshot = adapter.encode({ deterministic: true, frame: t0 });
        const t0Signature = adapter.signature('simOnly');
        
        // 继续运行到t1
        for (let i = t0; i < t1; i++) {
            scene.update();
        }
        const t1SignatureDirect = adapter.signature('simOnly');
        
        // 回滚到t0并重放到t1
        adapter.decode(t0Snapshot, { deterministic: true });
        const t0SignatureAfterRollback = adapter.signature('simOnly');
        
        if (t0SignatureAfterRollback !== t0Signature) {
            logger.error(`回滚断言失败: t0签名不匹配`);
            logger.error(`原始t0签名: ${t0Signature}`);
            logger.error(`回滚后t0签名: ${t0SignatureAfterRollback}`);
            return false;
        }
        
        // 重放到t1
        for (let i = t0; i < t1; i++) {
            scene.update();
        }
        const t1SignatureReplayed = adapter.signature('simOnly');
        
        const isEqual = t1SignatureDirect === t1SignatureReplayed;
        if (!isEqual) {
            logger.error(`回滚断言失败: t1签名不匹配`);
            logger.error(`直接运行t1签名: ${t1SignatureDirect}`);
            logger.error(`回滚重放t1签名: ${t1SignatureReplayed}`);
        }
        
        return isEqual;
    }
    
    /**
     * 创建带签名校验点的录制器
     * 每N帧记录worldSig校验点，回放时自动比对
     * 
     * @param scene 场景实例
     * @param checkpointInterval 校验点间隔（帧数）
     */
    public static createRecorder(scene: Scene, checkpointInterval: number = 100) {
        const adapter = new SceneWorldAdapter(scene);
        const checkpoints: Array<{ frame: number; signature: number }> = [];
        let currentFrame = 0;
        
        return {
            /**
             * 更新并记录校验点
             */
            update(): void {
                scene.update();
                currentFrame++;
                
                if (currentFrame % checkpointInterval === 0) {
                    const signature = adapter.signature('simOnly');
                    checkpoints.push({ frame: currentFrame, signature });
                }
            },
            
            /**
             * 获取录制的校验点
             */
            getCheckpoints(): Array<{ frame: number; signature: number }> {
                return [...checkpoints];
            },
            
            /**
             * 验证回放是否与录制一致
             * 
             * @param replayCheckpoints 回放时的校验点
             * @returns 验证结果，包含是否成功和偏差信息
             */
            validateReplay(replayCheckpoints: Array<{ frame: number; signature: number }>): {
                success: boolean;
                firstMismatchFrame?: number;
                recordedSignature?: number;
                replayedSignature?: number;
            } {
                const minLength = Math.min(checkpoints.length, replayCheckpoints.length);
                
                for (let i = 0; i < minLength; i++) {
                    const recorded = checkpoints[i];
                    const replayed = replayCheckpoints[i];
                    
                    if (recorded.frame !== replayed.frame) {
                        return {
                            success: false,
                            firstMismatchFrame: recorded.frame,
                            recordedSignature: recorded.signature,
                            replayedSignature: replayed.signature
                        };
                    }
                    
                    if (recorded.signature !== replayed.signature) {
                        return {
                            success: false,
                            firstMismatchFrame: recorded.frame,
                            recordedSignature: recorded.signature,
                            replayedSignature: replayed.signature
                        };
                    }
                }
                
                return { success: true };
            },
            
            /**
             * 重置录制器
             */
            reset(): void {
                checkpoints.length = 0;
                currentFrame = 0;
            }
        };
    }
}