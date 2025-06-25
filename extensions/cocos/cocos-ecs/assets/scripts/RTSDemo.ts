import { _decorator, Component, Node, Vec3, Color } from 'cc';
import { SimplePrefabFactory } from './components/SimplePrefabFactory';
import { BehaviorTreeComponent } from './components/BehaviorTreeComponent';
import { StatusUIManager } from './components/StatusUIManager';

const { ccclass, property } = _decorator;

/**
 * 矿工AI演示场景
 */
@ccclass('SimpleMinerDemo')
export class SimpleMinerDemo extends Component {
    
    @property
    minerCount: number = 1;
    
    @property  
    goldMineCount: number = 3;
    
    private miners: Node[] = [];
    private goldMines: Node[] = [];
    private warehouse: Node | null = null;
    private ground: Node | null = null;
    private totalOresCollected: number = 0;
    private warehouseUI: any = null;
    
    start() {
        this.createWorld();
        this.createWarehouse();
        this.createGoldMines();
        this.createMiners();
    }
    
    private createWorld() {
        this.ground = SimplePrefabFactory.createGround(new Vec3(20, 0.2, 20));
        this.node.addChild(this.ground);
        this.ground.setWorldPosition(new Vec3(0, 0, 0));
    }
    
    private createWarehouse() {
        this.warehouse = SimplePrefabFactory.createBuilding('Warehouse', new Vec3(2, 2, 2), Color.GRAY);
        this.node.addChild(this.warehouse);
        this.warehouse.setWorldPosition(new Vec3(0, 1, 0));
        this.createWarehouseUI();
    }
    
    private createGoldMines() {
        for (let i = 0; i < this.goldMineCount; i++) {
            const angle = (i / this.goldMineCount) * Math.PI * 2;
            const radius = 6 + Math.random() * 2;
            const position = new Vec3(
                Math.cos(angle) * radius,
                0.8,
                Math.sin(angle) * radius
            );
            
            const goldMine = SimplePrefabFactory.createResource(`GoldMine_${i + 1}`, Color.YELLOW);
            this.node.addChild(goldMine);
            goldMine.setWorldPosition(position);
            goldMine.setScale(new Vec3(1.2, 1.2, 1.2));
            this.goldMines.push(goldMine);
        }
    }
    
    private createMiners() {
        for (let i = 0; i < this.minerCount; i++) {
            const angle = (i / this.minerCount) * Math.PI * 2;
            const radius = 3;
            const position = new Vec3(
                Math.cos(angle) * radius,
                1,
                Math.sin(angle) * radius
            );
            
            const miner = SimplePrefabFactory.createUnit(`Miner_${i + 1}`, Color.BLUE);
            this.node.addChild(miner);
            miner.setWorldPosition(position);
            
            const behaviorTree = miner.addComponent(BehaviorTreeComponent);
            behaviorTree.behaviorTreeFile = 'miner-stamina-ai.bt';
            behaviorTree.debugMode = true;
            
            this.scheduleOnce(() => {
                const blackboard = behaviorTree.getBlackboard();
                if (blackboard) {
                    blackboard.setValue('homePosition', position.clone());
                }
            }, 0.5);
            
            this.miners.push(miner);
        }
    }
    
    public getAllGoldMines(): Node[] {
        return this.goldMines.filter(mine => mine && mine.isValid);
    }
    
    public getWarehouse(): Node | null {
        return this.warehouse;
    }
    
    public mineGoldOre(miner: Node): boolean {
        this.totalOresCollected++;
        this.updateWarehouseUI();
        return true;
    }
    
    public getTotalOresCollected(): number {
        return this.totalOresCollected;
    }
    
    private createWarehouseUI() {
        if (!this.warehouse) return;
        
        this.warehouseUI = StatusUIManager.createWarehouseUI(this.warehouse);
        if (this.warehouseUI) {
            this.updateWarehouseUI();
        }
    }
    
    private updateWarehouseUI() {
        if (this.warehouseUI && this.warehouseUI.warehouseCountLabel) {
            this.warehouseUI.warehouseCountLabel.string = `🏭 总存储: ${this.totalOresCollected}`;
        }
    }
    
    onDestroy() {
        this.unscheduleAllCallbacks();
    }
} 