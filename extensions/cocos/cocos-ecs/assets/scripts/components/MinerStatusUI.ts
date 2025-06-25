import { Component, _decorator, Label, ProgressBar, Node, UITransform, Canvas, find, Camera, Vec3, director, Color, Layers, Graphics } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 矿工状态UI组件
 */
@ccclass('MinerStatusUI')
export class MinerStatusUI extends Component {
    
    nameLabel: Label | null = null;
    statusLabel: Label | null = null;
    staminaBar: ProgressBar | null = null;
    actionProgressBar: ProgressBar | null = null;
    actionLabel: Label | null = null;
    oreCountLabel: Label | null = null;
    warehouseCountLabel: Label | null = null;
    
    @property
    followTarget: Node | null = null;
    
    @property
    yOffset: number = 100;
    
    private camera: Camera | null = null;
    private canvas: Canvas | null = null;
    
    start() {
        this.node.layer = Layers.Enum.UI_2D;
        
        this.camera = find('Main Camera')?.getComponent(Camera) || director.getScene()?.getComponentInChildren(Camera);
        this.canvas = find('Canvas')?.getComponent(Canvas) || director.getScene()?.getComponentInChildren(Canvas);
        

        
        if (this.nameLabel && this.followTarget) {
            this.nameLabel.string = this.followTarget.name;
        }
        
        this.updateStamina(100, 100);
        this.updateStatus('待机中');
        this.updateActionProgress('', 0);
    }
    
    update() {
        if (this.followTarget && this.camera && this.canvas) {
            this.updateUIPosition();
        }
    }
    
    private updateUIPosition() {
        if (!this.followTarget || !this.camera || !this.canvas) return;
        
        const targetWorldPos = this.followTarget.worldPosition.clone();
        // 根据目标类型设置不同的Y偏移
        if (this.followTarget.name.includes('Warehouse')) {
            targetWorldPos.y += 3.0; // 仓库偏移更高
        } else {
            targetWorldPos.y += 2.0; // 矿工偏移
        }
        
        // 将世界坐标直接转换为UI坐标
        const uiPos = new Vec3();
        this.camera.convertToUINode(targetWorldPos, this.canvas.node, uiPos);
        this.node.setPosition(uiPos);
    }
    
    setFollowTarget(target: Node) {
        this.followTarget = target;
        if (this.nameLabel) {
            this.nameLabel.string = target.name;
        }
    }
    
    updateStamina(current: number, max: number) {
        if (this.staminaBar) {
            this.staminaBar.progress = current / max;
        }
        
        if (this.staminaBar) {
            const percentage = current / max;
            const fillNode = this.staminaBar.node.getChildByName('Bar');
            if (fillNode) {
                const graphics = fillNode.getComponent(Graphics);
                if (graphics) {
                    let color: Color;
                    if (percentage > 0.6) {
                        color = new Color(0, 255, 0, 255);
                    } else if (percentage > 0.3) {
                        color = new Color(255, 255, 0, 255);
                    } else {
                        color = new Color(255, 0, 0, 255);
                    }
                    
                    graphics.clear();
                    graphics.fillColor = color;
                    graphics.rect(-75, -4, 150 * percentage, 8);
                    graphics.fill();
                }
            }
        }
    }
    
    updateStatus(status: string) {
        if (this.statusLabel) {
            this.statusLabel.string = status;
        }
    }
    
    updateActionProgress(actionName: string, progress: number) {
        if (this.actionLabel) {
            this.actionLabel.string = actionName;
        }
        
        if (this.actionProgressBar) {
            this.actionProgressBar.progress = Math.max(0, Math.min(1, progress));
            this.actionProgressBar.node.active = actionName !== '' && progress > 0;
        }
    }
    
    setVisible(visible: boolean) {
        this.node.active = visible;
    }
    
    updateOreCount(hasOre: boolean, warehouseTotal: number) {
        if (this.oreCountLabel) {
            this.oreCountLabel.string = hasOre ? '💎1' : '💎0';
        }
    }
} 