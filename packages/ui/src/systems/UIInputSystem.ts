import { EntitySystem, Matcher, Entity, Time, ECSSystem } from '@esengine/ecs-framework';
import { UITransformComponent } from '../components/UITransformComponent';
import { UIInteractableComponent } from '../components/UIInteractableComponent';
import { UIButtonComponent } from '../components/widgets/UIButtonComponent';
import { UISliderComponent } from '../components/widgets/UISliderComponent';
import { UIScrollViewComponent } from '../components/widgets/UIScrollViewComponent';
import type { UILayoutSystem } from './UILayoutSystem';

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

    // ===== 滚轮状态 Wheel State =====

    private wheelDeltaX: number = 0;
    private wheelDeltaY: number = 0;
    private hasWheelEvent: boolean = false;

    // ===== ScrollView 拖拽状态 ScrollView Drag State =====

    private scrollViewDragTarget: Entity | null = null;
    private scrollViewDragStartX: number = 0;
    private scrollViewDragStartY: number = 0;
    private scrollViewDragStartScrollX: number = 0;
    private scrollViewDragStartScrollY: number = 0;
    private scrollViewLastDragX: number = 0;
    private scrollViewLastDragY: number = 0;
    private scrollViewLastDragTime: number = 0;

    // ===== 事件监听器 Event Listeners =====

    private canvas: HTMLCanvasElement | null = null;
    private boundMouseMove: (e: MouseEvent) => void;
    private boundMouseDown: (e: MouseEvent) => void;
    private boundMouseUp: (e: MouseEvent) => void;
    private boundWheel: (e: WheelEvent) => void;

    // ===== UI 布局系统引用 UI Layout System Reference =====
    // 用于获取 UI 画布尺寸以进行坐标转换
    // Used to get UI canvas size for coordinate conversion
    private layoutSystem: UILayoutSystem | null = null;

    constructor() {
        super(Matcher.empty().all(UITransformComponent, UIInteractableComponent));

        this.boundMouseMove = this.onMouseMove.bind(this);
        this.boundMouseDown = this.onMouseDown.bind(this);
        this.boundMouseUp = this.onMouseUp.bind(this);
        this.boundWheel = this.onWheel.bind(this);
    }

    /**
     * 设置 UI 布局系统引用
     * Set UI layout system reference
     *
     * 用于获取 UI 画布尺寸以进行坐标转换
     * Used to get UI canvas size for coordinate conversion
     */
    public setLayoutSystem(layoutSystem: UILayoutSystem): void {
        this.layoutSystem = layoutSystem;
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
        // 屏幕坐标（CSS 像素，左上角为 0,0，Y 向下）
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // 获取 UI 画布尺寸
        const uiCanvasSize = this.layoutSystem?.getCanvasSize() ?? { width: 1920, height: 1080 };

        // 转换为 UI 世界坐标（中心为 0,0，Y 向上）
        // UI 坐标系：左上角是 (-width/2, +height/2)，右下角是 (+width/2, -height/2)
        // 屏幕坐标系：左上角是 (0, 0)，右下角是 (canvasWidth, canvasHeight)
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;

        // 屏幕坐标归一化到 [0, 1]
        const normalizedX = screenX / canvasWidth;
        const normalizedY = screenY / canvasHeight;

        // 转换为 UI 世界坐标
        // X: 0 -> -uiCanvasWidth/2, 1 -> +uiCanvasWidth/2
        // Y: 0 -> +uiCanvasHeight/2 (顶部), 1 -> -uiCanvasHeight/2 (底部)
        const worldX = (normalizedX - 0.5) * uiCanvasSize.width;
        const worldY = (0.5 - normalizedY) * uiCanvasSize.height;

        this.setMousePosition(worldX, worldY);
    }

    private onMouseDown(e: MouseEvent): void {
        this.setMouseButton(e.button as MouseButton, true);
    }

    private onMouseUp(e: MouseEvent): void {
        this.setMouseButton(e.button as MouseButton, false);
    }

    private onWheel(e: WheelEvent): void {
        e.preventDefault();
        this.wheelDeltaX = e.deltaX;
        this.wheelDeltaY = e.deltaY;
        this.hasWheelEvent = true;
    }

    protected process(entities: readonly Entity[]): void {
        // 如果没有绑定 canvas，不处理输入
        if (!this.canvas) return;

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
                this.handleScrollView(entity, transform);

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

                // 即使鼠标不在元素上，也需要更新按钮的目标颜色（恢复到 normal）
                this.handleButton(entity, interactable);
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

            // 如果是按钮，也调用按钮的 onClick
            const button = entity.getComponent(UIButtonComponent);
            if (button && !button.disabled) {
                button.onClick?.();
            }

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

        // 更新目标颜色和当前颜色
        const stateColor = button.getStateColor(interactable.getState());
        button.targetColor = stateColor;
        // 直接设置 currentColor 以便立即看到效果（动画系统会平滑过渡）
        button.currentColor = stateColor;

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

    private handleScrollView(entity: Entity, transform: UITransformComponent): void {
        const scrollView = entity.getComponent(UIScrollViewComponent);
        if (!scrollView) return;

        const viewportWidth = transform.computedWidth;
        const viewportHeight = transform.computedHeight;
        const maxScrollX = scrollView.getMaxScrollX(viewportWidth);
        const maxScrollY = scrollView.getMaxScrollY(viewportHeight);

        // 处理滚轮事件
        if (this.hasWheelEvent) {
            let deltaX = 0;
            let deltaY = 0;

            if (scrollView.verticalScroll && maxScrollY > 0) {
                deltaY = this.wheelDeltaY * (scrollView.wheelSpeed / 40);
            }
            if (scrollView.horizontalScroll && maxScrollX > 0) {
                deltaX = this.wheelDeltaX * (scrollView.wheelSpeed / 40);
            }

            if (deltaX !== 0 || deltaY !== 0) {
                if (scrollView.smoothScroll) {
                    scrollView.targetScrollX = this.clampScroll(scrollView.targetScrollX + deltaX, maxScrollX);
                    scrollView.targetScrollY = this.clampScroll(scrollView.targetScrollY + deltaY, maxScrollY);
                } else {
                    scrollView.scrollX = this.clampScroll(scrollView.scrollX + deltaX, maxScrollX);
                    scrollView.scrollY = this.clampScroll(scrollView.scrollY + deltaY, maxScrollY);
                    scrollView.targetScrollX = scrollView.scrollX;
                    scrollView.targetScrollY = scrollView.scrollY;
                }
                scrollView.velocityX = 0;
                scrollView.velocityY = 0;
            }

            this.hasWheelEvent = false;
            this.wheelDeltaX = 0;
            this.wheelDeltaY = 0;
        }

        // 处理内容拖拽滚动
        const isLeftPressed = this.mouseButtons[MouseButton.Left]!;
        const wasLeftPressed = this.prevMouseButtons[MouseButton.Left]!;

        if (isLeftPressed && !wasLeftPressed && !scrollView.dragging) {
            // 开始拖拽
            scrollView.dragging = true;
            scrollView.dragStartScrollX = scrollView.scrollX;
            scrollView.dragStartScrollY = scrollView.scrollY;
            this.scrollViewDragTarget = entity;
            this.scrollViewDragStartX = this.mouseX;
            this.scrollViewDragStartY = this.mouseY;
            this.scrollViewDragStartScrollX = scrollView.scrollX;
            this.scrollViewDragStartScrollY = scrollView.scrollY;
            this.scrollViewLastDragX = this.mouseX;
            this.scrollViewLastDragY = this.mouseY;
            this.scrollViewLastDragTime = performance.now();
            scrollView.velocityX = 0;
            scrollView.velocityY = 0;
        }

        if (scrollView.dragging && this.scrollViewDragTarget === entity) {
            if (isLeftPressed) {
                // 拖拽中
                const dragDeltaX = this.mouseX - this.scrollViewDragStartX;
                const dragDeltaY = this.mouseY - this.scrollViewDragStartY;

                let newScrollX = this.scrollViewDragStartScrollX - dragDeltaX;
                let newScrollY = this.scrollViewDragStartScrollY - dragDeltaY;

                if (scrollView.horizontalScroll) {
                    if (scrollView.elasticBounds) {
                        newScrollX = this.applyElasticBounds(newScrollX, maxScrollX, scrollView.elasticity);
                    } else {
                        newScrollX = this.clampScroll(newScrollX, maxScrollX);
                    }
                    scrollView.scrollX = newScrollX;
                    scrollView.targetScrollX = newScrollX;
                }

                if (scrollView.verticalScroll) {
                    if (scrollView.elasticBounds) {
                        newScrollY = this.applyElasticBounds(newScrollY, maxScrollY, scrollView.elasticity);
                    } else {
                        newScrollY = this.clampScroll(newScrollY, maxScrollY);
                    }
                    scrollView.scrollY = newScrollY;
                    scrollView.targetScrollY = newScrollY;
                }

                // 计算速度（用于惯性）
                const now = performance.now();
                const timeDelta = (now - this.scrollViewLastDragTime) / 1000;
                if (timeDelta > 0) {
                    scrollView.velocityX = (this.scrollViewLastDragX - this.mouseX) / timeDelta;
                    scrollView.velocityY = (this.scrollViewLastDragY - this.mouseY) / timeDelta;
                }
                this.scrollViewLastDragX = this.mouseX;
                this.scrollViewLastDragY = this.mouseY;
                this.scrollViewLastDragTime = now;
            } else {
                // 结束拖拽
                scrollView.dragging = false;
                this.scrollViewDragTarget = null;

                // 应用惯性
                if (!scrollView.inertia) {
                    scrollView.velocityX = 0;
                    scrollView.velocityY = 0;
                }
            }
        }

        // 更新惯性滚动
        this.updateScrollViewInertia(scrollView, maxScrollX, maxScrollY);

        // 平滑滚动到目标位置
        this.updateScrollViewSmooth(scrollView);
    }

    private clampScroll(value: number, max: number): number {
        return Math.max(0, Math.min(max, value));
    }

    private applyElasticBounds(value: number, max: number, elasticity: number): number {
        if (value < 0) {
            return value * elasticity;
        }
        if (value > max) {
            return max + (value - max) * elasticity;
        }
        return value;
    }

    private updateScrollViewInertia(scrollView: UIScrollViewComponent, maxScrollX: number, maxScrollY: number): void {
        if (scrollView.dragging) return;

        const dt = Time.deltaTime;
        const deceleration = scrollView.decelerationRate;
        const minVelocity = 10;

        // 应用减速
        if (Math.abs(scrollView.velocityX) > minVelocity || Math.abs(scrollView.velocityY) > minVelocity) {
            scrollView.velocityX *= Math.pow(deceleration, dt * 60);
            scrollView.velocityY *= Math.pow(deceleration, dt * 60);

            // 更新滚动位置
            if (scrollView.horizontalScroll) {
                scrollView.scrollX += scrollView.velocityX * dt;
                scrollView.targetScrollX = scrollView.scrollX;
            }
            if (scrollView.verticalScroll) {
                scrollView.scrollY += scrollView.velocityY * dt;
                scrollView.targetScrollY = scrollView.scrollY;
            }

            // 停止条件
            if (Math.abs(scrollView.velocityX) < minVelocity) scrollView.velocityX = 0;
            if (Math.abs(scrollView.velocityY) < minVelocity) scrollView.velocityY = 0;
        }

        // 弹回边界
        if (scrollView.elasticBounds && !scrollView.dragging) {
            const bounceSpeed = 8;

            if (scrollView.scrollX < 0) {
                scrollView.scrollX += (0 - scrollView.scrollX) * bounceSpeed * dt;
                scrollView.targetScrollX = scrollView.scrollX;
                if (Math.abs(scrollView.scrollX) < 0.5) scrollView.scrollX = 0;
            } else if (scrollView.scrollX > maxScrollX) {
                scrollView.scrollX += (maxScrollX - scrollView.scrollX) * bounceSpeed * dt;
                scrollView.targetScrollX = scrollView.scrollX;
                if (Math.abs(scrollView.scrollX - maxScrollX) < 0.5) scrollView.scrollX = maxScrollX;
            }

            if (scrollView.scrollY < 0) {
                scrollView.scrollY += (0 - scrollView.scrollY) * bounceSpeed * dt;
                scrollView.targetScrollY = scrollView.scrollY;
                if (Math.abs(scrollView.scrollY) < 0.5) scrollView.scrollY = 0;
            } else if (scrollView.scrollY > maxScrollY) {
                scrollView.scrollY += (maxScrollY - scrollView.scrollY) * bounceSpeed * dt;
                scrollView.targetScrollY = scrollView.scrollY;
                if (Math.abs(scrollView.scrollY - maxScrollY) < 0.5) scrollView.scrollY = maxScrollY;
            }
        } else {
            // 硬边界限制
            scrollView.scrollX = this.clampScroll(scrollView.scrollX, maxScrollX);
            scrollView.scrollY = this.clampScroll(scrollView.scrollY, maxScrollY);
        }
    }

    private updateScrollViewSmooth(scrollView: UIScrollViewComponent): void {
        if (scrollView.dragging) return;
        if (scrollView.velocityX !== 0 || scrollView.velocityY !== 0) return;

        const dt = Time.deltaTime;
        const smoothSpeed = 1 / Math.max(0.01, scrollView.smoothScrollDuration);

        const diffX = scrollView.targetScrollX - scrollView.scrollX;
        const diffY = scrollView.targetScrollY - scrollView.scrollY;

        if (Math.abs(diffX) > 0.5) {
            scrollView.scrollX += diffX * smoothSpeed * dt;
        } else {
            scrollView.scrollX = scrollView.targetScrollX;
        }

        if (Math.abs(diffY) > 0.5) {
            scrollView.scrollY += diffY * smoothSpeed * dt;
        } else {
            scrollView.scrollY = scrollView.targetScrollY;
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
