import { Scene } from '@esengine/ecs-framework';

/**
 * 游戏场景
 * 
 * 这是您的主游戏场景。在这里可以：
 * - 添加游戏系统
 * - 创建初始实体
 * - 设置场景参数
 */
export class GameScene extends Scene {
    
    /**
     * 场景初始化
     * 在场景创建时调用，用于设置基础配置
     */
    public initialize(): void {
        super.initialize();
        
        // 设置场景名称
        this.name = "MainGameScene";
        
        console.log('🎯 游戏场景已创建');
        
        // TODO: 在这里添加您的游戏系统
        // 例如：this.addEntityProcessor(new MovementSystem());
        
        // TODO: 在这里创建初始实体
        // 例如：this.createEntity("Player");
    }
    
    /**
     * 场景开始运行
     * 在场景开始时调用，用于执行启动逻辑
     */
    public onStart(): void {
        super.onStart();
        
        console.log('🚀 游戏场景已启动');
        
        // TODO: 在这里添加场景启动逻辑
        // 例如：创建UI、播放音乐、初始化游戏状态等
    }
    
    /**
     * 场景卸载
     * 在场景结束时调用，用于清理资源
     */
    public unload(): void {
        console.log('🛑 游戏场景已结束');
        
        // TODO: 在这里添加清理逻辑
        // 例如：清理缓存、释放资源等
        
        super.unload();
    }
}
