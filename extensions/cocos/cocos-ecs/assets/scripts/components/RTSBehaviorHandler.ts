import { _decorator, Component, Vec3, Node } from 'cc';
import { UnitController } from './UnitController';

const { ccclass } = _decorator;

/**
 * 矿工行为处理器 - 专门处理矿工的三个核心行为
 * 展示如何使用黑板变量参数和事件系统
 */
@ccclass('RTSBehaviorHandler')
export class RTSBehaviorHandler extends Component {
    
    private unitController: UnitController | null = null;
    private minerDemo: any = null; // MinerDemo组件引用
    
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
    }
    
    /**
     * 寻找并挖掘矿石
     * @param params 事件参数，包含黑板变量值
     */
    onFindAndMineOre(params: any = {}): string {
        if (!this.unitController || !this.minerDemo) return 'failure';
        
        // 从参数中获取黑板变量值
        const unitType = params.unitType || 'unknown';
        const currentHealth = params.currentHealth || 100;
        
        console.log(`⛏️ ${unitType}矿工开始寻找矿石 (生命值: ${currentHealth})`);
        
        // 获取所有可用矿石
        const ores = this.minerDemo.getAllOres();
        if (ores.length === 0) {
            console.log(`👷 ${this.node.name}: 没有可挖掘的矿石了`);
            return 'failure';
        }
        
        // 寻找最近的矿石
        const currentPos = this.node.worldPosition;
        let nearestOre: Node | null = null;
        let minDistance = Infinity;
        
        for (const ore of ores) {
            const distance = Vec3.distance(currentPos, ore.worldPosition);
            if (distance < minDistance) {
                minDistance = distance;
                nearestOre = ore;
            }
        }
        
        if (!nearestOre) return 'failure';
        
        // 检查是否已经到达矿石位置
        if (minDistance < 1.5) {
            // 开始挖掘
            console.log(`⛏️ ${this.node.name}: 开始挖掘矿石`);
            
            // 设置携带矿石状态（更新黑板）
            this.unitController.setBlackboardValue('hasOre', true);
            
            // 移除矿石
            this.minerDemo.removeOre(nearestOre);
            
            // 清除移动目标
            this.unitController.clearTarget();
            
            return 'success';
        } else {
            // 移动到矿石位置
            this.unitController.setTarget(nearestOre.worldPosition);
            console.log(`🚶 ${this.node.name}: 前往矿石位置 距离${minDistance.toFixed(1)}米`);
            return 'running';
        }
    }
    
    /**
     * 前往仓库存储矿石
     * @param params 事件参数，包含黑板变量值
     */
    onStoreOre(params: any = {}): string {
        if (!this.unitController || !this.minerDemo) return 'failure';
        
        // 从参数中获取黑板变量值
        const unitType = params.unitType || 'unknown';
        const targetPosition = params.targetPosition || null;
        
        console.log(`🏭 ${unitType}矿工前往仓库存储 (目标位置: ${JSON.stringify(targetPosition)})`);
        
        const warehouse = this.minerDemo.getWarehouse();
        if (!warehouse) {
            console.log(`👷 ${this.node.name}: 找不到仓库`);
            return 'failure';
        }
        
        // 计算到仓库的距离
        const currentPos = this.node.worldPosition;
        const warehousePos = warehouse.worldPosition;
        const distance = Vec3.distance(currentPos, warehousePos);
        
        // 检查是否已经到达仓库
        if (distance < 2.5) {
            // 存储矿石
            console.log(`🏭 ${this.node.name}: 在仓库存储矿石`);
            
            // 清除携带矿石状态（更新黑板）
            this.unitController.setBlackboardValue('hasOre', false);
            
            // 清除移动目标
            this.unitController.clearTarget();
            
            return 'success';
        } else {
            // 移动到仓库
            this.unitController.setTarget(warehousePos);
            console.log(`🚚 ${this.node.name}: 运输矿石到仓库 距离${distance.toFixed(1)}米`);
            return 'running';
        }
    }
    
    /**
     * 待机行为
     * @param params 事件参数，包含黑板变量值
     */
    onIdleBehavior(params: any = {}): string {
        // 从参数中获取黑板变量值
        const unitType = params.unitType || 'unknown';
        
        console.log(`😴 ${unitType}矿工待机中`);
        return 'success';
    }
}