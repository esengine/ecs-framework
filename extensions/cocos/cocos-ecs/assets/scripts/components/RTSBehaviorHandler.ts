import { _decorator, Component, Vec3, Node } from 'cc';
import { UnitController } from './UnitController';

const { ccclass } = _decorator;

/**
 * 矿工体力系统行为处理器 - 处理挖矿、休息、存储的完整循环
 * 展示体力驱动的工作-休息循环系统
 */
@ccclass('RTSBehaviorHandler')
export class RTSBehaviorHandler extends Component {
    
    private unitController: UnitController | null = null;
    private minerDemo: any = null; // MinerDemo组件引用
    private lastActionTime: number = 0;
    private actionCooldown: number = 0.5; // 动作冷却时间，避免频繁切换
    private minerIndex: number = -1; // 矿工索引，用于找到对应的家
    
    start() {
        this.unitController = this.getComponent(UnitController);
        // 获取场景中的MinerDemo组件
        this.minerDemo = this.node.parent?.getComponent('MinerDemo');
        
        if (!this.unitController) {
            console.error('RTSBehaviorHandler: 未找到UnitController组件');
        }
        if (!this.minerDemo) {
            console.error('RTSBehaviorHandler: 未找到MinerDemo组件');
        }
        
        // 从节点名称中提取矿工索引
        const match = this.node.name.match(/Miner_(\d+)/);
        if (match) {
            this.minerIndex = parseInt(match[1]) - 1; // 转换为0基索引
        }
        
        this.lastActionTime = Date.now();
    }
    
    /**
     * 检查动作冷却
     */
    private isActionOnCooldown(): boolean {
        return (Date.now() - this.lastActionTime) < (this.actionCooldown * 1000);
    }
    
    /**
     * 更新动作时间
     */
    private updateActionTime() {
        this.lastActionTime = Date.now();
    }
    
    /**
     * 挖掘金矿（永不枯竭）
     * @param params 事件参数，包含黑板变量值
     */
    onMineGoldOre(params: any = {}): string {
        if (!this.unitController || !this.minerDemo) {
            return 'failure';
        }
        
        // 检查体力是否充足
        if (this.unitController.currentStamina < this.unitController.staminaCostPerMining) {
            return 'failure';
        }
        
        // 检查是否已经携带矿石
        const hasOre = this.unitController.getBlackboardValue('hasOre');
        if (hasOre) {
            return 'failure';
        }
        
        // 动作冷却检查
        if (this.isActionOnCooldown()) {
            return 'running';
        }
        
        // 获取所有金矿
        const goldMines = this.minerDemo.getAllGoldMines();
        if (goldMines.length === 0) {
            return 'failure';
        }
        
        // 寻找最近的金矿
        const currentPos = this.node.worldPosition;
        let nearestMine: Node | null = null;
        let minDistance = Infinity;
        
        for (const mine of goldMines) {
            if (!mine || !mine.isValid) continue;
            
            const distance = Vec3.distance(currentPos, mine.worldPosition);
            if (distance < minDistance) {
                minDistance = distance;
                nearestMine = mine;
            }
        }
        
        if (!nearestMine) {
            return 'failure';
        }
        
        // 检查是否已经到达金矿位置
        if (minDistance < 2.0) {
            // 检查是否正在移动
            const isMoving = this.unitController.getBlackboardValue('isMoving');
            if (isMoving) {
                return 'running';
            }
            
            // 消耗体力
            this.unitController.currentStamina = Math.max(0, this.unitController.currentStamina - this.unitController.staminaCostPerMining);
            
            // 设置携带矿石状态
            this.unitController.setBlackboardValue('hasOre', true);
            
            // 通知演示管理器
            this.minerDemo.mineGoldOre(this.node);
            
            // 清除移动目标
            this.unitController.clearTarget();
            this.unitController.setBlackboardValue('isMoving', false);
            
            this.updateActionTime();
            return 'success';
        } else {
            // 设置移动目标
            this.unitController.setTarget(nearestMine.worldPosition);
            return 'running';
        }
    }
    
    /**
     * 前往仓库存储矿石
     * @param params 事件参数，包含黑板变量值
     */
    onStoreOre(params: any = {}): string {
        if (!this.unitController || !this.minerDemo) {
            return 'failure';
        }
        
        // 检查是否携带矿石
        const hasOre = this.unitController.getBlackboardValue('hasOre');
        if (!hasOre) {
            return 'failure';
        }
        
        // 动作冷却检查
        if (this.isActionOnCooldown()) {
            return 'running';
        }
        
        const warehouse = this.minerDemo.getWarehouse();
        if (!warehouse || !warehouse.isValid) {
            return 'failure';
        }
        
        // 计算到仓库的距离
        const currentPos = this.node.worldPosition;
        const warehousePos = warehouse.worldPosition;
        const distance = Vec3.distance(currentPos, warehousePos);
        
        // 检查是否已经到达仓库
        if (distance < 2.5) {
            // 检查是否正在移动
            const isMoving = this.unitController.getBlackboardValue('isMoving');
            if (isMoving) {
                return 'running';
            }
            
            // 清除携带矿石状态
            this.unitController.setBlackboardValue('hasOre', false);
            
            // 清除移动目标
            this.unitController.clearTarget();
            this.unitController.setBlackboardValue('isMoving', false);
            
            this.updateActionTime();
            return 'success';
        } else {
            // 设置移动目标
            this.unitController.setTarget(warehousePos);
            return 'running';
        }
    }
    
    /**
     * 回家休息
     * @param params 事件参数，包含黑板变量值
     */
    onGoHomeRest(params: any = {}): string {
        if (!this.unitController || !this.minerDemo) {
            return 'failure';
        }
        
        // 动作冷却检查
        if (this.isActionOnCooldown()) {
            return 'running';
        }
        
        // 获取矿工的家
        const home = this.minerDemo.getMinerHome(this.minerIndex);
        if (!home || !home.isValid) {
            return 'failure';
        }
        
        // 计算到家的距离
        const currentPos = this.node.worldPosition;
        const homePos = home.worldPosition;
        const distance = Vec3.distance(currentPos, homePos);
        
        // 检查是否已经到达家
        if (distance < 2.0) {
            // 检查是否正在移动
            const isMoving = this.unitController.getBlackboardValue('isMoving');
            if (isMoving) {
                return 'running';
            }
            
            // 设置休息状态
            this.unitController.setBlackboardValue('isResting', true);
            
            // 清除移动目标
            this.unitController.clearTarget();
            this.unitController.setBlackboardValue('isMoving', false);
            
            this.updateActionTime();
            return 'success';
        } else {
            // 设置移动目标
            this.unitController.setTarget(homePos);
            return 'running';
        }
    }
    
    /**
     * 恢复体力
     * @param params 事件参数，包含黑板变量值
     */
    onRecoverStamina(params: any = {}): string {
        if (!this.unitController) {
            return 'failure';
        }
        
        // 检查是否在家中
        const isResting = this.unitController.getBlackboardValue('isResting');
        if (!isResting) {
            return 'failure';
        }
        
        // 恢复体力
        const oldStamina = this.unitController.currentStamina;
        this.unitController.currentStamina = Math.min(this.unitController.maxStamina, 
            this.unitController.currentStamina + this.unitController.staminaRecoveryRate * 0.1); // 每次恢复2点体力
        
        const isFullyRested = this.unitController.currentStamina >= this.unitController.maxStamina;
        
        if (isFullyRested) {
            // 清除休息状态
            this.unitController.setBlackboardValue('isResting', false);
            
            // 通知演示管理器
            this.minerDemo.completeRestCycle();
            
            this.updateActionTime();
            return 'success';
        } else {
            // 体力还在恢复中
            return 'running';
        }
    }
    
    /**
     * 待机行为
     * @param params 事件参数，包含黑板变量值
     */
    onIdleBehavior(params: any = {}): string {
        if (!this.unitController) {
            return 'failure';
        }
        
        // 清除移动目标，确保停止移动
        this.unitController.clearTarget();
        this.unitController.setBlackboardValue('isMoving', false);
        

        
        return 'success';
    }
    
    /**
     * 获取矿工状态摘要
     */
    getMinerStatus(): string {
        if (!this.unitController) return 'Unknown';
        
        const hasOre = this.unitController.getBlackboardValue('hasOre');
        const isMoving = this.unitController.getBlackboardValue('isMoving');
        const isResting = this.unitController.getBlackboardValue('isResting');
        const stamina = this.unitController.currentStamina;
        const maxStamina = this.unitController.maxStamina;
        
        let status = '';
        if (isResting) {
            status = '😴休息中';
        } else if (hasOre) {
            status = isMoving ? '🚚运输中' : '📦携带矿石';
        } else {
            status = isMoving ? '🚶移动中' : '⛏️挖矿';
        }
        
        return `${status} (体力:${stamina.toFixed(0)}/${maxStamina})`;
    }
    
    /**
     * 调试信息
     */
    getDebugInfo(): any {
        if (!this.unitController) return {};
        
        return {
            name: this.node.name,
            hasOre: this.unitController.getBlackboardValue('hasOre'),
            isMoving: this.unitController.getBlackboardValue('isMoving'),
            isResting: this.unitController.getBlackboardValue('isResting'),
            stamina: this.unitController.currentStamina,
            maxStamina: this.unitController.maxStamina,
            staminaPercentage: this.unitController.currentStamina / this.unitController.maxStamina,
            isLowStamina: this.unitController.currentStamina < this.unitController.maxStamina * 0.2,
            status: this.getMinerStatus()
        };
    }
}