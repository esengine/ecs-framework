import { _decorator, Component, Node, Vec3, Color, MeshRenderer, Material, BoxCollider, geometry, PhysicsSystem, director } from 'cc';
import { SimplePrefabFactory } from './components/SimplePrefabFactory';
import { UnitController } from './components/UnitController';
import { BehaviorTreeManager } from './components/BehaviorTreeManager';

const { ccclass, property } = _decorator;

/**
 * 简化版矿工挖矿演示
 * 核心逻辑：矿工挖矿 → 运输 → 存储 → 重复
 */
@ccclass('MinerDemo')
export class MinerDemo extends Component {
    
    @property
    minerCount: number = 3; // 矿工数量
    
    @property  
    oreCount: number = 8; // 矿石数量
    
    private factory: SimplePrefabFactory = new SimplePrefabFactory();
    private miners: Node[] = [];
    private ores: Node[] = [];
    private warehouse: Node | null = null;
    private ground: Node | null = null;
    
    start() {
        console.log('🎮 启动矿工挖矿演示');
        this.createWorld();
        this.createWarehouse();
        this.createOres();
        this.createMiners();
        this.logGameStatus();
    }
    
    /**
     * 创建游戏世界
     */
    private createWorld() {
        // 创建地面
        this.ground = this.factory.createGround(this.node, new Vec3(0, 0, 0), new Vec3(20, 0.2, 20));
        console.log('🌍 创建游戏世界：20x20地面');
    }
    
    /**
     * 创建仓库
     */
    private createWarehouse() {
        // 在地图中心创建仓库
        this.warehouse = this.factory.createBuilding(
            this.node, 
            new Vec3(0, 1, 0), 
            new Vec3(2, 2, 2), 
            Color.GRAY,
            'warehouse'
        );
        console.log('🏭 创建仓库：位置(0,1,0)');
    }
    
    /**
     * 创建矿石
     */
    private createOres() {
        console.log(`⛏️ 创建${this.oreCount}个矿石`);
        
        for (let i = 0; i < this.oreCount; i++) {
            // 随机分布矿石，避开仓库区域
            let position: Vec3;
            do {
                position = new Vec3(
                    (Math.random() - 0.5) * 16, // -8到8
                    0.5,
                    (Math.random() - 0.5) * 16  // -8到8
                );
            } while (Vec3.distance(position, new Vec3(0, 0.5, 0)) < 4); // 距离仓库至少4米
            
            const ore = this.factory.createResource(
                this.node,
                position,
                new Vec3(0.8, 0.8, 0.8),
                Color.YELLOW,
                'ore'
            );
            
            this.ores.push(ore);
            console.log(`  💎 矿石${i+1}：位置(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
        }
    }
    
    /**
     * 创建矿工
     */
    private createMiners() {
        console.log(`👷 创建${this.minerCount}个矿工`);
        
        for (let i = 0; i < this.minerCount; i++) {
            // 矿工围绕仓库分布
            const angle = (i / this.minerCount) * Math.PI * 2;
            const radius = 3;
            const position = new Vec3(
                Math.cos(angle) * radius,
                1,
                Math.sin(angle) * radius
            );
            
            const miner = this.factory.createUnit(
                this.node,
                position,
                new Vec3(0.8, 0.8, 0.8),
                Color.BLUE,
                'miner'
            );
            
            // 添加矿工控制器
            const unitController = miner.addComponent(UnitController);
            unitController.unitType = 'miner';
            unitController.maxHealth = 100;
            unitController.currentHealth = 100;
            unitController.moveSpeed = 2.0;
            unitController.currentCommand = 'mine'; // 默认挖矿命令
            
            // 添加行为树管理器
            const behaviorManager = miner.addComponent(BehaviorTreeManager);
            
            // 初始化行为树
            behaviorManager.initializeBehaviorTree('miner-ai', unitController);
            
            this.miners.push(miner);
            console.log(`  👷 矿工${i+1}：位置(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
        }
    }
    
    /**
     * 记录游戏状态
     */
    private logGameStatus() {
        console.log('\n📊 游戏状态总览：');
        console.log(`  🏭 仓库：1个`);
        console.log(`  💎 矿石：${this.ores.length}个`);
        console.log(`  👷 矿工：${this.miners.length}个`);
        console.log(`  🎯 游戏目标：矿工自动挖矿并运输到仓库`);
        console.log('\n🎮 游戏逻辑：');
        console.log('  1. 矿工寻找最近的矿石');
        console.log('  2. 移动到矿石位置并挖掘');
        console.log('  3. 携带矿石返回仓库');
        console.log('  4. 存储矿石并重复循环');
    }
    
    /**
     * 获取所有矿石位置（供AI使用）
     */
    public getAllOres(): Node[] {
        return this.ores.filter(ore => ore && ore.isValid);
    }
    
    /**
     * 获取仓库位置（供AI使用）
     */
    public getWarehouse(): Node | null {
        return this.warehouse;
    }
    
    /**
     * 移除已开采的矿石
     */
    public removeOre(ore: Node) {
        const index = this.ores.indexOf(ore);
        if (index > -1) {
            this.ores.splice(index, 1);
            ore.destroy();
            console.log(`💎 矿石已开采，剩余${this.ores.length}个矿石`);
        }
    }
} 