import { Scene } from '@esengine/ecs-framework';
import { Color } from 'cc';
import { MovementSystem, HealthSystem, RandomMovementSystem } from '../systems';
import { Transform, Health, Velocity, Renderer } from '../components';

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
        
        // 添加游戏系统
        this.addEntityProcessor(new MovementSystem());
        this.addEntityProcessor(new HealthSystem());
        this.addEntityProcessor(new RandomMovementSystem());
        
        // 创建测试实体
        this.createTestEntities();
    }
    
    /**
     * 创建测试实体
     */
    private createTestEntities(): void {
        console.log('🚀 开始创建测试实体...');
        
        // 创建玩家实体
        const player = this.createEntity("Player");
        player.addComponent(new Transform());
        player.addComponent(new Health(150));
        player.addComponent(new Velocity());
        player.addComponent(new Renderer("player", new Color(0, 255, 0, 255)));
        
        const playerTransform = player.getComponent(Transform);
        const playerHealth = player.getComponent(Health);
        if (playerTransform) {
            playerTransform.setPosition(0, 0);
            playerTransform.speed = 120;
        }
        if (playerHealth) {
            playerHealth.regenRate = 5; // 每秒回复5点生命值
        }
        
        // 创建一些敌人实体
        for (let i = 0; i < 10; i++) {
            const enemy = this.createEntity(`Enemy_${i}`);
            enemy.addComponent(new Transform());
            enemy.addComponent(new Health(80));
            enemy.addComponent(new Velocity());
            enemy.addComponent(new Renderer("enemy", new Color(255, 0, 0, 255)));
            
            const enemyTransform = enemy.getComponent(Transform);
            const enemyVelocity = enemy.getComponent(Velocity);
            if (enemyTransform) {
                // 随机位置
                const x = (Math.random() - 0.5) * 800;
                const y = (Math.random() - 0.5) * 600;
                enemyTransform.setPosition(x, y);
                enemyTransform.speed = 80;
            }
            if (enemyVelocity) {
                enemyVelocity.maxSpeed = 120;
                enemyVelocity.friction = 0.95;
            }
        }
        
        // 创建一些中性实体（只移动，无生命值）
        for (let i = 0; i < 5; i++) {
            const neutral = this.createEntity(`Neutral_${i}`);
            neutral.addComponent(new Transform());
            neutral.addComponent(new Velocity());
            neutral.addComponent(new Renderer("neutral", new Color(255, 255, 0, 255)));
            
            const neutralTransform = neutral.getComponent(Transform);
            const neutralVelocity = neutral.getComponent(Velocity);
            if (neutralTransform) {
                const x = (Math.random() - 0.5) * 600;
                const y = (Math.random() - 0.5) * 400;
                neutralTransform.setPosition(x, y);
                neutralTransform.speed = 60;
            }
            if (neutralVelocity) {
                neutralVelocity.maxSpeed = 80;
                neutralVelocity.friction = 0.99;
            }
        }
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
