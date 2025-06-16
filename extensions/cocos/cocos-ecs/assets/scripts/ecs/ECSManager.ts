import { Core } from '@esengine/ecs-framework';
import { Component, _decorator } from 'cc';
import { ExampleGameScene } from './scenes/ExampleGameScene';

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
        
        console.log('🎮 正在初始化ECS框架...');
        
        try {
            // 1. 创建Core实例，启用调试功能
            if (this.debugMode) {
                Core.create({
                    debugConfig: {
                        enabled: true,
                        websocketUrl: 'ws://localhost:8080/ecs-debug',
                        autoReconnect: true,
                        updateInterval: 1000,
                        channels: {
                            entities: true,
                            systems: true,
                            performance: true,
                            components: true,
                            scenes: true
                        }
                    }
                });
                console.log('🔧 ECS调试模式已启用，可在Cocos Creator扩展面板中查看调试信息');
            } else {
                Core.create(false);
            }
            
            // 2. 创建游戏场景
            const gameScene = new ExampleGameScene();
            
            // 3. 设置为当前场景（会自动调用scene.begin()）
            Core.scene = gameScene;
            
            this.isInitialized = true;
            console.log('✅ ECS框架初始化成功！');
            console.log('📖 请查看 assets/scripts/ecs/README.md 了解如何添加组件和系统');
            
        } catch (error) {
            console.error('❌ ECS框架初始化失败:', error);
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
            console.log('🧹 清理ECS框架...');
            // ECS框架会自动处理场景清理
            this.isInitialized = false;
        }
    }
}
