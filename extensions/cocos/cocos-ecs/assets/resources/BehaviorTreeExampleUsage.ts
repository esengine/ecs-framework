import { _decorator, Component, Node, Label } from 'cc';
import { 
    BehaviorTreeBuilder, 
    BehaviorTree, 
    Blackboard 
} from '@esengine/ai';

const { ccclass, property } = _decorator;

/**
 * 行为树示例用法
 * 展示如何在Cocos Creator中加载并执行行为树
 */
@ccclass('BehaviorTreeExampleUsage')
export class BehaviorTreeExampleUsage extends Component {
    
    @property(Label)
    statusLabel: Label = null;
    
    @property(Label)
    logLabel: Label = null;
    
    private behaviorTree: BehaviorTree<any> = null;
    private blackboard: Blackboard = null;
    private isRunning: boolean = false;
    private logs: string[] = [];
    private executionContext: any = null;

    onLoad() {
        this.setupBehaviorTree();
    }

    private setupBehaviorTree() {
        try {
            // 行为树配置（通常从JSON文件加载）
            const behaviorTreeConfig = {
                "nodes": [
                    {
                        "id": "root_1",
                        "type": "root",
                        "name": "AI智能体行为树",
                        "children": ["selector_main"]
                    },
                    {
                        "id": "selector_main",
                        "type": "selector",
                        "name": "主选择器",
                        "properties": {
                            "abortType": "LowerPriority"
                        },
                        "children": ["sequence_combat", "sequence_patrol", "sequence_idle"]
                    },
                    {
                        "id": "sequence_combat",
                        "type": "sequence",
                        "name": "战斗序列",
                        "children": ["condition_enemy", "action_attack"]
                    },
                    {
                        "id": "condition_enemy",
                        "type": "condition-random",
                        "name": "发现敌人",
                        "properties": {
                            "successProbability": 0.3
                        }
                    },
                    {
                        "id": "action_attack",
                        "type": "log-action",
                        "name": "攻击敌人",
                        "properties": {
                            "message": "发动攻击！当前生命值: {{health}}, 能量: {{energy}}",
                            "logLevel": "warn"
                        }
                    },
                    {
                        "id": "sequence_patrol",
                        "type": "sequence",
                        "name": "巡逻序列",
                        "children": ["action_move", "wait_patrol"]
                    },
                    {
                        "id": "action_move",
                        "type": "set-blackboard-value",
                        "name": "移动巡逻",
                        "properties": {
                            "variableName": "lastAction",
                            "value": "巡逻中"
                        }
                    },
                    {
                        "id": "wait_patrol",
                        "type": "wait-action",
                        "name": "巡逻等待",
                        "properties": {
                            "waitTime": 2
                        }
                    },
                    {
                        "id": "sequence_idle",
                        "type": "sequence",
                        "name": "闲置序列",
                        "children": ["action_idle", "wait_idle"]
                    },
                    {
                        "id": "action_idle",
                        "type": "log-action",
                        "name": "闲置状态",
                        "properties": {
                            "message": "当前状态: 闲置中，生命值: {{health}}"
                        }
                    },
                    {
                        "id": "wait_idle",
                        "type": "wait-action",
                        "name": "闲置等待",
                        "properties": {
                            "waitTime": 1
                        }
                    }
                ],
                "blackboard": [
                    {
                        "name": "health",
                        "type": "number",
                        "value": 100,
                        "description": "角色生命值"
                    },
                    {
                        "name": "energy",
                        "type": "number",
                        "value": 80,
                        "description": "角色能量值"
                    },
                    {
                        "name": "lastAction",
                        "type": "string",
                        "value": "待机",
                        "description": "最后执行的动作"
                    },
                    {
                        "name": "enemyDetected",
                        "type": "boolean",
                        "value": false,
                        "description": "是否检测到敌人"
                    }
                ]
            };
            
            // 创建执行上下文
            this.executionContext = {
                node: this.node,
                component: this,
                // 添加日志方法供行为树节点使用
                log: (message: string, level: string = 'info') => {
                    this.addLog(`🤖 [${level.toUpperCase()}] ${message}`);
                }
            };
            
            // 🎯 使用 @esengine/ai 的 BehaviorTreeBuilder API - 一行代码完成所有初始化！
            const result = BehaviorTreeBuilder.fromBehaviorTreeConfig(behaviorTreeConfig, this.executionContext);
            
            this.behaviorTree = result.tree;
            this.blackboard = result.blackboard;
            this.executionContext = result.context;
            
            this.updateStatus('行为树加载完成');
            this.addLog('✅ 行为树初始化成功');
            this.addLog(`📊 节点总数: ${behaviorTreeConfig.nodes.length}`);
            this.addLog(`📋 变量总数: ${behaviorTreeConfig.blackboard.length}`);
            
            // 自动开始执行
            this.startBehaviorTree();
            
        } catch (error) {
            console.error('行为树设置失败:', error);
            this.updateStatus('设置失败: ' + error.message);
            this.addLog('❌ 行为树设置失败: ' + error.message);
        }
    }

    private startBehaviorTree() {
        this.isRunning = true;
        this.behaviorTree.reset();
        this.updateStatus('执行中...');
        this.addLog('🚀 开始执行行为树');
    }

    private stopBehaviorTree() {
        this.isRunning = false;
        this.updateStatus('已停止');
        this.addLog('⏹️ 行为树执行已停止');
        
        if (this.behaviorTree) {
            this.behaviorTree.reset();
        }
    }

    update(deltaTime: number) {
        if (!this.isRunning || !this.behaviorTree) {
            return;
        }
        
        try {
            // 每帧执行行为树
            this.behaviorTree.tick(deltaTime);
            
        } catch (error) {
            console.error('行为树执行出错:', error);
            this.addLog('❌ 执行出错: ' + error.message);
            this.stopBehaviorTree();
        }
    }

    private updateStatus(status: string) {
        if (this.statusLabel) {
            this.statusLabel.string = status;
        }
        console.log('[BehaviorTree] 状态:', status);
    }

    private addLog(message: string) {
        this.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
        
        // 只保留最新的20条日志
        if (this.logs.length > 20) {
            this.logs.shift();
        }
        
        if (this.logLabel) {
            this.logLabel.string = this.logs.join('\n');
        }
        
        console.log('[BehaviorTree]', message);
    }
    
    // 手动控制方法（可以绑定到UI按钮）
    onStartButtonClick() {
        if (!this.isRunning) {
            this.startBehaviorTree();
        }
    }
    
    onStopButtonClick() {
        if (this.isRunning) {
            this.stopBehaviorTree();
        }
    }
    
    // 修改黑板变量的示例方法
    onModifyHealthClick() {
        if (this.blackboard) {
            const currentHealth = this.blackboard.getValue('health', 100);
            const newHealth = Math.max(0, currentHealth - 10);
            this.blackboard.setValue('health', newHealth);
            this.addLog(`🩺 生命值变更: ${currentHealth} -> ${newHealth}`);
        }
    }
    
    onModifyEnergyClick() {
        if (this.blackboard) {
            const currentEnergy = this.blackboard.getValue('energy', 80);
            const newEnergy = Math.max(0, currentEnergy - 5);
            this.blackboard.setValue('energy', newEnergy);
            this.addLog(`⚡ 能量变更: ${currentEnergy} -> ${newEnergy}`);
        }
    }

    onDestroy() {
        this.stopBehaviorTree();
    }
}

/**
 * 使用说明：
 * 
 * 1. 安装依赖：
 *    npm install @esengine/ai
 * 
 * 2. 将此脚本挂载到场景中的节点上
 * 
 * 3. 在属性检查器中设置：
 *    - statusLabel: 用于显示当前状态的Label组件
 *    - logLabel: 用于显示日志信息的Label组件
 * 
 * 4. 运行场景，观察行为树的执行效果
 * 
 * 5. 可以添加按钮并绑定控制方法：
 *    - onStartButtonClick(): 开始执行
 *    - onStopButtonClick(): 停止执行
 *    - onModifyHealthClick(): 修改生命值
 *    - onModifyEnergyClick(): 修改能量值
 */
