import { EntitySystem, Matcher, Entity, Time, ECSSystem } from '@esengine/ecs-framework';
import { UITransformComponent } from '../components/UITransformComponent';
import { UIInteractableComponent } from '../components/UIInteractableComponent';
import { UIButtonComponent } from '../components/widgets/UIButtonComponent';
import { UISliderComponent } from '../components/widgets/UISliderComponent';

/**
 * 鼠标按钮
 * Mouse buttons
 */
export enum MouseButton {
    Left = 0,
    Middle = 1,
    Right = 2
}

/**
 * 输入事件数据
 * Input event data
 */
export interface UIInputEvent {
    x: number;
    y: number;
    button: MouseButton;
    deltaX?: number;
    deltaY?: number;
    wheelDelta?: number;
}

/**
 * UI 输入系统
 * UI Input System - Handles mouse/touch input for UI elements
 */
@ECSSystem('UIInput')
export class UIInputSystem extends EntitySystem {
    // ===== 鼠标状态 Mouse State =====

    private mouseX: number = 0;
    private mouseY: number = 0;
    private prevMouseX: number = 0;
    private prevMouseY: number = 0;
    private mouseButtons: boolean[] = [false, false, false];
    private prevMouseButtons: boolean[] = [false, false, false];

    // ===== 拖拽状态 Drag State =====

    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private dragTarget: Entity | null = null;

    // ===== 焦点状态 Focus State =====

    private focusedEntity: Entity | null = null;

    // ===== 双击检测 Double Click Detection =====

    private lastClickTime: number = 0;
    private lastClickEntity: Entity | null = null;
    private doubleClickThreshold: number = 300; // ms

    // ===== 事件监听器 Event Listeners =====

    private canvas: HTMLCanvasElement | null = null;
    private boundMouseMove: (e: MouseEvent) => void;
    private boundMouseDown: (e: MouseEvent) => void;
    private boundMouseUp: (e: MouseEvent) => void;
    private boundWheel: (e: WheelEvent) => void;

    constructor() {
        super(Matcher.empty().all(UITransformComponent, UIInteractableComponent));

        this.boundMouseMove = this.onMouseMove.bind(this);
        this.boundMouseDown = this.onMouseDown.bind(this);
        this.boundMouseUp = this.onMouseUp.bind(this);
        this.boundWheel = this.onWheel.bind(this);
    }

    /**
     * 绑定到 Canvas 元素
     * Bind to canvas element
     */
    public bindToCanvas(canvas: HTMLCanvasElement): void {
        this.unbind();
        this.canvas = canvas;

        canvas.addEventListener('mousemove', this.boundMouseMove);
        canvas.addEventListener('mousedown', this.boundMouseDown);
        canvas.addEventListener('mouseup', this.boundMouseUp);
        canvas.addEventListener('wheel', this.boundWheel);

        // 阻止右键菜单
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * 解绑事件
     * Unbind events
     */
    public unbind(): void {
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.boundMouseMove);
            this.canvas.removeEventListener('mousedown', this.boundMouseDown);
            this.canvas.removeEventListener('mouseup', this.boundMouseUp);
            this.canvas.removeEventListener('wheel', this.boundWheel);
            this.canvas = null;
        }
    }

    /**
     * 手动设置鼠标位置（用于非 DOM 环境）
     * Manually set mouse position (for non-DOM environments)
     */
    public setMousePosition(x: number, y: number): void {
        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;
        this.mouseX = x;
        this.mouseY = y;
    }

    /**
     * 手动设置鼠标按钮状态
     * Manually set mouse button state
     */
    public setMouseButton(button: MouseButton, pressed: boolean): void {
        this.prevMouseButtons[button] = this.mouseButtons[button]!;
        this.mouseButtons[button] = pressed;
    }

    private onMouseMove(e: MouseEvent): void {
        const rect = this.canvas!.getBoundingClientRect();
        this.setMousePosition(e.clientX - rect.left, e.clientY - rect.top);
    }

    private onMouseDown(e: MouseEvent): void {
        this.setMouseButton(e.button as MouseButton, true);
    }

    private onMouseUp(e: MouseEvent): void {
        this.setMouseButton(e.button as MouseButton, false);
    }

    private onWheel(_e: WheelEvent): void {
        // TODO: 处理滚轮事件
    }

    protected process(entities: readonly Entity[]): void {
        const dt = Time.deltaTime;

        // 按 zIndex 从高到低排序，确保上层元素优先处理
        const sorted = [...entities].sort((a, b) => {
            const ta = a.getComponent(UITransformComponent)!;
            const tb = b.getComponent(UITransformComponent)!;
            return tb.zIndex - ta.zIndex;
        });

        let consumed = false;
        let hoveredEntity: Entity | null = null;

        // 处理悬停和点击
        for (const entity of sorted) {
            const transform = entity.getComponent(UITransformComponent)!;
            const interactable = entity.getComponent(UIInteractableComponent)!;

            // 跳过不可见或禁用的元素
            if (!transform.visible || !interactable.enabled) {
                // 如果之前悬停，触发离开
                if (interactable.hovered) {
                    this.handleMouseLeave(entity, interactable);
                }
                continue;
            }

            // 更新悬停计时器
            if (interactable.hovered && interactable.hoverDelay > 0) {
                interactable.hoverTimer += dt * 1000;
                if (interactable.hoverTimer >= interactable.hoverDelay && !interactable.hoverReady) {
                    interactable.hoverReady = true;
                }
            }

            // 命中测试
            const hit = !consumed && transform.containsPoint(this.mouseX, this.mouseY);

            if (hit) {
                hoveredEntity = entity;

                // 处理鼠标进入
                if (!interactable.hovered) {
                    this.handleMouseEnter(entity, interactable);
                }

                interactable.hovered = true;

                // 处理按下状态
                const wasPressed = interactable.pressed;
                interactable.pressed = this.mouseButtons[MouseButton.Left]!;

                // 处理按下事件
                if (!wasPressed && interactable.pressed) {
                    this.handlePressDown(entity, interactable);
                }

                // 处理释放事件（点击）
                if (wasPressed && !interactable.pressed) {
                    this.handlePressUp(entity, interactable);
                    this.handleClick(entity, interactable);
                }

                // 处理拖拽
                if (interactable.draggable) {
                    this.handleDrag(entity, interactable);
                }

                // 处理特殊控件
                this.handleSlider(entity);
                this.handleButton(entity, interactable);

                // 阻止事件传递到下层
                if (interactable.blockEvents) {
                    consumed = true;
                }
            } else {
                // 鼠标不在元素上
                if (interactable.hovered) {
                    this.handleMouseLeave(entity, interactable);
                }
                interactable.hovered = false;

                // 如果按下状态但鼠标移开，保持按下直到释放
                if (interactable.pressed && !this.mouseButtons[MouseButton.Left]) {
                    interactable.pressed = false;
                }
            }
        }

        // 更新光标
        this.updateCursor(hoveredEntity);

        // 保存上一帧状态
        this.prevMouseButtons = [...this.mouseButtons];
    }

    private handleMouseEnter(entity: Entity, interactable: UIInteractableComponent): void {
        interactable.hoverTimer = 0;
        interactable.hoverReady = false;
        interactable.onMouseEnter?.();
    }

    private handleMouseLeave(_entity: Entity, interactable: UIInteractableComponent): void {
        interactable.hovered = false;
        interactable.hoverTimer = 0;
        interactable.hoverReady = false;
        interactable.onMouseLeave?.();
    }

    private handlePressDown(entity: Entity, interactable: UIInteractableComponent): void {
        interactable.onPressDown?.();

        // 设置焦点
        if (interactable.focusable) {
            this.setFocus(entity);
        }

        // 开始拖拽
        if (interactable.draggable) {
            this.dragTarget = entity;
            this.dragStartX = this.mouseX;
            this.dragStartY = this.mouseY;
            interactable.dragging = true;
            interactable.onDragStart?.(this.mouseX, this.mouseY);
        }
    }

    private handlePressUp(_entity: Entity, interactable: UIInteractableComponent): void {
        interactable.onPressUp?.();

        // 结束拖拽
        if (interactable.dragging) {
            interactable.dragging = false;
            interactable.onDragEnd?.(this.mouseX, this.mouseY);
            this.dragTarget = null;
        }
    }

    private handleClick(entity: Entity, interactable: UIInteractableComponent): void {
        // 检测双击
        const now = Date.now();
        if (this.lastClickEntity === entity && now - this.lastClickTime < this.doubleClickThreshold) {
            interactable.onDoubleClick?.();
            this.lastClickEntity = null;
            this.lastClickTime = 0;
        } else {
            interactable.onClick?.();
            this.lastClickEntity = entity;
            this.lastClickTime = now;
        }
    }

    private handleDrag(entity: Entity, interactable: UIInteractableComponent): void {
        if (interactable.dragging && this.dragTarget === entity) {
            const deltaX = this.mouseX - this.prevMouseX;
            const deltaY = this.mouseY - this.prevMouseY;

            if (deltaX !== 0 || deltaY !== 0) {
                interactable.onDragMove?.(this.mouseX, this.mouseY, deltaX, deltaY);
            }
        }
    }

    private handleSlider(entity: Entity): void {
        const slider = entity.getComponent(UISliderComponent);
        if (!slider) return;

        const transform = entity.getComponent(UITransformComponent)!;

        // 更新手柄悬停状态
        // TODO: 更精确的手柄命中测试

        // 处理拖拽
        if (this.mouseButtons[MouseButton.Left] && transform.containsPoint(this.mouseX, this.mouseY)) {
            if (!slider.dragging) {
                slider.dragging = true;
                slider.dragStartValue = slider.value;
                slider.dragStartPosition = this.mouseX;
                slider.onDragStart?.(slider.value);
            }

            // 计算新值
            const relativeX = this.mouseX - transform.worldX;
            const progress = Math.max(0, Math.min(1, relativeX / transform.computedWidth));
            const newValue = slider.minValue + progress * (slider.maxValue - slider.minValue);

            if (newValue !== slider.targetValue) {
                slider.setValue(newValue);
                slider.onChange?.(slider.targetValue);
            }
        } else if (slider.dragging && !this.mouseButtons[MouseButton.Left]) {
            slider.dragging = false;
            slider.onDragEnd?.(slider.value);
        }
    }

    private handleButton(entity: Entity, interactable: UIInteractableComponent): void {
        const button = entity.getComponent(UIButtonComponent);
        if (!button || button.disabled) return;

        // 更新目标颜色
        button.targetColor = button.getStateColor(interactable.getState());

        // 处理长按
        if (interactable.pressed) {
            button.pressTimer += Time.deltaTime * 1000;
            if (button.pressTimer >= button.longPressThreshold && !button.longPressTriggered) {
                button.longPressTriggered = true;
                button.onLongPress?.();
            }
        } else {
            button.pressTimer = 0;
            button.longPressTriggered = false;
        }

        // 处理点击
        if (interactable.getState() === 'normal' && this.prevMouseButtons[MouseButton.Left] && !this.mouseButtons[MouseButton.Left]) {
            // 点击在 handleClick 中处理
        }
    }

    private updateCursor(hoveredEntity: Entity | null): void {
        if (!this.canvas) return;

        if (hoveredEntity) {
            const interactable = hoveredEntity.getComponent(UIInteractableComponent);
            if (interactable) {
                this.canvas.style.cursor = interactable.cursor;
                return;
            }
        }

        this.canvas.style.cursor = 'default';
    }

    /**
     * 设置焦点到指定元素
     * Set focus to specified element
     */
    public setFocus(entity: Entity | null): void {
        // 移除旧焦点
        if (this.focusedEntity && this.focusedEntity !== entity) {
            const oldInteractable = this.focusedEntity.getComponent(UIInteractableComponent);
            if (oldInteractable) {
                oldInteractable.focused = false;
                oldInteractable.onBlur?.();
            }
        }

        this.focusedEntity = entity;

        // 设置新焦点
        if (entity) {
            const interactable = entity.getComponent(UIInteractableComponent);
            if (interactable && interactable.focusable) {
                interactable.focused = true;
                interactable.onFocus?.();
            }
        }
    }

    /**
     * 获取当前焦点元素
     * Get currently focused element
     */
    public getFocusedEntity(): Entity | null {
        return this.focusedEntity;
    }

    /**
     * 获取鼠标位置
     * Get mouse position
     */
    public getMousePosition(): { x: number; y: number } {
        return { x: this.mouseX, y: this.mouseY };
    }

    /**
     * 检查鼠标按钮是否按下
     * Check if mouse button is pressed
     */
    public isMouseButtonPressed(button: MouseButton): boolean {
        return this.mouseButtons[button] ?? false;
    }

    protected onDestroy(): void {
        this.unbind();
    }
}
