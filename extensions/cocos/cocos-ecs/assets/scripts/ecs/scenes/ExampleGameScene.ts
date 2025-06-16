import { Scene } from '@esengine/ecs-framework';
import { Entity } from '@esengine/ecs-framework';

// 导入组件
import { PositionComponent } from '../components/PositionComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { HealthComponent } from '../components/HealthComponent';
import { PlayerInputComponent } from '../components/PlayerInputComponent';

// 导入系统
import { MovementSystem } from '../systems/MovementSystem';
import { PlayerInputSystem } from '../systems/PlayerInputSystem';
import { HealthSystem } from '../systems/HealthSystem';

/**
 * 示例游戏场景 - 完整的ECS应用示例
 * 
 * 这个场景展示了：
 * 1. 如何创建和配置各种实体
 * 2. 如何添加和组织系统
 * 3. 如何实现完整的游戏逻辑
 * 4. 如何进行调试和监控
 */
export class ExampleGameScene extends Scene {
    // 场景中的重要实体引用
    private player: Entity | null;
    private enemies: Entity[];
    private gameConfig: {
        maxEnemies: number;
        enemySpawnInterval: number;
        gameArea: { width: number; height: number };
    };
    
    constructor() {
        super();
        // 在构造函数中初始化属性
        this.player = null;
        this.enemies = [];
        this.gameConfig = {
            maxEnemies: 5,
            enemySpawnInterval: 3000, // 3秒生成一个敌人
            gameArea: { width: 800, height: 600 }
        };
    }
    
    /**
     * 场景初始化（构造时调用）
     */
    public initialize(): void {
        super.initialize();
        this.name = "ExampleGameScene";
        console.log("📋 ExampleGameScene 构造完成");
    }
    
    /**
     * 场景开始时的回调（所有构造函数执行完毕后调用）
     */
    public onStart(): void {
        super.onStart();
        
        console.log("🎮 开始初始化示例游戏场景...");
        
        // 1. 添加系统（注意顺序很重要）
        this.setupSystems();
        
        // 2. 创建游戏实体
        this.createGameEntities();
        
        // 3. 设置定时器和事件
        this.setupGameLogic();
        
        console.log("✅ 示例游戏场景初始化完成！");
        this.printSceneInfo();
    }
    
    /**
     * 设置游戏系统
     */
    private setupSystems(): void {
        console.log("🔧 添加游戏系统...");
        
        // 输入系统（最先处理输入）
        this.addEntityProcessor(new PlayerInputSystem());
        
        // 移动系统（处理所有移动逻辑）
        this.addEntityProcessor(new MovementSystem());
        
        // 生命值系统（处理生命值、死亡等）
        this.addEntityProcessor(new HealthSystem());
        
        console.log("✅ 系统添加完成");
    }
    
    /**
     * 创建游戏实体
     */
    private createGameEntities(): void {
        console.log("🏗️ 创建游戏实体...");
        
        // 创建玩家
        this.createPlayer();
        
        // 创建初始敌人
        this.createInitialEnemies();
        
        // 创建环境实体（可选）
        this.createEnvironmentEntities();
        
        console.log("✅ 实体创建完成");
    }
    
    /**
     * 创建玩家实体
     */
    private createPlayer(): void {
        this.player = this.createEntity("Player");
        
        // 添加玩家组件
        this.player.addComponent(new PositionComponent(0, 0, 0));
        this.player.addComponent(new VelocityComponent(0, 0, 0, 250)); // 最大速度250
        this.player.addComponent(new HealthComponent(100, 5)); // 100血，每秒回5血
        this.player.addComponent(new PlayerInputComponent());
        
        console.log("🎯 玩家创建完成 - 使用WASD或方向键移动，空格键攻击");
    }
    
    /**
     * 创建初始敌人
     */
    private createInitialEnemies(): void {
        for (let i = 0; i < 3; i++) {
            this.createEnemy(i);
        }
    }
    
    /**
     * 创建单个敌人
     */
    private createEnemy(index: number): Entity {
        const enemy = this.createEntity(`Enemy_${index}`);
        
        // 随机位置
        const x = (Math.random() - 0.5) * this.gameConfig.gameArea.width;
        const y = (Math.random() - 0.5) * this.gameConfig.gameArea.height;
        
        // 随机速度
        const velocityX = (Math.random() - 0.5) * 100;
        const velocityY = (Math.random() - 0.5) * 100;
        
        // 添加敌人组件
        enemy.addComponent(new PositionComponent(x, y, 0));
        enemy.addComponent(new VelocityComponent(velocityX, velocityY, 0, 150));
        enemy.addComponent(new HealthComponent(50, 0)); // 50血，不回血
        
        // 添加到敌人列表
        this.enemies.push(enemy);
        
        return enemy;
    }
    
    /**
     * 创建环境实体（演示不同类型的实体）
     */
    private createEnvironmentEntities(): void {
        // 创建一些静态的环境对象
        for (let i = 0; i < 5; i++) {
            const obstacle = this.createEntity(`Obstacle_${i}`);
            
            const x = (Math.random() - 0.5) * this.gameConfig.gameArea.width * 0.8;
            const y = (Math.random() - 0.5) * this.gameConfig.gameArea.height * 0.8;
            
            // 只有位置，没有速度和生命值
            obstacle.addComponent(new PositionComponent(x, y, 0));
        }
        
        console.log("🌲 环境实体创建完成");
    }
    
    /**
     * 设置游戏逻辑和定时器
     */
    private setupGameLogic(): void {
        console.log("⚙️ 设置游戏逻辑...");
        
        // 敌人生成定时器
        this.setupEnemySpawner();
        
        // 游戏状态监控
        this.setupGameMonitoring();
        
        console.log("✅ 游戏逻辑设置完成");
    }
    
    /**
     * 设置敌人生成器
     */
    private setupEnemySpawner(): void {
        setInterval(() => {
            if (this.enemies.length < this.gameConfig.maxEnemies) {
                const newEnemy = this.createEnemy(this.enemies.length);
            }
        }, this.gameConfig.enemySpawnInterval);
    }
    
    /**
     * 设置游戏监控
     */
    private setupGameMonitoring(): void {
        // 每10秒清理已死亡的敌人引用
        setInterval(() => {
            this.cleanupDeadEnemies();
        }, 10000);
    }
    
    /**
     * 打印游戏状态（按需调用）
     */
    private printGameStatus(): void {
        const totalEntities = this.entities.count;
        const aliveEnemies = this.enemies.filter(e => !e.isDestroyed).length;
        
        console.log("📊 游戏状态报告:");
        console.log(`   - 总实体数: ${totalEntities}`);
        console.log(`   - 存活敌人: ${aliveEnemies}`);
        
        if (this.player && !this.player.isDestroyed) {
            const playerHealth = this.player.getComponent(HealthComponent);
            const playerPos = this.player.getComponent(PositionComponent);
            console.log(`   - 玩家生命值: ${playerHealth?.currentHealth}/${playerHealth?.maxHealth}`);
            console.log(`   - 玩家位置: (${playerPos?.position.x.toFixed(1)}, ${playerPos?.position.y.toFixed(1)})`);
        }
    }
    
    /**
     * 清理已死亡的敌人引用
     */
    private cleanupDeadEnemies(): void {
        const initialCount = this.enemies.length;
        this.enemies = this.enemies.filter(enemy => !enemy.isDestroyed);
        const removedCount = initialCount - this.enemies.length;
        
        if (removedCount > 0) {
            console.log(`🧹 清理了 ${removedCount} 个已死亡的敌人引用`);
        }
    }
    
    /**
     * 打印场景信息
     */
    private printSceneInfo(): void {
        console.log("\n📋 场景信息:");
        console.log(`   场景名: ${this.name}`);
        console.log(`   实体数: ${this.entities.count}`);
        console.log(`   系统数: ${this.entityProcessors.count}`);
        console.log(`   玩家: ${this.player?.name || '未创建'}`);
        console.log(`   敌人: ${this.enemies.length} 个`);
        console.log("\n🎮 控制说明:");
        console.log("   - WASD 或 方向键: 移动");
        console.log("   - 空格: 攻击/行动");
        console.log("   - ESC: 暂停");
        console.log("\n💡 学习要点:");
        console.log("   1. 观察控制台输出，了解ECS运行过程");
        console.log("   2. 打开调试面板查看性能数据");
        console.log("   3. 尝试修改组件参数观察变化");
        console.log("   4. 查看代码学习ECS设计模式\n");
    }
    
    /**
     * 获取玩家实体（供其他系统使用）
     */
    public getPlayer(): Entity | null {
        return this.player;
    }
    
    /**
     * 获取所有敌人（供其他系统使用）
     */
    public getEnemies(): Entity[] {
        return this.enemies.filter(enemy => !enemy.isDestroyed);
    }
    
    /**
     * 游戏重置方法
     */
    public resetGame(): void {
        console.log("🔄 重置游戏...");
        
        // 销毁所有实体
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
        
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies = [];
        
        // 重新创建实体
        this.createGameEntities();
        
        console.log("✅ 游戏重置完成");
    }
    
    /**
     * 场景卸载时调用
     */
    public unload(): void {
        console.log("🧹 清理示例游戏场景...");
        
        // 清理引用
        this.player = null;
        this.enemies = [];
        
        super.unload();
        console.log("✅ 场景清理完成");
    }
} 