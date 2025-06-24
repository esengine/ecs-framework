import { _decorator, Component, resources, JsonAsset } from 'cc';
import { BehaviorTree, BehaviorTreeBuilder, Blackboard, BehaviorTreeJSONConfig } from '@esengine/ai';
import { UnitController } from './UnitController';

const { ccclass, property } = _decorator;

/**
 * 执行上下文接口
 */
interface GameExecutionContext {
    blackboard?: Blackboard;
    unitController: UnitController;
    gameObject: any;
    [key: string]: any;
}

/**
 * 行为树管理器 - 使用@esengine/ai包管理行为树
 */
@ccclass('BehaviorTreeManager')
export class BehaviorTreeManager extends Component {
    
    @property
    debugMode: boolean = true;
    
    @property
    tickInterval: number = 0.1; // 行为树更新间隔（秒）
    
    private behaviorTree: BehaviorTree<GameExecutionContext> | null = null;
    private blackboard: Blackboard | null = null;
    private context: GameExecutionContext | null = null;
    private isLoaded: boolean = false;
    private isRunning: boolean = false;
    private lastTickTime: number = 0;
    private unitController: UnitController | null = null;
    private currentBehaviorTreeName: string = '';
    
    /**
     * 初始化行为树
     */
    async initializeBehaviorTree(behaviorTreeName: string, unitController: UnitController) {
        this.currentBehaviorTreeName = behaviorTreeName;
        this.unitController = unitController;
        
        try {
            await this.loadBehaviorTree(behaviorTreeName);
            this.setupBlackboard();
            this.isLoaded = true;
            this.isRunning = true;
            console.log(`行为树初始化成功: ${behaviorTreeName}`);
        } catch (error) {
            console.error(`行为树初始化失败: ${behaviorTreeName}`, error);
        }
    }
    
    /**
     * 加载行为树文件
     */
    private async loadBehaviorTree(behaviorTreeName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const jsonPath = `${behaviorTreeName}.bt`;
            
            resources.load(jsonPath, JsonAsset, (err, asset) => {
                if (err) {
                    console.error(`加载行为树文件失败: ${jsonPath}`, err);
                    reject(err);
                    return;
                }
                
                try {
                    const behaviorTreeData = asset.json as BehaviorTreeJSONConfig;
                    
                    // 创建执行上下文
                    this.blackboard = new Blackboard();
                    this.context = {
                        blackboard: this.blackboard,
                        unitController: this.unitController!,
                        gameObject: this.node
                    };
                    
                    // 从JSON数据创建行为树
                    const buildResult = BehaviorTreeBuilder.fromBehaviorTreeConfig(behaviorTreeData, this.context);
                    this.behaviorTree = buildResult.tree as BehaviorTree<GameExecutionContext>;
                    this.blackboard = buildResult.blackboard;
                    
                    resolve();
                } catch (parseError) {
                    console.error(`创建行为树失败: ${jsonPath}`, parseError);
                    reject(parseError);
                }
            });
        });
    }
    
    /**
     * 设置黑板基础信息
     */
    private setupBlackboard() {
        if (!this.unitController || !this.blackboard) return;
        
        // 设置单位基础信息
        this.blackboard.setValue('entityName', this.node.name);
        this.blackboard.setValue('unitType', this.unitController.unitType);
        this.blackboard.setValue('maxHealth', this.unitController.maxHealth);
        this.blackboard.setValue('currentHealth', this.unitController.currentHealth);
        this.blackboard.setValue('moveSpeed', this.unitController.moveSpeed);
        this.blackboard.setValue('attackRange', this.unitController.attackRange);
        this.blackboard.setValue('attackDamage', this.unitController.attackDamage);
        this.blackboard.setValue('attackCooldown', this.unitController.attackCooldown);
        
        // 设置时间信息
        this.blackboard.setValue('currentTime', Date.now() / 1000);
        this.blackboard.setValue('deltaTime', 0.016);
        this.blackboard.setValue('worldPosition', this.node.worldPosition);
        
        // 设置初始状态
        this.blackboard.setValue('currentCommand', 'idle');
        this.blackboard.setValue('hasTarget', false);
        this.blackboard.setValue('isSelected', false);
        
        // 设置单位控制器引用，供行为树节点使用
        this.blackboard.setValue('unitController', this.unitController);
        this.blackboard.setValue('gameObject', this.node);
    }
    
    /**
     * 更新黑板值
     */
    updateBlackboardValue(key: string, value: any) {
        if (this.blackboard) {
            this.blackboard.setValue(key, value);
        }
    }
    
    /**
     * 获取黑板值
     */
    getBlackboardValue(key: string): any {
        return this.blackboard?.getValue(key);
    }
    
    /**
     * 获取黑板
     */
    getBlackboard(): Blackboard | null {
        return this.blackboard;
    }
    
    /**
     * 获取行为树
     */
    getBehaviorTree(): BehaviorTree<GameExecutionContext> | null {
        return this.behaviorTree;
    }
    
    /**
     * 更新行为树
     */
    update(deltaTime: number) {
        if (!this.isLoaded || !this.isRunning || !this.behaviorTree || !this.blackboard) return;
        
        // 控制更新频率
        this.lastTickTime += deltaTime;
        if (this.lastTickTime < this.tickInterval) return;
        
        this.lastTickTime = 0;
        
        // 更新黑板中的时间信息
        this.blackboard.setValue('deltaTime', deltaTime);
        this.blackboard.setValue('currentTime', Date.now() / 1000);
        this.blackboard.setValue('worldPosition', this.node.worldPosition);
        
        // 更新单位状态信息
        if (this.unitController) {
            this.blackboard.setValue('currentHealth', this.unitController.currentHealth);
            this.blackboard.setValue('healthPercentage', this.unitController.currentHealth / this.unitController.maxHealth);
            this.blackboard.setValue('isLowHealth', this.unitController.currentHealth < this.unitController.maxHealth * 0.3);
            this.blackboard.setValue('currentCommand', this.unitController.currentCommand);
            this.blackboard.setValue('isSelected', this.unitController.isSelected);
            this.blackboard.setValue('targetPosition', this.unitController.targetPosition);
            this.blackboard.setValue('targetNode', this.unitController.targetNode);
            
            // 更新距离信息
            if (this.unitController.targetPosition) {
                const distance = this.node.worldPosition.subtract(this.unitController.targetPosition).length();
                this.blackboard.setValue('distanceToTarget', distance);
                this.blackboard.setValue('isInAttackRange', distance <= this.unitController.attackRange);
                this.blackboard.setValue('isCloseToTarget', distance <= 1.0);
            }
            
            // 更新状态标志
            this.blackboard.setValue('isIdle', this.unitController.currentCommand === 'idle');
            this.blackboard.setValue('isMoving', this.unitController.currentCommand === 'move');
            this.blackboard.setValue('isAttacking', this.unitController.currentCommand === 'attack');
            this.blackboard.setValue('isGathering', this.unitController.currentCommand === 'gather');
            this.blackboard.setValue('isPatrolling', this.unitController.currentCommand === 'patrol');
        }
        
        // 执行行为树
        try {
            this.behaviorTree.tick(deltaTime);
            if (this.debugMode && Math.random() < 0.01) { // 1%的概率打印调试信息
                console.log(`行为树执行完成, 单位: ${this.node.name}`);
            }
        } catch (error) {
            console.error(`行为树执行错误:`, error);
        }
    }
    
    /**
     * 暂停行为树
     */
    pause() {
        this.isRunning = false;
    }
    
    /**
     * 恢复行为树
     */
    resume() {
        if (this.isLoaded) {
            this.isRunning = true;
        }
    }
    
    /**
     * 停止行为树
     */
    stop() {
        this.isRunning = false;
    }
    
    /**
     * 重新加载行为树
     */
    async reloadBehaviorTree() {
        if (this.currentBehaviorTreeName && this.unitController) {
            this.stop();
            await this.initializeBehaviorTree(this.currentBehaviorTreeName, this.unitController);
        }
    }
    
    /**
     * 重置行为树
     */
    reset() {
        if (this.behaviorTree) {
            this.behaviorTree.reset();
        }
    }
    
    onDestroy() {
        this.stop();
        this.behaviorTree = null;
        this.blackboard = null;
        this.context = null;
    }
} 