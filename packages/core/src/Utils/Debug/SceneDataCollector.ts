import {ISceneDebugData} from "../../Types";
import {IScene} from "../../ECS/IScene";

/**
 * 场景数据收集器
 */
export class SceneDataCollector {
    private sceneStartTime: number = Date.now();

    /**
     * 收集场景数据
     * @param scene 场景实例
     */
    public collectSceneData(scene?: IScene | null): ISceneDebugData {
        if (!scene) {
            return {
                currentSceneName: "No Scene",
                isInitialized: false,
                sceneRunTime: 0,
                sceneEntityCount: 0,
                sceneSystemCount: 0,
                sceneMemory: 0,
                sceneUptime: 0
            };
        }

        const currentTime = Date.now();
        const runTime = (currentTime - this.sceneStartTime) / 1000;

        const entityList = (scene as any).entities;
        const entityProcessors = (scene as any).entityProcessors;

        return {
            currentSceneName: (scene as any).name || "Unnamed Scene",
            isInitialized: (scene as any)._didSceneBegin || false,
            sceneRunTime: runTime,
            sceneEntityCount: entityList?.buffer?.length || 0,
            sceneSystemCount: entityProcessors?.processors?.length || 0,
            sceneMemory: 0, // TODO: 计算实际场景内存
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
