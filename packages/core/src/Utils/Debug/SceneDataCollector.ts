import { ISceneDebugData } from '../../Types';
import { IScene } from '../../ECS/IScene';

/**
 * 场景数据收集器
 * Scene data collector
 *
 * 收集场景的调试信息，通过公共接口访问数据。
 * Collects scene debug information through public interfaces.
 */
export class SceneDataCollector {
    private sceneStartTime: number = Date.now();

    /**
     * 收集场景数据
     * Collect scene data
     *
     * @param scene 场景实例 | Scene instance
     */
    public collectSceneData(scene?: IScene | null): ISceneDebugData {
        if (!scene) {
            return {
                currentSceneName: 'No Scene',
                isInitialized: false,
                sceneRunTime: 0,
                sceneEntityCount: 0,
                sceneSystemCount: 0,
                sceneUptime: 0
            };
        }

        const currentTime = Date.now();
        const runTime = (currentTime - this.sceneStartTime) / 1000;

        // 使用公共接口获取数据 | Use public interface to get data
        const stats = scene.getStats();

        return {
            currentSceneName: scene.name || 'Unnamed Scene',
            isInitialized: true, // 如果 scene 存在，则认为已初始化 | If scene exists, consider initialized
            sceneRunTime: runTime,
            sceneEntityCount: stats.entityCount,
            sceneSystemCount: stats.processorCount,
            sceneUptime: runTime
        };
    }

    /**
     * 设置场景开始时间
     */
    public setSceneStartTime(time: number): void {
        this.sceneStartTime = time;
    }
}
