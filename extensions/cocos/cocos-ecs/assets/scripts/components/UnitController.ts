import { _decorator, Component, Node, Vec3, Material, MeshRenderer, Color, tween } from 'cc';
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
            console.warn('RTSBehaviorHandler组件添加失败，将使用默认行为处理', error);
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
        
        console.log(`🎮 单位设置完成: ${this.node.name} | 类型: ${config.unitType.toUpperCase()} | 行为树: ${config.behaviorTreeName}`);
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
     * 设置黑板变量值
     */
    setBlackboardValue(key: string, value: any) {
        if (this.behaviorTreeManager) {
            this.behaviorTreeManager.updateBlackboardValue(key, value);
        }
    }
    
    /**
     * 设置移动目标
     */
    setTarget(position: Vec3) {
        this.targetPosition = position.clone();
    }
    
    /**
     * 清除移动目标
     */
    clearTarget() {
        this.targetPosition = Vec3.ZERO.clone();
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
        
        // 只计算水平面距离（忽略Y轴）
        const currentPos2D = new Vec3(currentPos.x, 0, currentPos.z);
        const targetPos2D = new Vec3(targetPos.x, 0, targetPos.z);
        const distance = currentPos2D.subtract(targetPos2D).length();
        
        if (distance < 0.8) { // 增加到达阈值，减少抖动
            this.isMoving = false;
            return true; // 已到达目标
        }
        
        // 平滑移动逻辑（只在水平面）
        const direction2D = targetPos2D.subtract(currentPos2D).normalize();
        const moveSpeed = speed || this.moveSpeed;
        const dt = deltaTime || 0.016; // 使用传入的deltaTime或默认值
        
        // 计算移动距离，确保不会超过目标位置
        const moveDistance = Math.min(moveSpeed * dt, distance);
        const movement2D = direction2D.multiplyScalar(moveDistance);
        
        // 新位置保持原有的Y轴位置
        const newPosition = new Vec3(
            currentPos.x + movement2D.x,
            currentPos.y, // 保持Y轴不变
            currentPos.z + movement2D.z
        );
        
        this.node.setWorldPosition(newPosition);
        this.isMoving = true;
        
        // 减少日志输出频率
        if (Date.now() - this.moveStartTime > 1000) { // 每秒输出一次
            console.log(`${this.node.name}: 移动中 距离目标${distance.toFixed(2)}米`);
            this.moveStartTime = Date.now();
        }
        
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
        // 自动移动逻辑 - 如果有目标位置就自动移动
        if (this.targetPosition && !this.targetPosition.equals(Vec3.ZERO)) {
            const arrived = this.moveToTarget(this.targetPosition, undefined, deltaTime);
            if (arrived) {
                // 不要清除目标位置，让行为树决定下一步动作
                this.isMoving = false;
                
                // 更新黑板状态
                if (this.behaviorTreeManager) {
                    this.behaviorTreeManager.updateBlackboardValue('isMoving', false);
                    // 不要设置hasTarget为false，让行为树自己管理
                }
            } else {
                this.isMoving = true;
                
                // 更新移动状态到黑板
                if (this.behaviorTreeManager) {
                    this.behaviorTreeManager.updateBlackboardValue('isMoving', true);
                }
            }
        }
        
        // 更新行为树黑板中的核心变量
        if (this.behaviorTreeManager) {
            // 基础属性更新
            this.behaviorTreeManager.updateBlackboardValue('currentHealth', this.currentHealth);
            this.behaviorTreeManager.updateBlackboardValue('healthPercentage', this.currentHealth / this.maxHealth);
            this.behaviorTreeManager.updateBlackboardValue('isLowHealth', this.currentHealth < this.maxHealth * 0.3);
            
            // 命令状态更新
            this.behaviorTreeManager.updateBlackboardValue('currentCommand', this.currentCommand);
            this.behaviorTreeManager.updateBlackboardValue('hasTarget', this.targetPosition && !this.targetPosition.equals(Vec3.ZERO));
            this.behaviorTreeManager.updateBlackboardValue('targetPosition', this.targetPosition);
            this.behaviorTreeManager.updateBlackboardValue('isSelected', this.isSelected);
            this.behaviorTreeManager.updateBlackboardValue('isMoving', this.isMoving);
            
            // 位置信息更新
            this.behaviorTreeManager.updateBlackboardValue('worldPosition', this.node.worldPosition);
            
            // 根据单位类型设置特定的黑板变量
            if (this.unitType === 'worker') {
                // 工人特有的变量
                // 这里可以添加工人特有的状态更新
            } else if (this.unitType === 'soldier') {
                // 士兵特有的变量
                this.behaviorTreeManager.updateBlackboardValue('lastAttackTime', this.lastAttackTime);
            } else if (this.unitType === 'scout') {
                // 侦察兵特有的变量
                // 这里可以添加侦察兵特有的状态更新
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