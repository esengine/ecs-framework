import { Core } from '@esengine/ecs-framework';
import { Component, _decorator } from 'cc';
import { GameScene } from './scenes/GameScene';

const { ccclass, property } = _decorator;

/**
 * ECS管理器 - Cocos Creator组件
 * 将此组件添加到场景中的任意节点上即可启动ECS框架
 * 
 * 使用说明：
 * 1. 在Cocos Creator场景中创建一个空节点
 * 2. 将此ECSManager组件添加到该节点
 * 3. 运行场景即可自动启动ECS框架
 */
@ccclass('ECSManager')
export class ECSManager extends Component {
    
    @property({
        tooltip: '是否启用调试模式（建议开发阶段开启）'
    })
    public debugMode: boolean = true;
    
    private isInitialized: boolean = false;
    
    /**
     * 组件启动时初始化ECS
     */
    start() {
        this.initializeECS();
    }
    
    /**
     * 初始化ECS框架
     */
    private initializeECS(): void {
        if (this.isInitialized) return;
        
        // ECS框架初始化开始
        
        try {
            // 1. 创建Core实例，启用调试功能
            if (this.debugMode) {
                Core.create({
                    debugConfig: {
                        enabled: true,
                        websocketUrl: 'ws://localhost:8080',
                        autoReconnect: true,
                        updateInterval: 100,
                        debugFrameRate: 30,
                        channels: {
                            entities: true,
                            systems: true,
                            performance: true,
                            components: true,
                            scenes: true
                        }
                    }
                });
                // ECS调试模式已启用
            } else {
                Core.create(false);
            }
            
            // 2. 创建游戏场景
            const gameScene = new GameScene();
            
            // 3. 设置为当前场景（会自动调用scene.begin()）
            Core.scene = gameScene;
            
            this.isInitialized = true;
            // ECS框架初始化完成
            
        } catch (error) {
            console.error('ECS框架初始化失败:', error);
        }
    }
    
    /**
     * 每帧更新ECS框架
     */
    update(deltaTime: number) {
        if (this.isInitialized) {
            // 更新ECS核心系统
            Core.update(deltaTime);
        }
    }
    
    /**
     * 组件销毁时清理ECS
     */
    onDestroy() {
        if (this.isInitialized) {
            // ECS框架清理
            this.isInitialized = false;
        }
    }
}
