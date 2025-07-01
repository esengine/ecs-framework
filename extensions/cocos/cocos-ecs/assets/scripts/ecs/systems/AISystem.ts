import { EntitySystem, Entity, Matcher, Time } from '@esengine/ecs-framework';
import { AIComponent, Transform, Health } from '../components';

/**
 * AI系统 - 处理AI行为和状态机
 */
export class AISystem extends EntitySystem {
    
    /** 系统处理的实体计数器 */
    private processedEntityCount: number = 0;
    
    /** 状态转换计数器 */
    private stateTransitionCount: number = 0;
    
    constructor() {
        // 处理具有AI组件的实体
        super(Matcher.empty().all(AIComponent));
    }
    
    /**
     * 处理所有实体
     */
    protected process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;
        const currentTime = Time.totalTime;
        
        this.processedEntityCount = entities.length;
        
        for (const entity of entities) {
            this.processEntity(entity, deltaTime, currentTime);
        }
        
        // 批量处理AI间的交互
        this.processAIInteractions(entities);
    }
    
    /**
     * 处理单个实体
     */
    private processEntity(entity: Entity, deltaTime: number, currentTime: number): void {
        const ai = entity.getComponent(AIComponent);
        const transform = entity.getComponent(Transform);
        const health = entity.getComponent(Health);
        
        if (!ai) return;
        
        // 更新感知系统
        ai.updatePerception(deltaTime);
        
        // 处理状态机
        this.updateStateMachine(ai, deltaTime);
        
        // 更新行为树
        this.updateBehaviorTree(ai, deltaTime);
        
        // 处理AI能力（如果有Transform和Health组件）
        if (transform && health) {
            this.updateAICapabilities(ai, transform, health, deltaTime);
        }
        
        // 处理记忆衰减
        this.updateMemory(ai, deltaTime);
    }
    
    /**
     * 更新状态机
     */
    private updateStateMachine(ai: AIComponent, deltaTime: number): void {
        const currentStateName = ai.currentState;
        const transitions = ai.stateMachine.transitions.get(currentStateName);
        
        if (transitions) {
            // 按优先级排序转换条件
            const sortedTransitions = transitions.sort((a, b) => b.priority - a.priority);
            
            for (const transition of sortedTransitions) {
                if (transition.condition()) {
                    // 执行状态转换
                    const currentState = ai.stateMachine.states.get(currentStateName);
                    const newState = ai.stateMachine.states.get(transition.targetState);
                    
                    if (currentState && newState) {
                        currentState.exit();
                        ai.currentState = transition.targetState as any;
                        newState.enter();
                        this.stateTransitionCount++;
                        break;
                    }
                }
            }
        }
    }
    
    /**
     * 更新行为树
     */
    private updateBehaviorTree(ai: AIComponent, deltaTime: number): void {
        const behaviorTree = ai.config.behaviorTree;
        const blackboard = behaviorTree.blackboard;
        
        // 更新黑板数据
        blackboard.set('deltaTime', deltaTime);
        blackboard.set('currentTime', Date.now());
        
        // 模拟行为树执行
        const executionResult = this.executeBehaviorNode(behaviorTree.rootNode, ai);
        
        // 记录执行历史
        behaviorTree.executionHistory.push({
            nodeName: behaviorTree.rootNode.name,
            startTime: Date.now(),
            endTime: Date.now() + Math.random() * 10,
            result: executionResult,
            data: { deltaTime }
        });
        
        // 保持历史记录在合理范围内
        if (behaviorTree.executionHistory.length > 50) {
            behaviorTree.executionHistory.shift();
        }
    }
    
    /**
     * 执行行为树节点（模拟）
     */
    private executeBehaviorNode(node: any, ai: AIComponent): 'success' | 'failure' | 'running' {
        // 简单的行为树执行模拟
        switch (node.name) {
            case 'root':
            case 'selector':
                // 选择器节点：尝试执行子节点直到一个成功
                for (const child of node.children) {
                    const result = this.executeBehaviorNode(child, ai);
                    if (result === 'success' || result === 'running') {
                        return result;
                    }
                }
                return 'failure';
                
            case 'sequence':
                // 序列节点：按顺序执行所有子节点
                for (const child of node.children) {
                    const result = this.executeBehaviorNode(child, ai);
                    if (result === 'failure' || result === 'running') {
                        return result;
                    }
                }
                return 'success';
                
            case 'condition':
                // 条件节点：检查AI状态
                return ai.config.personality.intelligence > 0.5 ? 'success' : 'failure';
                
            case 'action':
                // 动作节点：执行AI行为
                return Math.random() > 0.3 ? 'success' : 'running';
                
            default:
                return 'failure';
        }
    }
    
    /**
     * 更新AI能力
     */
    private updateAICapabilities(ai: AIComponent, transform: Transform, health: Health, deltaTime: number): void {
        const capabilities = ai.config.capabilities;
        
        // 根据健康状况调整能力
        const healthRatio = health.currentHealth / health.maxHealth;
        const effectiveSpeed = capabilities.movementSpeed * healthRatio;
        
        // 更新移动速度
        transform.speed = effectiveSpeed;
        
        // 根据个性调整行为
        if (ai.config.personality.aggression > 0.7 && healthRatio > 0.5) {
            // 高攻击性且健康状况良好时更主动
            ai.currentState = 'chase';
        } else if (healthRatio < 0.3) {
            // 生命值低时逃跑
            ai.currentState = 'flee';
        }
    }
    
    /**
     * 更新记忆系统
     */
    private updateMemory(ai: AIComponent, deltaTime: number): void {
        const memory = ai.config.memory;
        const currentTime = Date.now();
        
        // 衰减已知位置的可信度
        memory.knownLocations.forEach(location => {
            const timeSinceVisit = currentTime - location.lastVisited;
            const decayFactor = Math.exp(-timeSinceVisit / 30000); // 30秒衰减率
            location.confidence *= decayFactor;
        });
        
        // 移除可信度过低的位置
        memory.knownLocations = memory.knownLocations.filter(location => location.confidence > 0.1);
        
        // 衰减关系信任度
        memory.relationships.forEach(relation => {
            const timeSinceInteraction = currentTime - relation.lastInteraction;
            if (timeSinceInteraction > 60000) { // 60秒没有交互
                relation.trustLevel *= 0.99; // 缓慢衰减
            }
        });
    }
    
    /**
     * 处理AI间的交互
     */
    private processAIInteractions(entities: Entity[]): void {
        const aiEntities = entities.filter(e => e.getComponent(AIComponent));
        
        for (let i = 0; i < aiEntities.length; i++) {
            for (let j = i + 1; j < aiEntities.length; j++) {
                this.processAIPair(aiEntities[i], aiEntities[j]);
            }
        }
    }
    
    /**
     * 处理两个AI实体间的交互
     */
    private processAIPair(entity1: Entity, entity2: Entity): void {
        const ai1 = entity1.getComponent(AIComponent);
        const ai2 = entity2.getComponent(AIComponent);
        const transform1 = entity1.getComponent(Transform);
        const transform2 = entity2.getComponent(Transform);
        
        if (!ai1 || !ai2 || !transform1 || !transform2) return;
        
        // 计算距离
        const distance = Math.sqrt(
            Math.pow(transform1.position.x - transform2.position.x, 2) +
            Math.pow(transform1.position.y - transform2.position.y, 2)
        );
        
        // 视线范围内的交互
        if (distance <= ai1.config.capabilities.sightRange) {
            this.handleVisualContact(ai1, ai2, entity1, entity2, distance);
        }
        
        // 听力范围内的交互
        if (distance <= ai1.config.capabilities.hearingRange) {
            this.handleAudioContact(ai1, ai2, distance);
        }
        
        // 创建盟友关系（随机）
        if (Math.random() < 0.001 && !ai1.allyIds.includes(entity2.id)) { // 0.1%概率每帧
            ai1.addAlly(entity2.id);
        }
    }
    
    /**
     * 处理视觉接触
     */
    private handleVisualContact(ai1: AIComponent, ai2: AIComponent, entity1: Entity, entity2: Entity, distance: number): void {
        const currentTime = Date.now();
        
        // 添加到可见实体列表
        const existingEntry = ai1.perception.visibleEntities.find(e => e.entityId === entity2.id);
        if (existingEntry) {
            existingEntry.distance = distance;
            existingEntry.lastSeen = currentTime;
            existingEntry.componentId = ai2.id; // 使用组件ID避免循环引用
        } else {
            ai1.perception.visibleEntities.push({
                entityId: entity2.id,
                position: entity2.getComponent(Transform)!.position.clone(),
                distance: distance,
                angle: Math.atan2(
                    entity2.getComponent(Transform)!.position.y - entity1.getComponent(Transform)!.position.y,
                    entity2.getComponent(Transform)!.position.x - entity1.getComponent(Transform)!.position.x
                ),
                lastSeen: currentTime,
                componentId: ai2.id
            });
        }
    }
    
    /**
     * 处理音频接触
     */
    private handleAudioContact(ai1: AIComponent, ai2: AIComponent, distance: number): void {
        const soundVolume = 1.0 - (distance / ai1.config.capabilities.hearingRange);
        
        ai1.perception.audibleSounds.push({
            source: ai2.entity.getComponent(Transform)!.position.clone(),
            volume: soundVolume,
            type: 'movement',
            timestamp: Date.now()
        });
    }
    
    /**
     * 系统初始化时调用
     */
    public initialize(): void {
        super.initialize();
        console.log('🤖 AI系统已启动');
    }
    
    /**
     * 获取系统统计信息
     */
    public getSystemStats(): any {
        return {
            processedEntities: this.processedEntityCount,
            stateTransitions: this.stateTransitionCount,
            systemName: 'AISystem'
        };
    }
} 