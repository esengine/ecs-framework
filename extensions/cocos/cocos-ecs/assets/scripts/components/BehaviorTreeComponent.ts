import { Node, resources, JsonAsset, Component, _decorator, Vec3, tween, instantiate, Prefab } from 'cc';
import { BehaviorTree, BehaviorTreeBuilder, Blackboard, TaskStatus, BehaviorTreeJSONConfig, EventRegistry, IBehaviorTreeContext, ActionResult } from '@esengine/ai';
import { MinerStatusUI } from './MinerStatusUI';
import { StatusUIManager } from './StatusUIManager';

const { ccclass, property } = _decorator;

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
    
    async initialize() {
        if (!this.behaviorTreeFile) {
            return;
        }
        
        try {
            await this.loadBehaviorTree();
            this.isLoaded = true;
            this.isRunning = true;
        } catch (error) {
            // 静默处理
        }
    }
    
    private async loadBehaviorTree(): Promise<void> {
        return new Promise((resolve, reject) => {
            let jsonPath = this.behaviorTreeFile;
            resources.load(jsonPath, JsonAsset, (err, asset) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                try {
                    const treeData = asset.json as BehaviorTreeJSONConfig;
                    this.buildBehaviorTree(treeData);
                    resolve();
                } catch (buildError) {
                    reject(buildError);
                }
            });
        });
    }
    
    private buildBehaviorTree(treeData: BehaviorTreeJSONConfig) {
        this.eventRegistry = new EventRegistry();
        this.setupEventHandlers();
        
        const baseContext = {
            node: this.node,
            component: this,
            eventRegistry: this.eventRegistry
        };
        
        const result = BehaviorTreeBuilder.fromBehaviorTreeConfig(treeData, baseContext);
        this.behaviorTree = result.tree;
        this.blackboard = result.blackboard;
        this.context = result.context;
        
        this.initializeBlackboard();
    }

    private setupEventHandlers() {
        if (!this.eventRegistry) return;

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

    private initializeBlackboard() {
        if (!this.blackboard) return;
        
        this.blackboard.setValue('stamina', 100);
        this.blackboard.setValue('staminaPercentage', 1.0);
        this.blackboard.setValue('isLowStamina', false);
        this.blackboard.setValue('hasOre', false);
        this.blackboard.setValue('isResting', false);
        this.blackboard.setValue('homePosition', this.node.worldPosition);
    }


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
    }
    
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
     * 回家休息 - 包含体力恢复逻辑
     */
    private handleGoHomeRest(context: any, params: any): ActionResult {
        const blackboard = this.blackboard;
        if (!blackboard) return 'failure';

        // 检查是否已经在家了
        const homePos = blackboard.getValue('homePosition') || this.node.worldPosition;
        const distance = Vec3.distance(this.node.worldPosition, homePos);
        

        
        if (distance > 1.0) {
            // 还没到家，继续移动
            this.moveToPosition(homePos, 2.0);
            return 'running';
        } else {
            this.clearActionState('mine-gold-ore');
            this.clearActionState('store-ore');
            blackboard.setValue('isResting', true);
            const actionKey = 'go-home-rest';
            const currentTime = Date.now();
            
            // 初始化休息状态
            if (!this.actionStates.has(actionKey)) {
                this.actionStates.set(actionKey, {
                    isExecuting: true,
                    startTime: currentTime,
                    duration: 2000 // 2秒恢复一次
                });
                return 'running';
            }

            const actionState = this.actionStates.get(actionKey)!;
            const elapsed = currentTime - actionState.startTime;

            if (elapsed >= actionState.duration) {
                const currentStamina = blackboard.getValue('stamina');
                const newStamina = Math.min(100, currentStamina + 10);
                
                blackboard.setValue('stamina', newStamina);
                blackboard.setValue('staminaPercentage', newStamina / 100);
                
                if (newStamina >= 80) {
                    blackboard.setValue('isResting', false);
                    blackboard.setValue('isLowStamina', false);
                    this.actionStates.delete(actionKey);
                    return 'success';
                }
                
                actionState.startTime = currentTime;
            }
            
            return 'running';
        }
    }

    private handleRecoverStamina(context: any, params: any): ActionResult {
        return 'success';
    }

    private handleMineGoldOre(context: any, params: any): ActionResult {
        const blackboard = this.blackboard;
        if (!blackboard) return 'failure';

        const hasOre = blackboard.getValue('hasOre');
        const isLowStamina = blackboard.getValue('isLowStamina');
        const isResting = blackboard.getValue('isResting');
        
        if (hasOre || isLowStamina || isResting) {
            return 'failure';
        }

        const gameManager = this.node.parent?.getComponent('SimpleMinerDemo');
        const goldMines = (gameManager as any)?.getAllGoldMines();
        if (!goldMines?.length) return 'failure';

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
            this.moveToPosition(nearestMine.worldPosition, 2.0);
            return 'running';
        } else {
            const actionKey = 'mine-gold-ore';
            const currentTime = Date.now();
            
            if (!this.actionStates.has(actionKey)) {
                this.actionStates.set(actionKey, {
                    isExecuting: true,
                    startTime: currentTime,
                    duration: 3000
                });
                return 'running';
            }

            const actionState = this.actionStates.get(actionKey)!;
            const elapsed = currentTime - actionState.startTime;

            if (elapsed >= actionState.duration) {
                const currentStamina = blackboard.getValue('stamina');
                const newStamina = Math.max(0, currentStamina - 15);
                
                blackboard.setValue('stamina', newStamina);
                blackboard.setValue('staminaPercentage', newStamina / 100);
                blackboard.setValue('hasOre', true);
                blackboard.setValue('isLowStamina', newStamina < 20);
                
                this.actionStates.delete(actionKey);
                return 'failure';
            }
            
            return 'running';
        }
    }

    private handleStoreOre(context: any, params: any): ActionResult {
        const blackboard = this.blackboard;
        if (!blackboard) return 'failure';

        const hasOre = blackboard.getValue('hasOre');
        if (!hasOre) {
            return 'failure';
        }

        const isLowStamina = blackboard.getValue('isLowStamina');
        if (isLowStamina) {
            return 'failure';
        }

        this.clearActionState('mine-gold-ore');
        const gameManager = this.node.parent?.getComponent('SimpleMinerDemo');
        const warehouse = (gameManager as any)?.getWarehouse();
        if (!warehouse) return 'failure';

        const distance = Vec3.distance(this.node.worldPosition, warehouse.worldPosition);
        
        if (distance > 2.0) {
            this.moveToPosition(warehouse.worldPosition, 2.0);
            return 'running';
        } else {
            const actionKey = 'store-ore';
            const currentTime = Date.now();
            
            if (!this.actionStates.has(actionKey)) {
                this.actionStates.set(actionKey, {
                    isExecuting: true,
                    startTime: currentTime,
                    duration: 1500
                });
                return 'running';
            }

            const actionState = this.actionStates.get(actionKey)!;
            const elapsed = currentTime - actionState.startTime;

            if (elapsed >= actionState.duration) {
                blackboard.setValue('hasOre', false);
                (gameManager as any).mineGoldOre(this.node);
                this.actionStates.delete(actionKey);
                return 'success';
            }
            
            return 'running';
        }
    }

    private handleIdleBehavior(context: any, params: any): ActionResult {
        return 'success';
    }

    private moveToPosition(targetPos: Vec3, duration: number) {
        tween(this.node).stop();
        tween(this.node).to(duration, { worldPosition: targetPos }).start();
    }
    
    update(deltaTime: number) {
        if (this.behaviorTree && this.isRunning) {
            this.behaviorTree.tick(deltaTime);
        }
        
        if (this.showStatusUI) {
            this.updateStatusUI();
        }
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