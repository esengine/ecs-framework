import { EntitySystem, Entity, Matcher } from '@esengine/ecs-framework';
import { PlayerInputComponent } from '../components/PlayerInputComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { input, Input, EventKeyboard, KeyCode } from 'cc';

/**
 * 玩家输入系统 - 处理玩家输入并转换为游戏行为
 * 
 * 展示系统的职责：
 * 1. 收集输入事件
 * 2. 更新输入组件状态
 * 3. 根据输入修改其他组件（如速度）
 */
export class PlayerInputSystem extends EntitySystem {
    private moveSpeed: number = 200; // 移动速度
    
    constructor() {
        // 只处理拥有PlayerInputComponent的实体
        super(Matcher.empty().all(PlayerInputComponent));
    }
    
    public initialize(): void {
        super.initialize();
        console.log("PlayerInputSystem 已初始化 - 开始监听玩家输入");
        
        // 注册键盘事件监听器
        this.setupInputListeners();
    }
    
    /**
     * 设置输入事件监听器
     */
    private setupInputListeners(): void {
        // 键盘按下事件
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        // 键盘抬起事件
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }
    
    /**
     * 键盘按下处理
     */
    private onKeyDown(event: EventKeyboard): void {
        const keyCode = event.keyCode;
        const keyName = this.getKeyName(keyCode);
        
        // 更新所有玩家实体的输入状态
        for (const entity of this.entities) {
            const playerInput = entity.getComponent(PlayerInputComponent);
            if (playerInput && playerInput.inputEnabled) {
                playerInput.setKey(keyName, true);
            }
        }
    }
    
    /**
     * 键盘抬起处理
     */
    private onKeyUp(event: EventKeyboard): void {
        const keyCode = event.keyCode;
        const keyName = this.getKeyName(keyCode);
        
        // 更新所有玩家实体的输入状态
        for (const entity of this.entities) {
            const playerInput = entity.getComponent(PlayerInputComponent);
            if (playerInput && playerInput.inputEnabled) {
                playerInput.setKey(keyName, false);
            }
        }
    }
    
    /**
     * 每帧处理：根据输入状态更新实体行为
     */
    protected process(entities: Entity[]): void {
        for (const entity of entities) {
            const playerInput = entity.getComponent(PlayerInputComponent);
            
            if (!playerInput || !playerInput.inputEnabled) {
                continue;
            }
            
            // 处理移动输入
            this.processMovementInput(entity, playerInput);
            
            // 处理其他输入（如攻击、跳跃等）
            this.processActionInput(entity, playerInput);
        }
    }
    
    /**
     * 处理移动输入
     */
    private processMovementInput(entity: Entity, playerInput: PlayerInputComponent): void {
        const velocity = entity.getComponent(VelocityComponent);
        if (!velocity) return;
        
        // 根据按键状态计算移动方向
        let moveX = 0;
        let moveY = 0;
        
        if (playerInput.isKeyPressed('A') || playerInput.isKeyPressed('ArrowLeft')) {
            moveX -= 1;
        }
        if (playerInput.isKeyPressed('D') || playerInput.isKeyPressed('ArrowRight')) {
            moveX += 1;
        }
        if (playerInput.isKeyPressed('W') || playerInput.isKeyPressed('ArrowUp')) {
            moveY += 1;
        }
        if (playerInput.isKeyPressed('S') || playerInput.isKeyPressed('ArrowDown')) {
            moveY -= 1;
        }
        
        // 更新输入组件的移动方向
        playerInput.setMoveDirection(moveX, moveY);
        
        // 将输入转换为速度
        const normalizedDirection = playerInput.getNormalizedMoveDirection();
        velocity.setVelocity(
            normalizedDirection.x * this.moveSpeed * playerInput.sensitivity,
            normalizedDirection.y * this.moveSpeed * playerInput.sensitivity,
            0
        );
    }
    
    /**
     * 处理动作输入（攻击、技能等）
     */
    private processActionInput(entity: Entity, playerInput: PlayerInputComponent): void {
        // 空格键 - 跳跃或攻击
        if (playerInput.isKeyPressed('Space')) {
            console.log(`玩家 ${entity.name} 执行动作：攻击/跳跃`);
            // 这里可以触发攻击组件或添加跳跃效果
        }
        
        // ESC键 - 暂停游戏
        if (playerInput.isKeyPressed('Escape')) {
            console.log("玩家请求暂停游戏");
            // 可以发送暂停事件给游戏管理系统
        }
    }
    
    /**
     * 将键码转换为字符串
     */
    private getKeyName(keyCode: KeyCode): string {
        const keyMap: { [key: number]: string } = {
            [KeyCode.KEY_A]: 'A',
            [KeyCode.KEY_D]: 'D',
            [KeyCode.KEY_S]: 'S',
            [KeyCode.KEY_W]: 'W',
            [KeyCode.ARROW_LEFT]: 'ArrowLeft',
            [KeyCode.ARROW_RIGHT]: 'ArrowRight',
            [KeyCode.ARROW_UP]: 'ArrowUp',
            [KeyCode.ARROW_DOWN]: 'ArrowDown',
            [KeyCode.SPACE]: 'Space',
            [KeyCode.ESCAPE]: 'Escape'
        };
        
        return keyMap[keyCode] || `Key_${keyCode}`;
    }
    
    /**
     * 系统清理
     */
    public onDestroy(): void {
        // 移除事件监听器
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        console.log("PlayerInputSystem 已清理");
    }
} 