import { Node, resources, JsonAsset } from 'cc';
import { BehaviorTree, BehaviorTreeBuilder, Blackboard, TaskStatus, BehaviorTreeJSONConfig } from '@esengine/ai';
import { ECSComponent } from './UnitComponent';

/**
 * 行为树组件 - ECS组件，管理单个实体的行为树
 */
export class BehaviorTreeComponent extends ECSComponent {
    public behaviorTreeFile: string = '';
    public cocosNode: Node | null = null;
    
    private behaviorTree: BehaviorTree<any> | null = null;
    private blackboard: Blackboard | null = null;
    private context: any = null;
    private isLoaded: boolean = false;
    private isRunning: boolean = false;
    private lastTickTime: number = 0;
    private tickInterval: number = 0.1; // 行为树更新间隔（秒）
    
    /**
     * 初始化行为树
     */
    async initialize() {
        if (!this.behaviorTreeFile) {
            console.error('行为树文件路径未设置');
            return;
        }
        
        try {
            await this.loadBehaviorTree();
            this.setupBlackboard();
            this.isLoaded = true;
            this.isRunning = true;
            console.log(`行为树组件初始化成功: ${this.behaviorTreeFile}`);
        } catch (error) {
            console.error(`行为树组件初始化失败: ${this.behaviorTreeFile}`, error);
        }
    }
    
    /**
     * 加载行为树文件
     */
    private async loadBehaviorTree(): Promise<void> {
        return new Promise((resolve, reject) => {
            // 移除.btree扩展名，使用.bt.json
            const jsonPath = this.behaviorTreeFile.replace('.btree', '.bt.json');
            
            resources.load(jsonPath, JsonAsset, (err, asset) => {
                if (err) {
                    console.error(`加载行为树文件失败: ${jsonPath}`, err);
                    reject(err);
                    return;
                }
                
                try {
                    const treeData = asset.json as BehaviorTreeJSONConfig;
                    this.buildBehaviorTree(treeData);
                    resolve();
                } catch (buildError) {
                    console.error(`构建行为树失败: ${jsonPath}`, buildError);
                    reject(buildError);
                }
            });
        });
    }
    
    /**
     * 构建行为树
     */
    private buildBehaviorTree(treeData: BehaviorTreeJSONConfig) {
        // 创建基础执行上下文
        const baseContext = {
            cocosNode: this.cocosNode,
            unitComponent: this
        };
        
        // 使用@esengine/ai的BehaviorTreeBuilder构建行为树
        // 这会自动创建黑板并设置所有配置
        const result = BehaviorTreeBuilder.fromBehaviorTreeConfig(treeData, baseContext);
        this.behaviorTree = result.tree;
        this.blackboard = result.blackboard;
        this.context = result.context;
    }
    
    /**
     * 设置黑板
     */
    private setupBlackboard() {
        if (!this.blackboard || !this.cocosNode) return;
        
        // 注意：只设置行为树中实际定义的变量
        // 这些变量需要在对应的.btree文件的blackboard数组中预先定义
        
        // 设置基础信息 - 注释掉未在行为树中定义的变量
        // this.blackboard.setValue('entityName', this.cocosNode.name);
        // this.blackboard.setValue('currentTime', Date.now() / 1000);
        // this.blackboard.setValue('deltaTime', 0.016);
        // this.blackboard.setValue('worldPosition', this.cocosNode.worldPosition);
        
        console.log('BehaviorTreeComponent黑板设置完成，未设置任何变量以避免警告');
    }
    
    /**
     * 更新行为树
     */
    update(deltaTime: number) {
        if (!this.isLoaded || !this.isRunning || !this.behaviorTree || !this.context) return;
        
        // 控制更新频率
        this.lastTickTime += deltaTime;
        if (this.lastTickTime < this.tickInterval) return;
        
        this.lastTickTime = 0;
        
        // 更新黑板中的时间信息 - 注释掉未在行为树中定义的变量
        if (this.blackboard) {
            // 只更新行为树中实际定义的变量
            // this.blackboard.setValue('deltaTime', deltaTime);
            // this.blackboard.setValue('currentTime', Date.now() / 1000);
            // if (this.cocosNode) {
            //     this.blackboard.setValue('worldPosition', this.cocosNode.worldPosition);
            // }
        }
        
        // 执行行为树
        try {
            this.behaviorTree.tick();
        } catch (error) {
            console.error(`行为树执行错误:`, error);
        }
    }
    
    /**
     * 获取黑板
     */
    getBlackboard(): Blackboard | null {
        return this.blackboard;
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
        if (this.behaviorTree) {
            this.behaviorTree.reset();
        }
    }
} 