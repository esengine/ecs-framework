import { _decorator, Component, Node, Vec3, Material, MeshRenderer, Color, tween } from 'cc';
import { BehaviorTreeComponent } from './BehaviorTreeComponent';

// 简化的ECS组件基类
export class ECSComponent {
    public entity: any = null;
}

// 简化的Entity类
export class Entity {
    public name: string = '';
    private components: Map<any, any> = new Map();
    
    constructor(name: string) {
        this.name = name;
    }
    
    addComponent(component: any) {
        this.components.set(component.constructor, component);
        component.entity = this;
    }
    
    getComponent<T>(componentClass: any): T | null {
        return this.components.get(componentClass) || null;
    }
    
    hasComponent(componentClass: any): boolean {
        return this.components.has(componentClass);
    }
}

// 简化的Core类
export class Core {
    static entityManager = {
        entities: [] as Entity[],
        createEntity: (name: string) => {
            const entity = new Entity(name);
            Core.entityManager.entities.push(entity);
            return entity;
        },
        destroyEntity: (entity: Entity) => {
            const index = Core.entityManager.entities.indexOf(entity);
            if (index !== -1) {
                Core.entityManager.entities.splice(index, 1);
            }
        }
    };
    
    static create(config?: any) {
        console.log('ECS Core initialized with config:', config);
    }
    
    static update(deltaTime: number) {
        // 简化的更新逻辑
    }
}

const { ccclass, property } = _decorator;

/**
 * 单位配置接口
 */
export interface UnitConfig {
    unitType: string;
    behaviorTreeFile: string;
    maxHealth: number;
    moveSpeed: number;
    attackRange: number;
    attackDamage: number;
    color: string;
}

/**
 * 单位状态组件
 */
export class UnitStateComponent extends ECSComponent {
    public unitType: string = '';
    public maxHealth: number = 100;
    public currentHealth: number = 100;
    public moveSpeed: number = 3;
    public attackRange: number = 2;
    public attackDamage: number = 25;
    public isSelected: boolean = false;
    public currentCommand: string = 'idle';
    public targetPosition: Vec3 = Vec3.ZERO.clone();
    public targetNode: Node | null = null;
    public lastAttackTime: number = 0;
    public attackCooldown: number = 1.5;
    public color: string = 'white';
}

/**
 * 单位组件 - Cocos Creator组件，管理单位的可视化和ECS实体
 */
@ccclass('UnitComponent')
export class UnitComponent extends Component {
    
    @property
    showDebugInfo: boolean = true;
    
    private entity: Entity | null = null;
    private unitState: UnitStateComponent | null = null;
    private behaviorTreeComponent: BehaviorTreeComponent | null = null;
    private meshRenderer: MeshRenderer | null = null;
    private originalMaterial: Material | null = null;
    private selectionMaterial: Material | null = null;
    
    onLoad() {
        this.meshRenderer = this.getComponent(MeshRenderer);
        if (this.meshRenderer && this.meshRenderer.material) {
            this.originalMaterial = this.meshRenderer.material;
        }
    }
    
    /**
     * 设置单位配置
     */
    setup(config: UnitConfig) {
        // 创建ECS实体
        this.entity = Core.entityManager.createEntity(`Unit_${this.node.name}`);
        
        // 添加单位状态组件
        this.unitState = new UnitStateComponent();
        this.unitState.unitType = config.unitType;
        this.unitState.maxHealth = config.maxHealth;
        this.unitState.currentHealth = config.maxHealth;
        this.unitState.moveSpeed = config.moveSpeed;
        this.unitState.attackRange = config.attackRange;
        this.unitState.attackDamage = config.attackDamage;
        this.unitState.color = config.color;
        this.entity.addComponent(this.unitState);
        
        // 添加行为树组件
        this.behaviorTreeComponent = new BehaviorTreeComponent();
        this.behaviorTreeComponent.behaviorTreeFile = config.behaviorTreeFile;
        this.behaviorTreeComponent.cocosNode = this.node;
        this.entity.addComponent(this.behaviorTreeComponent);
        
        // 设置材质颜色
        this.setUnitColor(config.color);
        
        console.log(`单位 ${this.node.name} 设置完成 - 类型: ${config.unitType}, 行为树: ${config.behaviorTreeFile}`);
    }
    
    /**
     * 设置单位颜色
     */
    private setUnitColor(colorName: string) {
        if (!this.meshRenderer || !this.meshRenderer.material) return;
        
        const colorMap: { [key: string]: Color } = {
            'red': Color.RED,
            'green': Color.GREEN,
            'blue': Color.BLUE,
            'yellow': Color.YELLOW,
            'white': Color.WHITE,
            'cyan': Color.CYAN,
            'magenta': Color.MAGENTA
        };
        
        const color = colorMap[colorName] || Color.WHITE;
        this.meshRenderer.material.setProperty('mainColor', color);
    }
    
    /**
     * 设置选择状态
     */
    setSelected(selected: boolean) {
        if (!this.unitState) return;
        
        this.unitState.isSelected = selected;
        
        // 视觉效果
        if (selected) {
            this.showSelectionEffect();
        } else {
            this.hideSelectionEffect();
        }
    }
    
    /**
     * 显示选择效果
     */
    private showSelectionEffect() {
        // 添加选择圈效果
        tween(this.node)
            .to(0.3, { scale: new Vec3(1.1, 1.1, 1.1) })
            .to(0.3, { scale: Vec3.ONE })
            .union()
            .repeatForever()
            .start();
    }
    
    /**
     * 隐藏选择效果
     */
    private hideSelectionEffect() {
        // 停止所有缩放动画
        tween(this.node).stop();
        this.node.setScale(Vec3.ONE);
    }
    
    /**
     * 发布命令
     */
    issueCommand(command: string, target?: Vec3 | Node) {
        if (!this.unitState || !this.behaviorTreeComponent) return;
        
        this.unitState.currentCommand = command;
        
        // 设置目标
        if (target instanceof Vec3) {
            this.unitState.targetPosition = target.clone();
            this.unitState.targetNode = null;
        } else if (target instanceof Node) {
            this.unitState.targetPosition = target.worldPosition.clone();
            this.unitState.targetNode = target;
        }
        
        // 通过黑板更新行为树状态
        const blackboard = this.behaviorTreeComponent.getBlackboard();
        if (blackboard) {
            blackboard.setValue('currentCommand', command);
            blackboard.setValue('hasTarget', target !== undefined);
            blackboard.setValue('targetPosition', this.unitState.targetPosition);
            
            if (target instanceof Node) {
                blackboard.setValue('targetType', target.name.includes('Resource') ? 'resource' : 
                                           target.name.includes('Building') ? 'building' : 'unit');
            }
        }
        
        console.log(`单位 ${this.node.name} 接收命令: ${command}`, target);
    }
    
    /**
     * 获取单位状态
     */
    getUnitState(): UnitStateComponent | null {
        return this.unitState;
    }
    
    /**
     * 获取行为树组件
     */
    getBehaviorTreeComponent(): BehaviorTreeComponent | null {
        return this.behaviorTreeComponent;
    }
    
    /**
     * 受到伤害
     */
    takeDamage(damage: number) {
        if (!this.unitState) return;
        
        this.unitState.currentHealth = Math.max(0, this.unitState.currentHealth - damage);
        
        // 更新黑板
        const blackboard = this.behaviorTreeComponent?.getBlackboard();
        if (blackboard) {
            blackboard.setValue('currentHealth', this.unitState.currentHealth);
            blackboard.setValue('healthPercentage', this.unitState.currentHealth / this.unitState.maxHealth);
            blackboard.setValue('isLowHealth', this.unitState.currentHealth < this.unitState.maxHealth * 0.3);
        }
        
        // 视觉效果
        this.showDamageEffect();
        
        if (this.unitState.currentHealth <= 0) {
            this.die();
        }
    }
    
    /**
     * 显示受伤效果
     */
    private showDamageEffect() {
        if (!this.meshRenderer || !this.meshRenderer.material) return;
        
        // 闪红效果
        const originalColor = this.meshRenderer.material.getProperty('mainColor') as Color;
        this.meshRenderer.material.setProperty('mainColor', Color.RED);
        
        this.scheduleOnce(() => {
            if (this.meshRenderer && this.meshRenderer.material) {
                this.meshRenderer.material.setProperty('mainColor', originalColor);
            }
        }, 0.2);
    }
    
    /**
     * 单位死亡
     */
    private die() {
        console.log(`单位 ${this.node.name} 死亡`);
        
        // 从ECS系统中移除实体
        if (this.entity) {
            Core.entityManager.destroyEntity(this.entity);
        }
        
        // 播放死亡动画后销毁节点
        tween(this.node)
            .to(0.5, { scale: Vec3.ZERO })
            .call(() => {
                this.node.destroy();
            })
            .start();
    }
    
    update(deltaTime: number) {
        if (!this.unitState || !this.behaviorTreeComponent) return;
        
        // 更新黑板中的时间相关变量
        const blackboard = this.behaviorTreeComponent.getBlackboard();
        if (blackboard) {
            blackboard.setValue('deltaTime', deltaTime);
            blackboard.setValue('currentTime', Date.now() / 1000);
            blackboard.setValue('worldPosition', this.node.worldPosition);
        }
        
        // 调试信息显示
        if (this.showDebugInfo) {
            this.updateDebugInfo();
        }
    }
    
    /**
     * 更新调试信息
     */
    private updateDebugInfo() {
        // 可以在这里添加调试信息的显示逻辑
        // 比如在单位上方显示状态文本等
    }
    
    onDestroy() {
        // 清理ECS实体
        if (this.entity) {
            Core.entityManager.destroyEntity(this.entity);
        }
        
        // 停止所有动画
        tween(this.node).stop();
    }
} 