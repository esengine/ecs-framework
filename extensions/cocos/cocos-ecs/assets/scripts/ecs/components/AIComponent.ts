import { Component } from '@esengine/ecs-framework';
import { Vec3 } from 'cc';

/**
 * AI组件 - 复杂的AI行为和状态管理
 */
export class AIComponent extends Component {
    /** AI状态 */
    public currentState: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'dead' = 'idle';
    
    /** 目标ID（避免循环引用） */
    public targetId: number | null = null;
    
    /** AI伙伴ID列表（避免循环引用） */
    public allyIds: number[] = [];
    
    /** 敌人ID列表 */
    public enemyIds: number[] = [];
    
    /** 复杂的AI配置 */
    public config: {
        personality: {
            aggression: number;      // 攻击性 0-1
            curiosity: number;       // 好奇心 0-1
            loyalty: number;         // 忠诚度 0-1
            intelligence: number;    // 智力 0-1
        };
        capabilities: {
            sightRange: number;
            hearingRange: number;
            movementSpeed: number;
            attackDamage: number;
            health: number;
        };
        behaviorTree: {
            rootNode: BehaviorNode;
            blackboard: Map<string, any>;
            executionHistory: BehaviorExecution[];
        };
        memory: {
            lastSeenEnemyPosition: Vec3 | null;
            lastSeenEnemyTime: number;
            knownLocations: Array<{
                position: Vec3;
                type: 'safe' | 'danger' | 'resource' | 'patrol';
                confidence: number;
                lastVisited: number;
            }>;
            relationships: Map<number, {
                entityId: number;
                relationship: 'ally' | 'enemy' | 'neutral';
                trustLevel: number;
                lastInteraction: number;
                interactionHistory: Array<{
                    type: 'friendly' | 'hostile' | 'neutral';
                    timestamp: number;
                    impact: number;
                }>;
            }>;
        };
    };
    
    /** 状态机 */
    public stateMachine: {
        states: Map<string, AIState>;
        transitions: Map<string, Array<{
            targetState: string;
            condition: () => boolean;
            priority: number;
        }>>;
        stateHistory: Array<{
            state: string;
            enterTime: number;
            exitTime: number;
            data: any;
        }>;
    };
    
            /** 感知系统 */
        public perception: {
            visibleEntities: Array<{
                entityId: number;
                position: Vec3;
                distance: number;
                angle: number;
                lastSeen: number;
                componentId?: number; // 使用组件ID避免循环引用
            }>;
        audibleSounds: Array<{
            source: Vec3;
            volume: number;
            type: string;
            timestamp: number;
        }>;
        tacticleInfo: Array<{
            entityId: number;
            contactPoint: Vec3;
            force: number;
            timestamp: number;
        }>;
    };
    
    constructor() {
        super();
        
        // 初始化AI配置
        this.config = {
            personality: {
                aggression: Math.random(),
                curiosity: Math.random(),
                loyalty: Math.random(),
                intelligence: Math.random()
            },
            capabilities: {
                sightRange: 100 + Math.random() * 100,
                hearingRange: 50 + Math.random() * 50,
                movementSpeed: 80 + Math.random() * 40,
                attackDamage: 10 + Math.random() * 20,
                health: 80 + Math.random() * 40
            },
            behaviorTree: {
                rootNode: new BehaviorNode('root'),
                blackboard: new Map(),
                executionHistory: []
            },
            memory: {
                lastSeenEnemyPosition: null,
                lastSeenEnemyTime: 0,
                knownLocations: [],
                relationships: new Map()
            }
        };
        
        // 初始化状态机
        this.stateMachine = {
            states: new Map(),
            transitions: new Map(),
            stateHistory: []
        };
        
        // 初始化感知系统
        this.perception = {
            visibleEntities: [],
            audibleSounds: [],
            tacticleInfo: []
        };
        
        this.initializeStateMachine();
        this.initializeBehaviorTree();
    }
    
    /**
     * 初始化状态机
     */
    private initializeStateMachine(): void {
        // 添加基本状态
        this.stateMachine.states.set('idle', new AIState('idle', this));
        this.stateMachine.states.set('patrol', new AIState('patrol', this));
        this.stateMachine.states.set('chase', new AIState('chase', this));
        this.stateMachine.states.set('attack', new AIState('attack', this));
        this.stateMachine.states.set('flee', new AIState('flee', this));
        
        // 设置状态转换
        this.stateMachine.transitions.set('idle', [
            { targetState: 'patrol', condition: () => Math.random() > 0.8, priority: 1 },
            { targetState: 'chase', condition: () => this.perception.visibleEntities.length > 0, priority: 3 }
        ]);
        
        this.stateMachine.transitions.set('patrol', [
            { targetState: 'idle', condition: () => Math.random() > 0.9, priority: 1 },
            { targetState: 'chase', condition: () => this.hasVisibleEnemies(), priority: 3 }
        ]);
    }
    
    /**
     * 初始化行为树
     */
    private initializeBehaviorTree(): void {
        const root = this.config.behaviorTree.rootNode;
        
        // 构建简单的行为树结构
        const selectorNode = new BehaviorNode('selector');
        const sequenceNode = new BehaviorNode('sequence');
        const conditionNode = new BehaviorNode('condition');
        const actionNode = new BehaviorNode('action');
        
        root.addChild(selectorNode);
        selectorNode.addChild(sequenceNode);
        sequenceNode.addChild(conditionNode);
        sequenceNode.addChild(actionNode);
        
        // 设置黑板数据
        this.config.behaviorTree.blackboard.set('lastPatrolPoint', new Vec3());
        this.config.behaviorTree.blackboard.set('alertLevel', 0);
        this.config.behaviorTree.blackboard.set('energy', 100);
    }
    
    /**
     * 添加盟友（避免循环引用）
     */
    public addAlly(allyEntityId: number): void {
        if (!this.allyIds.includes(allyEntityId)) {
            this.allyIds.push(allyEntityId);
            
            // 更新关系记录
            this.config.memory.relationships.set(allyEntityId, {
                entityId: allyEntityId,
                relationship: 'ally',
                trustLevel: 0.8,
                lastInteraction: Date.now(),
                interactionHistory: []
            });
        }
    }
    
    /**
     * 设置目标（避免循环引用）
     */
    public setTarget(targetEntityId: number): void {
        this.targetId = targetEntityId;
        // 不再需要双向引用
    }
    
    /**
     * 更新感知信息
     */
    public updatePerception(deltaTime: number): void {
        // 清理过期的感知信息
        const currentTime = Date.now();
        this.perception.visibleEntities = this.perception.visibleEntities.filter(
            entity => currentTime - entity.lastSeen < 5000
        );
        
        this.perception.audibleSounds = this.perception.audibleSounds.filter(
            sound => currentTime - sound.timestamp < 2000
        );
        
        // 更新记忆中的位置信息
        this.config.memory.knownLocations.forEach(location => {
            location.confidence *= 0.999; // 随时间衰减可信度
        });
    }
    
    /**
     * 检查是否有可见敌人
     */
    private hasVisibleEnemies(): boolean {
        return this.perception.visibleEntities.some(entity => 
            this.config.memory.relationships.get(entity.entityId)?.relationship === 'enemy'
        );
    }
    
    /**
     * 重置组件
     */
    public reset(): void {
        // 清理ID数组（不再需要处理循环引用）
        this.allyIds = [];
        this.enemyIds = [];
        this.targetId = null;
        this.currentState = 'idle';
        
        this.config.behaviorTree.blackboard.clear();
        this.config.memory.relationships.clear();
        this.perception.visibleEntities = [];
        this.perception.audibleSounds = [];
        this.perception.tacticleInfo = [];
    }
}

/**
 * 行为树节点
 */
class BehaviorNode {
    public name: string;
    public children: BehaviorNode[] = [];
    public parent: BehaviorNode | null = null;
    public data: Map<string, any> = new Map();
    
    constructor(name: string) {
        this.name = name;
    }
    
    public addChild(child: BehaviorNode): void {
        this.children.push(child);
        child.parent = this;
    }
}

/**
 * 行为执行记录
 */
interface BehaviorExecution {
    nodeName: string;
    startTime: number;
    endTime: number;
    result: 'success' | 'failure' | 'running';
    data: any;
}

/**
 * AI状态
 */
class AIState {
    public name: string;
    public owner: AIComponent;
    public enterTime: number = 0;
    public data: Map<string, any> = new Map();
    
    constructor(name: string, owner: AIComponent) {
        this.name = name;
        this.owner = owner;
    }
    
    public enter(): void {
        this.enterTime = Date.now();
    }
    
    public exit(): void {
        // 记录状态历史
        this.owner.stateMachine.stateHistory.push({
            state: this.name,
            enterTime: this.enterTime,
            exitTime: Date.now(),
            data: Object.fromEntries(this.data)
        });
    }
} 