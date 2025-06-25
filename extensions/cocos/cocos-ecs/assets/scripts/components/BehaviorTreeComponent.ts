import { Node, resources, JsonAsset, Component, _decorator, Vec3, tween, instantiate, Prefab } from 'cc';
import { BehaviorTree, BehaviorTreeBuilder, Blackboard, TaskStatus, BehaviorTreeJSONConfig, EventRegistry, IBehaviorTreeContext, ActionResult } from '@esengine/ai';
import { MinerStatusUI } from './MinerStatusUI';
import { StatusUIManager } from './StatusUIManager';

const { ccclass, property } = _decorator;

/**
 * 行为树组件 - 纯Cocos Creator组件，管理单个节点的行为树
 */
@ccclass('BehaviorTreeComponent')
export class BehaviorTreeComponent extends Component {
    
    @property
    behaviorTreeFile: string = '';
    
    @property
    autoStart: boolean = true;
    
    @property
    debugMode: boolean = false;
    
    @property
    showStatusUI: boolean = true;
    
    @property(Prefab)
    statusUIPrefab: Prefab | null = null;
    
    private behaviorTree: BehaviorTree<any> | null = null;
    private statusUI: MinerStatusUI | null = null;
    private blackboard: Blackboard | null = null;
    private context: any = null;
    private eventRegistry: EventRegistry | null = null;
    private isLoaded: boolean = false;
    private isRunning: boolean = false;
    
    private actionStates: Map<string, {
        isExecuting: boolean;
        startTime: number;
        duration: number;
    }> = new Map();
    
    start() {
        if (this.autoStart && this.behaviorTreeFile) {
            this.initialize();
        }
        
        if (this.showStatusUI) {
            this.createStatusUI();
        }
    }
    
    /**
     * 初始化行为树
     */
    async initialize() {
        if (!this.behaviorTreeFile) {
            console.error(`[${this.node.name}] 行为树文件路径未设置`);
            return;
        }
        
        try {
            await this.loadBehaviorTree();
            this.isLoaded = true;
            this.isRunning = true;
            

        } catch (error) {
            console.error(`[${this.node.name}] 行为树组件初始化失败: ${this.behaviorTreeFile}`, error);
        }
    }
    
    /**
     * 加载行为树文件
     */
    private async loadBehaviorTree(): Promise<void> {
        return new Promise((resolve, reject) => {
            let jsonPath = this.behaviorTreeFile;
            resources.load(jsonPath, JsonAsset, (err, asset) => {
                if (err) {
                    console.error(`[${this.node.name}] 加载行为树文件失败: ${jsonPath}`, err);
                    reject(err);
                    return;
                }
                
                try {
                    const treeData = asset.json as BehaviorTreeJSONConfig;
                    this.buildBehaviorTree(treeData);
                    resolve();
                } catch (buildError) {
                    console.error(`[${this.node.name}] 构建行为树失败: ${jsonPath}`, buildError);
                    reject(buildError);
                }
            });
        });
    }
    
    /**
     * 构建行为树
     */
    private buildBehaviorTree(treeData: BehaviorTreeJSONConfig) {
        // 创建事件注册表并注册基础动作
        this.eventRegistry = new EventRegistry();
        this.setupEventHandlers();
        
        // 创建基础执行上下文
        const baseContext = {
            node: this.node,
            component: this,
            eventRegistry: this.eventRegistry
        };
        
        // 使用@esengine/ai的BehaviorTreeBuilder构建行为树
        const result = BehaviorTreeBuilder.fromBehaviorTreeConfig(treeData, baseContext);
        this.behaviorTree = result.tree;
        this.blackboard = result.blackboard;
        this.context = result.context;
        
        // 初始化黑板变量
        this.initializeBlackboard();
    }

    /**
     * 设置事件处理器 - 根据行为树文件中实际使用的事件名称注册
     */
    private setupEventHandlers() {
        if (!this.eventRegistry) return;

        // 根据miner-stamina-ai.bt.json中的实际事件名称注册处理器
        this.eventRegistry.registerAction('go-home-rest', (context, params) => {
            return this.handleGoHomeRest(context, params);
        });

        this.eventRegistry.registerAction('recover-stamina', (context, params) => {
            return this.handleRecoverStamina(context, params);
        });

        this.eventRegistry.registerAction('store-ore', (context, params) => {
            return this.handleStoreOre(context, params);
        });

        this.eventRegistry.registerAction('mine-gold-ore', (context, params) => {
            return this.handleMineGoldOre(context, params);
        });

        this.eventRegistry.registerAction('idle-behavior', (context, params) => {
            return this.handleIdleBehavior(context, params);
        });
    }

    /**
     * 初始化黑板变量 - 简化版本
     */
    private initializeBlackboard() {
        if (!this.blackboard) return;
        
        // 简单初始化矿工状态
        this.blackboard.setValue('stamina', 100);
        this.blackboard.setValue('staminaPercentage', 1.0);
        this.blackboard.setValue('isLowStamina', false);
        this.blackboard.setValue('hasOre', false);
        this.blackboard.setValue('isResting', false);
        this.blackboard.setValue('homePosition', this.node.worldPosition);
    }


    
    /**
     * 创建状态UI
     */
    private createStatusUI() {
        if (!this.statusUIPrefab) {
            this.createSimpleStatusUI();
            return;
        }
        
        const uiNode = instantiate(this.statusUIPrefab);
        const canvas = this.node.scene?.getChildByName('Canvas');
        if (canvas) {
            canvas.addChild(uiNode);
            this.statusUI = uiNode.getComponent(MinerStatusUI);
            if (this.statusUI) {
                this.statusUI.setFollowTarget(this.node);
            }
        }
    }
    
    private createSimpleStatusUI() {
        
        this.statusUI = StatusUIManager.createStatusUIForMiner(this.node);
        if (!this.statusUI) {
            console.warn(`[${this.node.name}] 状态UI创建失败`);
        }
    }
    
    /**
     * 更新状态UI显示
     */
    private updateStatusUI() {
        if (!this.statusUI || !this.blackboard) return;
        
        const stamina = this.blackboard.getValue('stamina') || 0;
        const maxStamina = this.blackboard.getValue('maxStamina') || 100;
        const hasOre = this.blackboard.getValue('hasOre') || false;
        const isResting = this.blackboard.getValue('isResting') || false;
        
        // 更新体力
        this.statusUI.updateStamina(stamina, maxStamina);
        
        // 更新状态文本
        let status = '';
        if (isResting) {
            status = '😴休息中';
        } else if (hasOre) {
            status = '🚚运输中';
        } else {
            status = '⛏️挖矿中';
        }
        this.statusUI.updateStatus(status);
        
        // 获取仓库矿石总数
        const gameManager = this.node.parent?.getComponent('SimpleMinerDemo');
        const warehouseTotal = (gameManager as any)?.getTotalOresCollected() || 0;
        
        // 更新矿石数量显示
        this.statusUI.updateOreCount(hasOre, warehouseTotal);
        
        // 更新动作进度
        this.updateActionProgressUI();
    }
    
    /**
     * 更新动作进度UI
     */
    private updateActionProgressUI() {
        if (!this.statusUI) return;
        
        let actionName = '';
        let progress = 0;
        
        // 检查当前正在执行的动作
        for (const [key, state] of this.actionStates.entries()) {
            if (state.isExecuting) {
                const elapsed = Date.now() - state.startTime;
                progress = Math.min(elapsed / state.duration, 1.0);
                
                switch (key) {
                    case 'mine-gold-ore':
                        actionName = '⛏️ 挖掘中';
                        break;
                    case 'store-ore':
                        actionName = '📦 存储中';
                        break;
                    case 'recover-stamina':
                        actionName = '💤 恢复体力';
                        break;
                    default:
                        actionName = key;
                }
                break; // 只显示第一个正在执行的动作
            }
        }
        
        // 如果没有正在执行的动作，清空进度显示
        this.statusUI.updateActionProgress(actionName, progress);
    }

    // ==================== 行为树事件处理器 ====================

    /**
     * 清理动作状态 - 当动作被中止时调用
     */
    private clearActionState(actionKey: string) {
        if (this.actionStates.has(actionKey)) {
            this.actionStates.delete(actionKey);

        }
    }

    /**
     * 回家休息 - 简化版本
     */
    private handleGoHomeRest(context: any, params: any): ActionResult {
        const blackboard = this.blackboard;
        if (!blackboard) return 'failure';

        // 清理其他动作状态
        this.clearActionState('mine-gold-ore');
        this.clearActionState('store-ore');

        // 回到出生点休息
        const homePos = blackboard.getValue('homePosition') || this.node.worldPosition;
        this.moveToPosition(homePos, 2.0);
        blackboard.setValue('isResting', true);
        

        return 'success';
    }

    /**
     * 恢复体力 - 优化版本，缓慢恢复
     */
    private handleRecoverStamina(context: any, params: any): ActionResult {
        const blackboard = this.blackboard;
        if (!blackboard) return 'failure';

        const actionKey = 'recover-stamina';
        const currentTime = Date.now();
        
        // 初始化动作状态
        if (!this.actionStates.has(actionKey)) {
            this.actionStates.set(actionKey, {
                isExecuting: true,
                startTime: currentTime,
                duration: 2000 // 2秒恢复一次
            });
            // 设置休息状态，确保不会被其他任务中断
            blackboard.setValue('isResting', true);

            return 'running';
        }

        const actionState = this.actionStates.get(actionKey)!;
        const elapsed = currentTime - actionState.startTime;

        // 检查是否到了恢复时间
        if (elapsed >= actionState.duration) {
            // 恢复体力
            const currentStamina = blackboard.getValue('stamina');
            const newStamina = Math.min(100, currentStamina + 10); // 每次恢复10点
            
            blackboard.setValue('stamina', newStamina);
            blackboard.setValue('staminaPercentage', newStamina / 100);
            blackboard.setValue('isLowStamina', newStamina < 20);
            

            
            // 体力满了就完成休息
            if (newStamina >= 100) {
                blackboard.setValue('isResting', false); // 只有完全恢复后才结束休息状态
                this.actionStates.delete(actionKey);

                return 'success';
            }
            
            // 重置计时器继续恢复，保持休息状态
            actionState.startTime = currentTime;
        }
        
        return 'running';
    }

    /**
     * 挖掘金矿 - 优化版本，需要时间挖掘
     */
    private handleMineGoldOre(context: any, params: any): ActionResult {
        const blackboard = this.blackboard;
        if (!blackboard) return 'failure';

        // 检查是否应该执行挖矿
        const hasOre = blackboard.getValue('hasOre');
        const isLowStamina = blackboard.getValue('isLowStamina');
        
        if (hasOre || isLowStamina) {
            return 'failure';
        }

        // 找到最近的金矿
        const gameManager = this.node.parent?.getComponent('SimpleMinerDemo');
        const goldMines = (gameManager as any)?.getAllGoldMines();
        if (!goldMines?.length) return 'failure';

        // 简单找最近的矿
        let nearestMine = goldMines[0];
        let minDistance = Vec3.distance(this.node.worldPosition, nearestMine.worldPosition);
        
        for (const mine of goldMines) {
            const distance = Vec3.distance(this.node.worldPosition, mine.worldPosition);
            if (distance < minDistance) {
                minDistance = distance;
                nearestMine = mine;
            }
        }

        if (minDistance > 2.0) {
            // 还没到金矿，继续移动
            this.moveToPosition(nearestMine.worldPosition, 2.0);
            return 'running';
        } else {
            // 到了金矿，开始挖掘流程
            const actionKey = 'mine-gold-ore';
            const currentTime = Date.now();
            
            // 初始化挖掘状态
            if (!this.actionStates.has(actionKey)) {
                this.actionStates.set(actionKey, {
                    isExecuting: true,
                    startTime: currentTime,
                    duration: 3000 // 3秒挖掘时间
                });
    
                return 'running';
            }

            const actionState = this.actionStates.get(actionKey)!;
            const elapsed = currentTime - actionState.startTime;

            // 挖掘完成
            if (elapsed >= actionState.duration) {
                const currentStamina = blackboard.getValue('stamina');
                const newStamina = Math.max(0, currentStamina - 15);
                
                blackboard.setValue('stamina', newStamina);
                blackboard.setValue('staminaPercentage', newStamina / 100);
                blackboard.setValue('hasOre', true);
                blackboard.setValue('isLowStamina', newStamina < 20);
                

                
                this.actionStates.delete(actionKey);
                return 'failure'; // 让选择器重新评估条件
            }
            
            return 'running';
        }
    }

    /**
     * 存储矿石 - 优化版本，需要时间存储
     */
    private handleStoreOre(context: any, params: any): ActionResult {
        const blackboard = this.blackboard;
        if (!blackboard) return 'failure';

        const hasOre = blackboard.getValue('hasOre');
        if (!hasOre) {
            return 'failure';
        }

        // 清理其他动作状态
        this.clearActionState('mine-gold-ore');
        this.clearActionState('recover-stamina');

        // 找到仓库并移动过去
        const gameManager = this.node.parent?.getComponent('SimpleMinerDemo');
        const warehouse = (gameManager as any)?.getWarehouse();
        if (!warehouse) return 'failure';

        const distance = Vec3.distance(this.node.worldPosition, warehouse.worldPosition);
        
        if (distance > 2.0) {
            // 还没到仓库，继续移动
            this.moveToPosition(warehouse.worldPosition, 2.0);
            return 'running';
        } else {
            // 到了仓库，开始存储流程
            const actionKey = 'store-ore';
            const currentTime = Date.now();
            
            // 初始化存储状态
            if (!this.actionStates.has(actionKey)) {
                this.actionStates.set(actionKey, {
                    isExecuting: true,
                    startTime: currentTime,
                    duration: 1500 // 1.5秒存储时间
                });
    
                return 'running';
            }

            const actionState = this.actionStates.get(actionKey)!;
            const elapsed = currentTime - actionState.startTime;

            // 存储完成
            if (elapsed >= actionState.duration) {
                blackboard.setValue('hasOre', false);
                (gameManager as any).mineGoldOre(this.node);
                

                
                this.actionStates.delete(actionKey);
                return 'success';
            }
            
            return 'running';
        }
    }

    /**
     * 默认待机行为
     */
    private handleIdleBehavior(context: any, params: any): ActionResult {

        return 'success';
    }

    // ==================== 辅助方法 ====================

    private moveToPosition(targetPos: Vec3, duration: number) {
        tween(this.node).stop(); // 停止之前的移动
        tween(this.node).to(duration, { worldPosition: targetPos }).start();
    }
    
    /**
     * 更新行为树 - 简化版本
     */
    update(deltaTime: number) {
        // 简单执行行为树
        if (this.behaviorTree && this.isRunning) {
            this.behaviorTree.tick(deltaTime);
        }
        
        // 更新UI显示
        if (this.showStatusUI) {
            this.updateStatusUI();
        }
    }
    
    /**
     * 设置更新频率 - 已废弃，现在每帧执行
     */
    setTickInterval(interval: number) {
        // 方法保留以保持兼容性，但不再有实际作用
        console.warn(`[${this.node.name}] setTickInterval已废弃，行为树现在每帧执行`);
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
    getBehaviorTree(): BehaviorTree<any> | null {
        return this.behaviorTree;
    }
    
    /**
     * 暂停行为树
     */
    pause() {
        this.isRunning = false;
        if (this.debugMode) {
    
        }
    }
    
    /**
     * 恢复行为树
     */
    resume() {
        if (this.isLoaded) {
            this.isRunning = true;
            if (this.debugMode) {
    
            }
        }
    }
    
    /**
     * 停止行为树
     */
    stop() {
        this.isRunning = false;
        if (this.behaviorTree) {
            this.behaviorTree.reset();
        }
        if (this.debugMode) {
    
        }
    }
    
    /**
     * 重新加载行为树
     */
    async reload() {
        this.stop();
        await this.initialize();
    }
    
    /**
     * 重置行为树状态
     */
    reset() {
        if (this.behaviorTree) {
            this.behaviorTree.reset();
        }
        if (this.debugMode) {
    
        }
    }
    
    onDestroy() {
        this.stop();
        if (this.eventRegistry) {
            this.eventRegistry.clear();
        }
        
        // 清理UI
        if (this.statusUI) {
            this.statusUI.node.destroy();
            this.statusUI = null;
        }
        
        this.behaviorTree = null;
        this.blackboard = null;
        this.context = null;
        this.eventRegistry = null;
    }
} 