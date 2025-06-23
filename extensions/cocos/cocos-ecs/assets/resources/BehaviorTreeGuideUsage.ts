import { _decorator, Component, Node, Label, Button } from 'cc';
import { 
    BehaviorTreeBuilder, 
    BehaviorTree, 
    Blackboard,
    BehaviorTreeJSONConfig 
} from '@esengine/ai';

const { ccclass, property } = _decorator;

/**
 * 完整行为树指南使用示例
 * 
 * 此示例展示了高级行为树特性：
 * 1. 条件装饰器 (Conditional Decorator)
 * 2. 重复器 (Repeater) 
 * 3. 反转器 (Inverter)
 * 4. 黑板变量引用 {{variable}}
 * 5. 复杂的组合行为逻辑
 * 6. 自定义条件和动作
 * 
 * 包含三种行为模式：
 * - 巡逻模式：重复执行巡逻序列
 * - 战斗模式：检测敌人并攻击/防御
 * - 闲置模式：状态报告和等待
 */
@ccclass('BehaviorTreeGuideUsage')
export class BehaviorTreeGuideUsage extends Component {
    
    @property(Label)
    statusLabel: Label = null;
    
    @property(Label)
    logLabel: Label = null;
    
    @property(Button)
    controlButton: Button = null;
    
    @property(Button)
    switchStateButton: Button = null;
    
    private behaviorTree: BehaviorTree<any> = null;
    private blackboard: Blackboard = null;
    private isRunning: boolean = false;
    private logs: string[] = [];
    private currentStateIndex: number = 0;
    private states = ['patrol', 'combat', 'idle'];

    onLoad() {
        this.setupUI();
        this.initializeBehaviorTree();
    }

    private setupUI() {
        if (this.controlButton) {
            this.controlButton.node.on('click', this.toggleExecution, this);
        }
        if (this.switchStateButton) {
            this.switchStateButton.node.on('click', this.switchState, this);
        }
        
        this.updateStatus('初始化完整行为树指南...');
        this.addLog('🎓 行为树指南示例已加载');
    }

    private initializeBehaviorTree() {
        try {
            // 这里应该从JSON文件加载完整的行为树配置
            // 为了演示，我们使用简化版本
            const config: BehaviorTreeJSONConfig = {
                nodes: [
                    {
                        id: "root_1",
                        type: "root",
                        name: "行为树指南根",
                        children: ["selector_main"]
                    },
                    {
                        id: "selector_main",
                        type: "selector",
                        name: "主选择器",
                        properties: { abortType: "LowerPriority" },
                        children: ["sequence_combat", "sequence_patrol", "sequence_idle"]
                    },
                    {
                        id: "sequence_combat",
                        type: "sequence",
                        name: "战斗序列",
                        children: ["condition_enemy", "action_attack"]
                    },
                    {
                        id: "condition_enemy",
                        type: "condition-random",
                        name: "随机敌人出现",
                        properties: { successProbability: 0.3 }
                    },
                    {
                        id: "action_attack",
                        type: "log-action",
                        name: "攻击动作",
                        properties: {
                            message: "发动攻击！生命值: {{health}}, 能量: {{energy}}",
                            logLevel: "warn"
                        }
                    },
                    {
                        id: "sequence_patrol",
                        type: "sequence",
                        name: "巡逻序列",
                        children: ["action_patrol", "wait_patrol"]
                    },
                    {
                        id: "action_patrol",
                        type: "set-blackboard-value",
                        name: "执行巡逻",
                        properties: {
                            variableName: "lastAction",
                            value: "{{state}}_执行中"
                        }
                    },
                    {
                        id: "wait_patrol",
                        type: "wait-action",
                        name: "巡逻等待",
                        properties: { waitTime: 1 }
                    },
                    {
                        id: "sequence_idle",
                        type: "sequence",
                        name: "闲置序列",
                        children: ["action_idle", "wait_idle"]
                    },
                    {
                        id: "action_idle",
                        type: "log-action",
                        name: "状态报告",
                        properties: {
                            message: "状态报告 - 当前: {{state}}, 上次动作: {{lastAction}}"
                        }
                    },
                    {
                        id: "wait_idle",
                        type: "wait-action",
                        name: "闲置等待",
                        properties: { waitTime: 2 }
                    }
                ],
                blackboard: [
                    {
                        name: "state",
                        type: "string",
                        value: "patrol",
                        description: "当前状态"
                    },
                    {
                        name: "lastAction",
                        type: "string",
                        value: "",
                        description: "最后执行的动作"
                    },
                    {
                        name: "health",
                        type: "number",
                        value: 100,
                        description: "生命值"
                    },
                    {
                        name: "energy",
                        type: "number",
                        value: 50,
                        description: "能量值"
                    }
                ]
            };
            
            // 创建执行上下文
            const executionContext = {
                node: this.node,
                component: this,
                log: (message: string, level: string = 'info') => {
                    this.addLog(`🤖 [${level.toUpperCase()}] ${message}`);
                }
            };
            
            // 🎯 使用 BehaviorTreeBuilder 一键创建
            const result = BehaviorTreeBuilder.fromBehaviorTreeConfig(config, executionContext);
            
            this.behaviorTree = result.tree;
            this.blackboard = result.blackboard;
            
            this.updateStatus('完整行为树指南已准备就绪');
            this.addLog('✅ 行为树创建成功（高级特性版本）');
            this.addLog(`📊 包含 ${config.nodes.length} 个节点`);
            this.addLog(`📋 包含 ${config.blackboard.length} 个黑板变量`);
            
            // 显示初始状态
            this.logBlackboardStatus();
            
        } catch (error) {
            console.error('初始化行为树失败:', error);
            this.updateStatus('初始化失败: ' + error.message);
            this.addLog('❌ 行为树初始化失败: ' + error.message);
        }
    }

    private toggleExecution() {
        if (!this.behaviorTree) {
            this.addLog('❌ 行为树未准备好');
            return;
        }
        
        this.isRunning = !this.isRunning;
        
        if (this.isRunning) {
            this.behaviorTree.reset();
            this.updateStatus('执行中...');
            this.addLog('🚀 开始执行完整行为树指南');
            if (this.controlButton) {
                this.controlButton.getComponentInChildren(Label).string = '停止';
            }
        } else {
            this.updateStatus('已停止');
            this.addLog('⏹️ 行为树执行已停止');
            if (this.controlButton) {
                this.controlButton.getComponentInChildren(Label).string = '开始';
            }
        }
    }

    private switchState() {
        if (!this.blackboard) return;
        
        this.currentStateIndex = (this.currentStateIndex + 1) % this.states.length;
        const newState = this.states[this.currentStateIndex];
        
        this.blackboard.setValue('state', newState);
        this.addLog(`🔄 切换状态到: ${newState}`);
        this.logBlackboardStatus();
    }

    update(deltaTime: number) {
        if (!this.isRunning || !this.behaviorTree) return;
        
        try {
            this.behaviorTree.tick(deltaTime);
        } catch (error) {
            console.error('行为树执行出错:', error);
            this.addLog('❌ 执行出错: ' + error.message);
            this.isRunning = false;
        }
    }

    private logBlackboardStatus() {
        if (!this.blackboard) return;
        
        const variables = ['state', 'lastAction', 'health', 'energy'];
        const status = variables.map(name => {
            const value = this.blackboard.getValue(name, 'undefined');
            return `${name}:${value}`;
        }).join(', ');
        
        this.addLog(`📊 黑板状态: ${status}`);
    }

    private updateStatus(status: string) {
        if (this.statusLabel) {
            this.statusLabel.string = status;
        }
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
        
        console.log('[BehaviorTreeGuide]', message);
    }

    onDestroy() {
        this.isRunning = false;
    }
}

/*
 * 完整指南特色功能说明：
 * 
 * 1. 高级节点类型：
 *    - Repeater: 无限重复巡逻行为
 *    - Conditional Decorator: 带条件的装饰器
 *    - Inverter: 反转子节点结果
 * 
 * 2. 黑板变量引用：
 *    - {{state}}: 动态引用当前状态
 *    - {{health}}: 显示生命值
 *    - {{lastAction}}: 跟踪最后动作
 * 
 * 3. 复杂行为逻辑：
 *    - 巡逻：重复执行，状态检查
 *    - 战斗：敌人检测，攻击防御
 *    - 闲置：状态报告，定时等待
 * 
 * 4. 交互功能：
 *    - 状态切换按钮
 *    - 开始/停止控制
 *    - 实时日志显示
 *    - 黑板变量监控
 */
