import { Component, _decorator, Node, Label, ProgressBar, UITransform, Widget, Canvas, find, director, Color, Sprite, Layers, Graphics } from 'cc';
import { MinerStatusUI } from './MinerStatusUI';

const { ccclass, property } = _decorator;

/**
 * 状态UI管理器
 * 负责创建和管理游戏对象的状态显示界面
 */
@ccclass('StatusUIManager')
export class StatusUIManager extends Component {
    
    /**
     * 为矿工创建状态显示UI
     */
    static createStatusUIForMiner(miner: Node): MinerStatusUI | null {
        const canvas = find('Canvas') || director.getScene()?.getChildByName('Canvas');
        if (!canvas) {
            return null;
        }
        
        const uiRoot = new Node(`${miner.name}_StatusUI`);
        canvas.addChild(uiRoot);
        
        const uiTransform = uiRoot.addComponent(UITransform);
        uiTransform.setContentSize(200, 100);
        
        const borderNode = new Node('Border');
        uiRoot.addChild(borderNode);
        const borderTransform = borderNode.addComponent(UITransform);
        borderTransform.setContentSize(202, 102);
        const borderGraphics = borderNode.addComponent(Graphics);
        borderGraphics.fillColor = new Color(100, 100, 100, 120);
        borderGraphics.rect(-101, -51, 202, 102);
        borderGraphics.fill();
        
        const borderWidget = borderNode.addComponent(Widget);
        borderWidget.isAlignTop = true;
        borderWidget.isAlignBottom = true;
        borderWidget.isAlignLeft = true;
        borderWidget.isAlignRight = true;
        borderWidget.top = -1;
        borderWidget.bottom = -1;
        borderWidget.left = -1;
        borderWidget.right = -1;
        borderWidget.updateAlignment();
        
        const backgroundNode = new Node('Background');
        uiRoot.addChild(backgroundNode);
        const backgroundTransform = backgroundNode.addComponent(UITransform);
        backgroundTransform.setContentSize(200, 100);
        const backgroundGraphics = backgroundNode.addComponent(Graphics);
        backgroundGraphics.fillColor = new Color(0, 0, 0, 100);
        backgroundGraphics.rect(-100, -50, 200, 100);
        backgroundGraphics.fill();
        
        const statusUI = uiRoot.addComponent(MinerStatusUI);
        statusUI.setFollowTarget(miner);
        
        const nameNode = new Node('NameLabel');
        uiRoot.addChild(nameNode);
        const nameTransform = nameNode.addComponent(UITransform);
        nameTransform.setContentSize(200, 25);
        const nameLabel = nameNode.addComponent(Label);
        nameLabel.string = miner.name;
        nameLabel.fontSize = 16;
        nameLabel.color = new Color(255, 255, 255, 255);
        
        const nameWidget = nameNode.addComponent(Widget);
        nameWidget.isAlignTop = true;
        nameWidget.top = 0;
        nameWidget.isAlignHorizontalCenter = true;
        nameWidget.updateAlignment();
        
        // 创建状态标签
        const statusNode = new Node('StatusLabel');
        uiRoot.addChild(statusNode);
        const statusTransform = statusNode.addComponent(UITransform);
        statusTransform.setContentSize(200, 20);
        const statusLabel = statusNode.addComponent(Label);
        statusLabel.string = '待机中';
        statusLabel.fontSize = 14;
        statusLabel.color = new Color(200, 200, 200, 255);
        
        // 设置状态标签位置
        const statusWidget = statusNode.addComponent(Widget);
        statusWidget.isAlignTop = true;
        statusWidget.top = 25;
        statusWidget.isAlignHorizontalCenter = true;
        statusWidget.updateAlignment();
        
        // 创建体力进度条
        const staminaBarNode = new Node('StaminaBar');
        uiRoot.addChild(staminaBarNode);
        const staminaBarTransform = staminaBarNode.addComponent(UITransform);
        staminaBarTransform.setContentSize(150, 8);
        const staminaBar = staminaBarNode.addComponent(ProgressBar);
        staminaBar.progress = 1.0;
        
        // 创建体力进度条背景
        const staminaBgNode = new Node('Background');
        staminaBarNode.addChild(staminaBgNode);
        const staminaBgTransform = staminaBgNode.addComponent(UITransform);
        staminaBgTransform.setContentSize(150, 8);
        const staminaBgGraphics = staminaBgNode.addComponent(Graphics);
        staminaBgGraphics.fillColor = new Color(50, 50, 50, 255);
        staminaBgGraphics.rect(-75, -4, 150, 8);
        staminaBgGraphics.fill();
        
        // 创建体力进度条填充
        const staminaFillNode = new Node('Bar');
        staminaBarNode.addChild(staminaFillNode);
        const staminaFillTransform = staminaFillNode.addComponent(UITransform);
        staminaFillTransform.setContentSize(150, 8);
        const staminaFillGraphics = staminaFillNode.addComponent(Graphics);
        staminaFillGraphics.fillColor = new Color(0, 255, 0, 255);
        staminaFillGraphics.rect(-75, -4, 150, 8);
        staminaFillGraphics.fill();
        
        // 设置体力进度条位置
        const staminaWidget = staminaBarNode.addComponent(Widget);
        staminaWidget.isAlignTop = true;
        staminaWidget.top = 45;
        staminaWidget.isAlignHorizontalCenter = true;
        staminaWidget.updateAlignment();
        
        // 创建动作进度条
        const actionBarNode = new Node('ActionProgressBar');
        uiRoot.addChild(actionBarNode);
        const actionBarTransform = actionBarNode.addComponent(UITransform);
        actionBarTransform.setContentSize(150, 6);
        const actionBar = actionBarNode.addComponent(ProgressBar);
        actionBar.progress = 0;
        actionBarNode.active = false; // 初始隐藏
        
        // 创建动作进度条背景
        const actionBgNode = new Node('Background');
        actionBarNode.addChild(actionBgNode);
        const actionBgTransform = actionBgNode.addComponent(UITransform);
        actionBgTransform.setContentSize(150, 6);
        const actionBgGraphics = actionBgNode.addComponent(Graphics);
        actionBgGraphics.fillColor = new Color(50, 50, 50, 255);
        actionBgGraphics.rect(-75, -3, 150, 6);
        actionBgGraphics.fill();
        
        // 创建动作进度条填充
        const actionFillNode = new Node('Bar');
        actionBarNode.addChild(actionFillNode);
        const actionFillTransform = actionFillNode.addComponent(UITransform);
        actionFillTransform.setContentSize(150, 6);
        const actionFillGraphics = actionFillNode.addComponent(Graphics);
        actionFillGraphics.fillColor = new Color(255, 255, 0, 255);
        actionFillGraphics.rect(-75, -3, 150, 6);
        actionFillGraphics.fill();
        
        // 设置动作进度条位置
        const actionWidget = actionBarNode.addComponent(Widget);
        actionWidget.isAlignTop = true;
        actionWidget.top = 55;
        actionWidget.isAlignHorizontalCenter = true;
        actionWidget.updateAlignment();
        
        // 创建动作标签
        const actionLabelNode = new Node('ActionLabel');
        uiRoot.addChild(actionLabelNode);
        const actionLabelTransform = actionLabelNode.addComponent(UITransform);
        actionLabelTransform.setContentSize(200, 15);
        const actionLabel = actionLabelNode.addComponent(Label);
        actionLabel.string = '';
        actionLabel.fontSize = 12;
        actionLabel.color = new Color(255, 255, 0, 255);
        
        // 设置动作标签位置
        const actionLabelWidget = actionLabelNode.addComponent(Widget);
        actionLabelWidget.isAlignTop = true;
        actionLabelWidget.top = 65;
        actionLabelWidget.isAlignHorizontalCenter = true;
        actionLabelWidget.updateAlignment();
        
        // 创建矿石数量标签
        const oreCountNode = new Node('OreCountLabel');
        uiRoot.addChild(oreCountNode);
        const oreCountTransform = oreCountNode.addComponent(UITransform);
        oreCountTransform.setContentSize(100, 15);
        const oreCountLabel = oreCountNode.addComponent(Label);
        oreCountLabel.string = '💎0';
        oreCountLabel.fontSize = 12;
        oreCountLabel.color = new Color(255, 215, 0, 255); // 金色
        
        // 设置矿石数量标签位置（居中显示）
        const oreCountWidget = oreCountNode.addComponent(Widget);
        oreCountWidget.isAlignTop = true;
        oreCountWidget.top = 80;
        oreCountWidget.isAlignHorizontalCenter = true;
        oreCountWidget.updateAlignment();
        
        statusUI.nameLabel = nameLabel;
        statusUI.statusLabel = statusLabel;
        statusUI.staminaBar = staminaBar;
        statusUI.actionProgressBar = actionBar;
        statusUI.actionLabel = actionLabel;
        statusUI.oreCountLabel = oreCountLabel;
        statusUI.warehouseCountLabel = null;
        
        StatusUIManager.setNodeLayerRecursively(uiRoot, Layers.Enum.UI_2D);
        return statusUI;
    }
    
    /**
     * 递归设置节点及其子节点的层级
     */
    private static setNodeLayerRecursively(node: Node, layer: number) {
        node.layer = layer;
        for (const child of node.children) {
            StatusUIManager.setNodeLayerRecursively(child, layer);
        }
    }
    
    /**
     * 从矿工名字中提取索引号
     */
    private static extractMinerIndex(minerName: string): number {
        const match = minerName.match(/Miner_(\d+)/);
        if (match) {
            return parseInt(match[1]) - 1;
        }
        return 0;
    }
    
    /**
     * 为仓库创建存储量显示UI
     */
    static createWarehouseUI(warehouse: Node): MinerStatusUI | null {
        const canvas = find('Canvas') || director.getScene()?.getChildByName('Canvas');
        if (!canvas) {
            return null;
        }
        
        const uiRoot = new Node(`${warehouse.name}_StorageUI`);
        canvas.addChild(uiRoot);
        
        const uiTransform = uiRoot.addComponent(UITransform);
        uiTransform.setContentSize(120, 40);
        
        const backgroundNode = new Node('Background');
        uiRoot.addChild(backgroundNode);
        const backgroundTransform = backgroundNode.addComponent(UITransform);
        backgroundTransform.setContentSize(120, 40);
        const backgroundGraphics = backgroundNode.addComponent(Graphics);
        backgroundGraphics.fillColor = new Color(0, 0, 0, 120);
        backgroundGraphics.rect(-60, -20, 120, 40);
        backgroundGraphics.fill();
        
        const storageNode = new Node('StorageLabel');
        uiRoot.addChild(storageNode);
        const storageTransform = storageNode.addComponent(UITransform);
        storageTransform.setContentSize(120, 30);
        const storageLabel = storageNode.addComponent(Label);
        storageLabel.string = '🏭 总存储: 0';
        storageLabel.fontSize = 14;
        storageLabel.color = new Color(255, 255, 255, 255);
        
        const storageWidget = storageNode.addComponent(Widget);
        storageWidget.isAlignHorizontalCenter = true;
        storageWidget.isAlignVerticalCenter = true;
        storageWidget.updateAlignment();
        
        const statusUI = uiRoot.addComponent(MinerStatusUI);
        statusUI.setFollowTarget(warehouse);
        
        statusUI.nameLabel = null;
        statusUI.statusLabel = null;
        statusUI.staminaBar = null;
        statusUI.actionProgressBar = null;
        statusUI.actionLabel = null;
        statusUI.oreCountLabel = null;
        statusUI.warehouseCountLabel = storageLabel;
        
        StatusUIManager.setNodeLayerRecursively(uiRoot, Layers.Enum.UI_2D);
        return statusUI;
    }
} 