import { _decorator, Component, Node, Vec3, MeshRenderer, Color, tween } from 'cc';
import { BehaviorTreeManager } from './BehaviorTreeManager';
import { RTSBehaviorHandler } from './RTSBehaviorHandler';

const { ccclass, property } = _decorator;

/**
 * 单位配置接口
 */
export interface UnitConfig {
    unitType: string;
    behaviorTreeName: string;
    maxHealth: number;
    moveSpeed: number;
    attackRange: number;
    attackDamage: number;
    color: string;
}

/**
 * 单位控制器
 */
@ccclass('UnitController')
export class UnitController extends Component {
    
    @property
    showDebugInfo: boolean = true;
    
    // 单位属性
    public unitType: string = '';
    public maxHealth: number = 100;
    public currentHealth: number = 100;
    public moveSpeed: number = 1.5;
    public attackRange: number = 2;
    public attackDamage: number = 25;
    public isSelected: boolean = false;
    public currentCommand: string = 'idle';
    public targetPosition: Vec3 = Vec3.ZERO.clone();
    public targetNode: Node | null = null;
    public lastAttackTime: number = 0;
    public attackCooldown: number = 1.5;
    public color: string = 'white';
    
    // 体力系统属性
    public maxStamina: number = 100;
    public currentStamina: number = 100;
    public homePosition: Vec3 = Vec3.ZERO.clone();
    public staminaRecoveryRate: number = 20; // 每秒恢复的体力
    public staminaCostPerMining: number = 15; // 每次挖矿消耗的体力
    
    // 移动状态管理
    private isMoving: boolean = false;
    private moveStartTime: number = 0;
    private lastTargetUpdateTime: number = 0;
    
    private behaviorTreeManager: BehaviorTreeManager | null = null;
    private behaviorHandler: Component | null = null;
    private meshRenderer: MeshRenderer | null = null;
    
    onLoad() {
        this.meshRenderer = this.getComponent(MeshRenderer);
        
        // 创建行为树管理器
        this.behaviorTreeManager = this.addComponent(BehaviorTreeManager);
        
        // 添加RTS行为处理器
        try {
            // 添加RTSBehaviorHandler组件
            this.behaviorHandler = this.addComponent(RTSBehaviorHandler);
        } catch (error) {
            console.warn('RTSBehaviorHandler组件添加失败', error);
        }
    }
    
    /**
     * 设置单位配置
     */
    setup(config: UnitConfig) {
        this.unitType = config.unitType;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.maxHealth;
        this.moveSpeed = config.moveSpeed;
        this.attackRange = config.attackRange;
        this.attackDamage = config.attackDamage;
        this.color = config.color;
        
        // 设置材质颜色
        this.setUnitColor(config.color);
        
        // 设置节点名称显示单位类型
        this.node.name = `${config.unitType.toUpperCase()}_${this.node.name}`;
        
        // 初始化行为树
        if (this.behaviorTreeManager) {
            this.behaviorTreeManager.initializeBehaviorTree(config.behaviorTreeName, this);
        }
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
        this.isSelected = selected;
        
        // 视觉效果
        if (selected) {
            this.showSelectionEffect();
        } else {
            this.hideSelectionEffect();
        }
        
        // 更新行为树黑板
        if (this.behaviorTreeManager) {
            this.behaviorTreeManager.updateBlackboardValue('isSelected', selected);
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
        this.currentCommand = command;
        
        // 设置目标
        if (target instanceof Vec3) {
            this.targetPosition = target.clone();
            this.targetNode = null;
        } else if (target instanceof Node) {
            this.targetPosition = target.worldPosition.clone();
            this.targetNode = target;
        }
        
        // 更新行为树黑板
        if (this.behaviorTreeManager) {
            this.behaviorTreeManager.updateBlackboardValue('currentCommand', command);
            this.behaviorTreeManager.updateBlackboardValue('hasTarget', target !== undefined);
            this.behaviorTreeManager.updateBlackboardValue('targetPosition', this.targetPosition);
            
            if (target instanceof Node) {
                this.behaviorTreeManager.updateBlackboardValue('targetType', 
                    target.name.includes('Resource') ? 'resource' : 
                    target.name.includes('Building') ? 'building' : 'unit');
            }
        }
    }
    
    /**
     * 设置黑板变量值
     */
    setBlackboardValue(key: string, value: any) {
        if (this.behaviorTreeManager) {
            this.behaviorTreeManager.updateBlackboardValue(key, value);
        }
    }
    
    /**
     * 获取黑板变量值
     */
    getBlackboardValue(key: string): any {
        return this.behaviorTreeManager?.getBlackboardValue(key);
    }
    
    /**
     * 设置移动目标
     */
    setTarget(position: Vec3) {
        this.targetPosition = position.clone();
        this.isMoving = true;
        this.moveStartTime = Date.now();
    }
    
    /**
     * 清除移动目标
     */
    clearTarget() {
        this.targetPosition = Vec3.ZERO.clone();
        this.isMoving = false;
    }
    
    /**
     * 受到伤害
     */
    takeDamage(damage: number) {
        this.currentHealth = Math.max(0, this.currentHealth - damage);
        
        // 更新行为树黑板
        if (this.behaviorTreeManager) {
            this.behaviorTreeManager.updateBlackboardValue('currentHealth', this.currentHealth);
            this.behaviorTreeManager.updateBlackboardValue('healthPercentage', this.currentHealth / this.maxHealth);
            this.behaviorTreeManager.updateBlackboardValue('isLowHealth', this.currentHealth < this.maxHealth * 0.3);
        }
        
        // 视觉效果
        this.showDamageEffect();
        
        if (this.currentHealth <= 0) {
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
        
        // 播放死亡动画后销毁节点
        tween(this.node)
            .to(0.5, { scale: Vec3.ZERO })
            .call(() => {
                this.node.destroy();
            })
            .start();
    }
    
    /**
     * 移动到目标位置（只在水平面移动，不改变Y轴）
     */
    moveToTarget(targetPos: Vec3, speed?: number, deltaTime?: number): boolean {
        const currentPos = this.node.worldPosition;
        const distance = Vec3.distance(currentPos, targetPos);
        
        if (distance < 0.5) {
            this.isMoving = false;
            return true;
        }
        
        const actualSpeed = speed || this.moveSpeed;
        const actualDeltaTime = deltaTime || 0.016;
        const direction = new Vec3();
        Vec3.subtract(direction, targetPos, currentPos);
        direction.normalize();
        
        const moveDistance = actualSpeed * actualDeltaTime;
        const newPosition = new Vec3();
        Vec3.scaleAndAdd(newPosition, currentPos, direction, moveDistance);
        
        this.node.setWorldPosition(newPosition);
        this.isMoving = true;
        
        return false;
    }
    
    /**
     * 攻击目标
     */
    attackTarget(): boolean {
        const currentTime = Date.now();
        if (currentTime - this.lastAttackTime < this.attackCooldown * 1000) {
            return false;
        }
        
        if (this.targetNode && this.targetNode.isValid) {
            const distance = Vec3.distance(this.node.worldPosition, this.targetNode.worldPosition);
            if (distance <= this.attackRange) {
                this.lastAttackTime = currentTime;
                return true;
            }
        }
        
        return false;
    }
    
    update(deltaTime: number) {
        if (this.behaviorTreeManager) {
            this.behaviorTreeManager.update(deltaTime);
        }
        
        if (this.isMoving && !this.targetPosition.equals(Vec3.ZERO)) {
            const reached = this.moveToTarget(this.targetPosition, this.moveSpeed, deltaTime);
            if (reached) {
                this.clearTarget();
            }
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
        // 停止所有动画
        tween(this.node).stop();
    }
} 