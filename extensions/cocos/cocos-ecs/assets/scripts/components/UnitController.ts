import { _decorator, Component, Node, Vec3, Material, MeshRenderer, Color, tween } from 'cc';
import { BehaviorTreeManager } from './BehaviorTreeManager';

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
 * 单位控制器 - 纯Cocos Creator组件，管理单位的行为和状态
 */
@ccclass('UnitController')
export class UnitController extends Component {
    
    @property
    showDebugInfo: boolean = true;
    
    // 单位属性
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
    
    private behaviorTreeManager: BehaviorTreeManager | null = null;
    private meshRenderer: MeshRenderer | null = null;
    
    onLoad() {
        this.meshRenderer = this.getComponent(MeshRenderer);
        
        // 创建行为树管理器
        this.behaviorTreeManager = this.addComponent(BehaviorTreeManager);
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
        
        // 初始化行为树
        if (this.behaviorTreeManager) {
            this.behaviorTreeManager.initializeBehaviorTree(config.behaviorTreeName, this);
        }
        
        console.log(`单位 ${this.node.name} 设置完成 - 类型: ${config.unitType}, 行为树: ${config.behaviorTreeName}`);
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
        
        console.log(`单位 ${this.node.name} 接收命令: ${command}`, target);
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
     * 移动到目标位置
     */
    moveToTarget(targetPos: Vec3, speed?: number): boolean {
        const currentPos = this.node.worldPosition;
        const distance = currentPos.subtract(targetPos).length();
        
        if (distance < 0.5) {
            return true; // 已到达目标
        }
        
        // 简单的移动逻辑
        const direction = targetPos.subtract(currentPos).normalize();
        const moveSpeed = speed || this.moveSpeed;
        const deltaTime = 1/60; // 假设60fps
        
        const newPosition = currentPos.add(direction.multiplyScalar(moveSpeed * deltaTime));
        this.node.setWorldPosition(newPosition);
        
        return false; // 还在移动中
    }
    
    /**
     * 攻击目标
     */
    attackTarget(): boolean {
        const currentTime = Date.now() / 1000;
        
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            return false; // 冷却中
        }
        
        // 执行攻击
        console.log(`${this.node.name} 执行攻击`);
        this.lastAttackTime = currentTime;
        
        // 更新行为树黑板
        if (this.behaviorTreeManager) {
            this.behaviorTreeManager.updateBlackboardValue('lastAttackTime', currentTime);
        }
        
        return true; // 攻击成功
    }
    
    update(deltaTime: number) {
        // 更新行为树黑板中的时间相关变量
        if (this.behaviorTreeManager) {
            this.behaviorTreeManager.updateBlackboardValue('deltaTime', deltaTime);
            this.behaviorTreeManager.updateBlackboardValue('currentTime', Date.now() / 1000);
            this.behaviorTreeManager.updateBlackboardValue('worldPosition', this.node.worldPosition);
            
            // 更新距离信息
            if (this.targetPosition) {
                const distance = this.node.worldPosition.subtract(this.targetPosition).length();
                this.behaviorTreeManager.updateBlackboardValue('distanceToTarget', distance);
                this.behaviorTreeManager.updateBlackboardValue('isInAttackRange', distance <= this.attackRange);
                this.behaviorTreeManager.updateBlackboardValue('isCloseToTarget', distance <= 1.0);
            }
            
            // 更新状态标志
            this.behaviorTreeManager.updateBlackboardValue('isIdle', this.currentCommand === 'idle');
            this.behaviorTreeManager.updateBlackboardValue('isMoving', this.currentCommand === 'move');
            this.behaviorTreeManager.updateBlackboardValue('isAttacking', this.currentCommand === 'attack');
            this.behaviorTreeManager.updateBlackboardValue('isGathering', this.currentCommand === 'gather');
            this.behaviorTreeManager.updateBlackboardValue('isPatrolling', this.currentCommand === 'patrol');
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