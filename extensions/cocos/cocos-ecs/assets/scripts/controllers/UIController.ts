import { _decorator, Component, Node, Vec3, Label, Button, EventHandler } from 'cc';

const { ccclass, property } = _decorator;

/**
 * UI控制器 - 管理RTS演示的用户界面
 */
@ccclass('UIController')
export class UIController extends Component {
    
    @property(Label)
    selectedUnitsLabel: Label = null!;
    
    @property(Button)
    moveButton: Button = null!;
    
    @property(Button)
    attackButton: Button = null!;
    
    @property(Button)
    gatherButton: Button = null!;
    
    @property(Button)
    patrolButton: Button = null!;
    
    @property(Label)
    infoLabel: Label = null!;
    
    // 回调函数
    public onUnitSelected: ((units: Node[]) => void) | null = null;
    public onCommandIssued: ((command: string, target?: Vec3 | Node) => void) | null = null;
    
    private selectedUnitsCount: number = 0;
    
    onLoad() {
        this.setupUI();
        this.updateSelectedUnitsDisplay();
        this.updateInfoDisplay('RTS 行为树演示 - 点击单位选择，然后发布命令');
    }
    
    /**
     * 设置UI事件
     */
    private setupUI() {
        // 移动命令按钮
        if (this.moveButton) {
            const moveHandler = new EventHandler();
            moveHandler.target = this.node;
            moveHandler.component = 'UIController';
            moveHandler.handler = 'onMoveCommand';
            this.moveButton.clickEvents.push(moveHandler);
        }
        
        // 攻击命令按钮
        if (this.attackButton) {
            const attackHandler = new EventHandler();
            attackHandler.target = this.node;
            attackHandler.component = 'UIController';
            attackHandler.handler = 'onAttackCommand';
            this.attackButton.clickEvents.push(attackHandler);
        }
        
        // 收集命令按钮
        if (this.gatherButton) {
            const gatherHandler = new EventHandler();
            gatherHandler.target = this.node;
            gatherHandler.component = 'UIController';
            gatherHandler.handler = 'onGatherCommand';
            this.gatherButton.clickEvents.push(gatherHandler);
        }
        
        // 巡逻命令按钮
        if (this.patrolButton) {
            const patrolHandler = new EventHandler();
            patrolHandler.target = this.node;
            patrolHandler.component = 'UIController';
            patrolHandler.handler = 'onPatrolCommand';
            this.patrolButton.clickEvents.push(patrolHandler);
        }
    }
    
    /**
     * 设置选中单位数量
     */
    setSelectedUnitsCount(count: number) {
        this.selectedUnitsCount = count;
        this.updateSelectedUnitsDisplay();
        this.updateButtonStates();
    }
    
    /**
     * 更新选中单位显示
     */
    private updateSelectedUnitsDisplay() {
        if (this.selectedUnitsLabel) {
            this.selectedUnitsLabel.string = `选中单位: ${this.selectedUnitsCount}`;
        }
    }
    
    /**
     * 更新按钮状态
     */
    private updateButtonStates() {
        const hasSelection = this.selectedUnitsCount > 0;
        
        if (this.moveButton) {
            this.moveButton.interactable = hasSelection;
        }
        if (this.attackButton) {
            this.attackButton.interactable = hasSelection;
        }
        if (this.gatherButton) {
            this.gatherButton.interactable = hasSelection;
        }
        if (this.patrolButton) {
            this.patrolButton.interactable = hasSelection;
        }
    }
    
    /**
     * 更新信息显示
     */
    updateInfoDisplay(message: string) {
        if (this.infoLabel) {
            this.infoLabel.string = message;
        }
        console.log(`[UI] ${message}`);
    }
    
    /**
     * 移动命令
     */
    onMoveCommand() {
        if (this.selectedUnitsCount === 0) {
            this.updateInfoDisplay('请先选择单位');
            return;
        }
        
        // 生成随机目标位置
        const targetPos = new Vec3(
            (Math.random() - 0.5) * 20,
            0,
            (Math.random() - 0.5) * 20
        );
        
        this.onCommandIssued?.('move', targetPos);
        this.updateInfoDisplay(`发布移动命令到位置 (${targetPos.x.toFixed(1)}, ${targetPos.z.toFixed(1)})`);
    }
    
    /**
     * 攻击命令
     */
    onAttackCommand() {
        if (this.selectedUnitsCount === 0) {
            this.updateInfoDisplay('请先选择单位');
            return;
        }
        
        // 生成随机攻击位置
        const targetPos = new Vec3(
            (Math.random() - 0.5) * 15,
            0,
            (Math.random() - 0.5) * 15
        );
        
        this.onCommandIssued?.('attack', targetPos);
        this.updateInfoDisplay(`发布攻击命令到位置 (${targetPos.x.toFixed(1)}, ${targetPos.z.toFixed(1)})`);
    }
    
    /**
     * 收集命令
     */
    onGatherCommand() {
        if (this.selectedUnitsCount === 0) {
            this.updateInfoDisplay('请先选择单位');
            return;
        }
        
        this.onCommandIssued?.('gather');
        this.updateInfoDisplay('发布收集资源命令');
    }
    
    /**
     * 巡逻命令
     */
    onPatrolCommand() {
        if (this.selectedUnitsCount === 0) {
            this.updateInfoDisplay('请先选择单位');
            return;
        }
        
        this.onCommandIssued?.('patrol');
        this.updateInfoDisplay('发布巡逻命令');
    }
    
    /**
     * 显示单位信息
     */
    showUnitInfo(unitName: string, unitType: string, health: number, maxHealth: number) {
        const healthPercent = Math.round((health / maxHealth) * 100);
        this.updateInfoDisplay(`${unitName} (${unitType}) - 生命值: ${health}/${maxHealth} (${healthPercent}%)`);
    }
    
    /**
     * 显示行为树状态
     */
    showBehaviorTreeStatus(unitName: string, currentBehavior: string) {
        this.updateInfoDisplay(`${unitName} 当前行为: ${currentBehavior}`);
    }
    
    /**
     * 显示错误信息
     */
    showError(message: string) {
        this.updateInfoDisplay(`错误: ${message}`);
        console.error(`[UI Error] ${message}`);
    }
    
    /**
     * 显示成功信息
     */
    showSuccess(message: string) {
        this.updateInfoDisplay(`成功: ${message}`);
    }
} 