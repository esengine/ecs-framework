import { _decorator, Component, resources, JsonAsset, Vec3 } from 'cc';
import { BehaviorTree, BehaviorTreeBuilder, Blackboard, BehaviorTreeJSONConfig, ExecutionContext, EventRegistry, ActionResult } from '@esengine/ai';
import { UnitController } from './UnitController';
import { RTSBehaviorHandler } from './RTSBehaviorHandler';

const { ccclass, property } = _decorator;

/**
 * 游戏执行上下文接口
 * 继承框架的ExecutionContext，添加游戏特定的属性
 */
interface GameExecutionContext extends ExecutionContext {
    unitController: UnitController;
    gameObject: any;
    eventRegistry?: EventRegistry;
    // 确保继承索引签名
    [key: string]: unknown;
}

/**
 * 行为树管理器 - 使用@esengine/ai包管理行为树
 */
@ccclass('BehaviorTreeManager')
export class BehaviorTreeManager extends Component {
    
    @property
    debugMode: boolean = true;
    
    @property
    tickInterval: number = 0.1; // 行为树更新间隔（秒）- 10fps更新频率，平衡性能和响应性
    
    private behaviorTree: BehaviorTree<GameExecutionContext> | null = null;
    private blackboard: Blackboard | null = null;
    private context: GameExecutionContext | null = null;
    private eventRegistry: EventRegistry | null = null;
    private isLoaded: boolean = false;
    private isRunning: boolean = false;
    private lastTickTime: number = 0;
    private unitController: UnitController | null = null;
    private currentBehaviorTreeName: string = '';
    private behaviorHandler: RTSBehaviorHandler | null = null;
    
    /**
     * 初始化行为树
     */
    async initializeBehaviorTree(behaviorTreeName: string, unitController: UnitController) {
        this.currentBehaviorTreeName = behaviorTreeName;
        this.unitController = unitController;
        
        // 获取RTSBehaviorHandler组件
        this.behaviorHandler = this.getComponent(RTSBehaviorHandler);
        if (!this.behaviorHandler) {
            console.error(`BehaviorTreeManager: 未找到RTSBehaviorHandler组件 - ${this.node.name}`);
            return;
        }
        
        try {
            await this.loadBehaviorTree(behaviorTreeName);
            this.setupBlackboard();
            this.isLoaded = true;
            this.isRunning = true;

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
                    this.eventRegistry = this.createEventRegistry();
                    this.context = {
                        blackboard: this.blackboard,
                        unitController: this.unitController!,
                        gameObject: this.node,
                        eventRegistry: this.eventRegistry
                    } as GameExecutionContext;
                    
                    // 从JSON数据创建行为树
                    const buildResult = BehaviorTreeBuilder.fromBehaviorTreeConfig<GameExecutionContext>(behaviorTreeData, this.context);
                    this.behaviorTree = buildResult.tree;
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
     * 创建事件注册表
     */
    private createEventRegistry(): EventRegistry {
        const registry = new EventRegistry();
        
        // 注册体力系统矿工行为事件处理器
        const eventHandlers = {
            // 矿工体力系统核心行为
            'mine-gold-ore': (context: any, params?: any) => this.callBehaviorHandler('onMineGoldOre', params),
            'store-ore': (context: any, params?: any) => this.callBehaviorHandler('onStoreOre', params),
            'go-home-rest': (context: any, params?: any) => this.callBehaviorHandler('onGoHomeRest', params),
            'recover-stamina': (context: any, params?: any) => this.callBehaviorHandler('onRecoverStamina', params),
            'idle-behavior': (context: any, params?: any) => this.callBehaviorHandler('onIdleBehavior', params)
        };
        
        // 将事件处理器注册到EventRegistry
        Object.entries(eventHandlers).forEach(([eventName, handler]) => {
            registry.registerAction(eventName, handler);
        });
        
        return registry;
    }
    
    /**
     * 调用行为处理器的方法
     */
    private callBehaviorHandler(methodName: string, params: any = {}): ActionResult {
        if (!this.behaviorHandler) {
            console.error(`BehaviorTreeManager: RTSBehaviorHandler未初始化 - ${this.node.name}`);
            return 'failure';
        }
        
        try {
            // 直接调用RTSBehaviorHandler的方法
            const method = (this.behaviorHandler as any)[methodName];
            if (typeof method === 'function') {
                const result = method.call(this.behaviorHandler, params);
                return result || 'success'; // 确保有返回值
            } else {
                console.error(`BehaviorTreeManager: 方法不存在: ${methodName}`);
                return 'failure';
            }
        } catch (error) {
            console.error(`BehaviorTreeManager: 调用方法失败: ${methodName}`, error);
            return 'failure';
        }
    }
    
    /**
     * 设置黑板基础信息
     */
    private setupBlackboard() {
        if (!this.unitController || !this.blackboard) return;
        
        // 设置矿工基础信息
        this.blackboard.setValue('unitType', this.unitController.unitType);
        this.blackboard.setValue('currentHealth', this.unitController.currentHealth);
        this.blackboard.setValue('maxHealth', this.unitController.maxHealth);
        this.blackboard.setValue('currentCommand', 'mine');
        this.blackboard.setValue('hasOre', false);
        this.blackboard.setValue('hasTarget', false);
        this.blackboard.setValue('targetPosition', null);
        this.blackboard.setValue('isMoving', false);
        
        // 设置体力系统信息
        this.blackboard.setValue('stamina', this.unitController.currentStamina);
        this.blackboard.setValue('maxStamina', this.unitController.maxStamina);
        this.blackboard.setValue('staminaPercentage', this.unitController.currentStamina / this.unitController.maxStamina);
        this.blackboard.setValue('isLowStamina', this.unitController.currentStamina < this.unitController.maxStamina * 0.2);
        this.blackboard.setValue('isResting', false);
        this.blackboard.setValue('homePosition', this.unitController.homePosition);
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
        
        // 更新矿工状态信息
        if (this.unitController) {
            // 基础属性
            this.blackboard.setValue('currentHealth', this.unitController.currentHealth);
            this.blackboard.setValue('currentCommand', this.unitController.currentCommand);
            this.blackboard.setValue('hasTarget', this.unitController.targetPosition && !this.unitController.targetPosition.equals(Vec3.ZERO));
            this.blackboard.setValue('targetPosition', this.unitController.targetPosition);
            this.blackboard.setValue('isMoving', this.unitController.targetPosition && !this.unitController.targetPosition.equals(Vec3.ZERO));
            
            // 体力系统状态
            this.blackboard.setValue('stamina', this.unitController.currentStamina);
            this.blackboard.setValue('maxStamina', this.unitController.maxStamina);
            this.blackboard.setValue('staminaPercentage', this.unitController.currentStamina / this.unitController.maxStamina);
            this.blackboard.setValue('isLowStamina', this.unitController.currentStamina < this.unitController.maxStamina * 0.2);
            this.blackboard.setValue('homePosition', this.unitController.homePosition);
        }
        
        // 执行行为树
        try {
            this.behaviorTree.tick(deltaTime);
        } catch (error) {
            console.error(`行为树执行错误: ${this.node.name}`, error);
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