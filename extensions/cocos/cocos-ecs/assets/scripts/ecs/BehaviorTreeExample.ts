import { _decorator, Component, Node, Label, Button, resources, JsonAsset } from 'cc';
import { 
    BehaviorTreeBuilder, 
    BehaviorTree, 
    Blackboard, 
    BehaviorTreeJSONConfig 
} from '@esengine/ai';

const { ccclass, property } = _decorator;

/**
 * 行为树测试示例
 * 使用 @esengine/ai 包的 BehaviorTreeBuilder API 自动加载和初始化行为树
 * 
 * 特性：
 * - 自动从JSON配置文件加载行为树
 * - 自动初始化黑板变量
 * - 支持行为树的启动、停止、暂停、恢复
 * - 实时显示黑板变量状态
 */
@ccclass('BehaviorTreeExample')
export class BehaviorTreeExample extends Component {
    
    @property(Label)
    statusLabel: Label = null;
    
    @property(Label)
    logLabel: Label = null;
    
    @property(Button)
    startButton: Button = null;
    
    @property(Button)
    stopButton: Button = null;
    
    @property(Button)
    pauseButton: Button = null;
    
    @property(Button)
    resumeButton: Button = null;
    
    private behaviorTree: BehaviorTree<any> = null;
    private blackboard: Blackboard = null;
    private isRunning: boolean = false;
    private isPaused: boolean = false;
    private logs: string[] = [];
    private executionContext: any = null;
    private updateTimer: number = 0;
    
    onLoad() {
        this.setupUI();
        this.loadBehaviorTree();
    }

    private setupUI() {
        if (this.startButton) {
            this.startButton.node.on('click', this.startBehaviorTree, this);
        }
        if (this.stopButton) {
            this.stopButton.node.on('click', this.stopBehaviorTree, this);
        }
        if (this.pauseButton) {
            this.pauseButton.node.on('click', this.pauseBehaviorTree, this);
        }
        if (this.resumeButton) {
            this.resumeButton.node.on('click', this.resumeBehaviorTree, this);
        }
        
        this.updateStatus('初始化中...');
        this.updateLog('行为树测试组件已加载');
    }

    private async loadBehaviorTree() {
        try {
            this.updateStatus('加载行为树配置...');
            
            // 从resources目录加载test.bt.json文件
            resources.load('test.bt', JsonAsset, (err, jsonAsset: JsonAsset) => {
                if (err) {
                    console.error('加载行为树配置失败:', err);
                    this.updateStatus('加载失败: ' + err.message);
                    this.updateLog('❌ 加载test.bt.json失败: ' + err.message);
                    return;
                }
                
                try {
                    const config = jsonAsset.json as BehaviorTreeJSONConfig;
                    this.setupBehaviorTree(config);
                } catch (error) {
                    console.error('解析行为树配置失败:', error);
                    this.updateStatus('解析失败: ' + error.message);
                    this.updateLog('❌ 解析行为树配置失败: ' + error.message);
                }
            });
            
        } catch (error) {
            console.error('行为树加载过程出错:', error);
            this.updateStatus('加载出错: ' + error.message);
            this.updateLog('❌ 行为树加载过程出错: ' + error.message);
        }
    }

    private setupBehaviorTree(config: BehaviorTreeJSONConfig) {
        try {
            // 创建执行上下文
            this.executionContext = {
                node: this.node,
                component: this,
                // 添加日志方法供行为树节点使用
                log: (message: string, level: string = 'info') => {
                    this.updateLog(`🤖 [${level.toUpperCase()}] ${message}`);
                }
            };
            
            // 🎯 使用 @esengine/ai 的 BehaviorTreeBuilder API - 一行代码完成所有初始化！
            const result = BehaviorTreeBuilder.fromBehaviorTreeConfig(config, this.executionContext);
            
            this.behaviorTree = result.tree;
            this.blackboard = result.blackboard;
            this.executionContext = result.context;
            
            this.updateStatus('行为树加载完成，准备执行');
            this.updateLog('✅ 行为树创建成功（使用 @esengine/ai 包）');
            this.updateLog(`📊 节点总数: ${config.nodes ? config.nodes.length : 0}`);
            this.updateLog(`📋 变量总数: ${config.blackboard ? config.blackboard.length : 0}`);
            
            // 显示黑板变量初始状态
            this.logBlackboardStatus();
            
            // 启用开始按钮
            if (this.startButton) {
                this.startButton.interactable = true;
            }
            
        } catch (error) {
            console.error('设置行为树失败:', error);
            this.updateStatus('设置失败: ' + error.message);
            this.updateLog('❌ 行为树设置失败: ' + error.message);
        }
    }

    private startBehaviorTree() {
        if (!this.behaviorTree) {
            this.updateLog('❌ 行为树未准备好');
            return;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        // 重置行为树状态
        this.behaviorTree.reset();
        this.updateStatus('执行中...');
        this.updateLog('🚀 开始执行行为树（自动初始化黑板）');
        
        // 更新按钮状态
        if (this.startButton) this.startButton.interactable = false;
        if (this.stopButton) this.stopButton.interactable = true;
        if (this.pauseButton) this.pauseButton.interactable = true;
        if (this.resumeButton) this.resumeButton.interactable = false;
    }

    private stopBehaviorTree() {
        this.isRunning = false;
        this.isPaused = false;
        this.updateStatus('已停止');
        this.updateLog('⏹️ 行为树执行已停止');
        
        // 重置行为树状态
        if (this.behaviorTree) {
            this.behaviorTree.reset();
        }
        
        // 更新按钮状态
        if (this.startButton) this.startButton.interactable = true;
        if (this.stopButton) this.stopButton.interactable = false;
        if (this.pauseButton) this.pauseButton.interactable = false;
        if (this.resumeButton) this.resumeButton.interactable = false;
    }

    private pauseBehaviorTree() {
        this.isPaused = true;
        this.updateStatus('已暂停');
        this.updateLog('⏸️ 行为树执行已暂停');
        
        // 更新按钮状态
        if (this.pauseButton) this.pauseButton.interactable = false;
        if (this.resumeButton) this.resumeButton.interactable = true;
    }

    private resumeBehaviorTree() {
        this.isPaused = false;
        this.updateStatus('执行中...');
        this.updateLog('▶️ 行为树执行已恢复');
        
        // 更新按钮状态
        if (this.pauseButton) this.pauseButton.interactable = true;
        if (this.resumeButton) this.resumeButton.interactable = false;
    }

    update(deltaTime: number) {
        if (!this.isRunning || this.isPaused || !this.behaviorTree) {
            return;
        }
        
        this.updateTimer += deltaTime;
        
        // 每帧执行行为树
        try {
            this.behaviorTree.tick(deltaTime);
            
            // 每2秒输出一次状态信息
            if (this.updateTimer >= 2.0) {
                this.updateTimer = 0;
                this.logBlackboardStatus();
                
                // 检查行为树是否处于活动状态
                const isActive = this.behaviorTree.isActive();
                if (!isActive) {
                    this.updateLog('✅ 行为树执行完成');
                    // 注意：这里只是演示，实际上行为树会持续运行
                    // 如果需要检查完成状态，需要通过黑板变量或其他逻辑判断
                }
            }
            
        } catch (error) {
            console.error('行为树执行出错:', error);
            this.updateLog('❌ 执行出错: ' + error.message);
            this.stopBehaviorTree();
        }
    }

    private logBlackboardStatus() {
        if (!this.blackboard) return;
        
        // 获取所有黑板变量的当前值
        const variables = ['state', 'lastAction', 'defendActive', 'health', 'energy'];
        const status = variables.map(name => {
            const value = this.blackboard.getValue(name, 'undefined');
            return `${name}:${value}`;
        }).join(', ');
        
        this.updateLog(`📊 状态: ${status}`);
    }

    private updateStatus(status: string) {
        if (this.statusLabel) {
            this.statusLabel.string = status;
        }
        console.log('[BehaviorTree] 状态:', status);
    }

    private updateLog(message: string) {
        this.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
        
        // 只保留最新的25条日志
        if (this.logs.length > 25) {
            this.logs.shift();
        }
        
        if (this.logLabel) {
            this.logLabel.string = this.logs.join('\n');
        }
        
        console.log('[BehaviorTree]', message);
    }

    onDestroy() {
        this.stopBehaviorTree();
    }
} 