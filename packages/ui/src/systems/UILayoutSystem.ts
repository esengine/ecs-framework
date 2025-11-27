import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import { UITransformComponent } from '../components/UITransformComponent';
import { UILayoutComponent, UILayoutType, UIJustifyContent, UIAlignItems } from '../components/UILayoutComponent';

/**
 * UI 布局系统
 * UI Layout System - Computes layout for UI elements
 *
 * 计算 UI 元素的世界坐标和尺寸
 * Computes world coordinates and sizes for UI elements
 *
 * 注意：canvasWidth/canvasHeight 是 UI 设计的参考尺寸，不是实际渲染视口大小
 * Note: canvasWidth/canvasHeight is the UI design reference size, not the actual render viewport size
 */
@ECSSystem('UILayout')
export class UILayoutSystem extends EntitySystem {
    /**
     * UI 画布宽度（设计尺寸）
     * UI Canvas width (design size)
     */
    public canvasWidth: number = 1920;

    /**
     * UI 画布高度（设计尺寸）
     * UI Canvas height (design size)
     */
    public canvasHeight: number = 1080;

    constructor() {
        super(Matcher.empty().all(UITransformComponent));
    }

    /**
     * 设置 UI 画布尺寸（设计尺寸）
     * Set UI canvas size (design size)
     *
     * 这是 UI 布局计算的参考尺寸，通常是固定的设计分辨率（如 1920x1080）
     * This is the reference size for UI layout calculation, usually a fixed design resolution (e.g., 1920x1080)
     */
    public setCanvasSize(width: number, height: number): void {
        this.canvasWidth = width;
        this.canvasHeight = height;

        // 标记所有元素需要重新布局
        for (const entity of this.entities) {
            const transform = entity.getComponent(UITransformComponent);
            if (transform) {
                transform.layoutDirty = true;
            }
        }
    }

    /**
     * 获取 UI 画布尺寸
     * Get UI canvas size
     */
    public getCanvasSize(): { width: number; height: number } {
        return { width: this.canvasWidth, height: this.canvasHeight };
    }

    protected process(entities: readonly Entity[]): void {
        // 首先处理根元素（没有父元素的）
        const rootEntities = entities.filter(e => !e.parent || !e.parent.hasComponent(UITransformComponent));

        // 画布中心为原点，Y 轴向上为正
        // Canvas center is origin, Y axis points up
        // 左上角是 (-width/2, +height/2)，右下角是 (+width/2, -height/2)
        // Top-left is (-width/2, +height/2), bottom-right is (+width/2, -height/2)
        const parentX = -this.canvasWidth / 2;
        const parentY = this.canvasHeight / 2;  // Y 轴向上，所以顶部是正值

        for (const entity of rootEntities) {
            this.layoutEntity(entity, parentX, parentY, this.canvasWidth, this.canvasHeight, 1);
        }
    }

    /**
     * 递归布局实体及其子元素
     * Recursively layout entity and its children
     */
    private layoutEntity(
        entity: Entity,
        parentX: number,
        parentY: number,
        parentWidth: number,
        parentHeight: number,
        parentAlpha: number
    ): void {
        const transform = entity.getComponent(UITransformComponent);
        if (!transform) return;

        // 计算锚点位置
        // X 轴：向右为正，anchorMinX=0 是左边，anchorMinX=1 是右边
        // Y 轴：向上为正，anchorMinY=0 是顶部，anchorMinY=1 是底部
        // X axis: right is positive, anchorMinX=0 is left, anchorMinX=1 is right
        // Y axis: up is positive, anchorMinY=0 is top, anchorMinY=1 is bottom
        const anchorMinX = parentX + parentWidth * transform.anchorMinX;
        const anchorMaxX = parentX + parentWidth * transform.anchorMaxX;
        // Y 轴反转：parentY 是顶部（正值），向下减少
        // Y axis inverted: parentY is top (positive), decreases downward
        const anchorMinY = parentY - parentHeight * transform.anchorMinY;
        const anchorMaxY = parentY - parentHeight * transform.anchorMaxY;

        // 计算元素尺寸
        let width: number;
        let height: number;

        // 如果锚点 min 和 max 相同，使用固定尺寸
        if (transform.anchorMinX === transform.anchorMaxX) {
            width = transform.width;
        } else {
            // 拉伸模式：尺寸由锚点决定
            width = anchorMaxX - anchorMinX - transform.x;
        }

        if (transform.anchorMinY === transform.anchorMaxY) {
            height = transform.height;
        } else {
            // 拉伸模式：Y 轴反转，anchorMinY > anchorMaxY
            // Stretch mode: Y axis inverted, anchorMinY > anchorMaxY
            height = anchorMinY - anchorMaxY - transform.y;
        }

        // 应用尺寸约束
        if (transform.minWidth > 0) width = Math.max(width, transform.minWidth);
        if (transform.maxWidth > 0) width = Math.min(width, transform.maxWidth);
        if (transform.minHeight > 0) height = Math.max(height, transform.minHeight);
        if (transform.maxHeight > 0) height = Math.min(height, transform.maxHeight);

        // 计算世界位置（左下角，与 Gizmo origin=(0,0) 对应）
        // Calculate world position (bottom-left corner, matching Gizmo origin=(0,0))
        let worldX: number;
        let worldY: number;

        if (transform.anchorMinX === transform.anchorMaxX) {
            // 固定锚点模式
            // anchor 位置 + position 偏移 - pivot 偏移
            // 结果是矩形左边缘的 X 坐标
            worldX = anchorMinX + transform.x - width * transform.pivotX;
        } else {
            // 拉伸模式
            worldX = anchorMinX + transform.x;
        }

        if (transform.anchorMinY === transform.anchorMaxY) {
            // 固定锚点模式：Y 轴向上
            // Fixed anchor mode: Y axis up
            // anchorMinY 是锚点 Y 位置（anchor=0 在顶部，Y=+540）
            // position.y 是从锚点的偏移（正值向上）
            // pivot 决定元素哪个点对齐到 (anchor + position)
            // worldY 是元素底部的 Y 坐标（与 Gizmo origin=(0,0) 对应）
            // pivotY=0 意味着元素顶部对齐，pivotY=1 意味着元素底部对齐
            const anchorPosY = anchorMinY + transform.y;  // anchor 位置 + 偏移
            // pivotY=0: 顶部对齐，底部 = anchorPos - height
            // pivotY=0.5: 中心对齐，底部 = anchorPos - height/2
            // pivotY=1: 底部对齐，底部 = anchorPos
            worldY = anchorPosY - height * (1 - transform.pivotY);
        } else {
            // 拉伸模式：worldY 是底部
            worldY = anchorMaxY - transform.y;
        }

        // 更新计算后的值
        transform.worldX = worldX;
        transform.worldY = worldY;
        transform.computedWidth = width;
        transform.computedHeight = height;
        transform.worldAlpha = parentAlpha * transform.alpha;
        transform.layoutDirty = false;

        // 如果元素不可见，跳过子元素
        if (!transform.visible) return;

        // 处理子元素布局
        const children = entity.children.filter(c => c.hasComponent(UITransformComponent));
        if (children.length === 0) return;

        // 计算子元素的父容器边界
        // 子元素的 parentY 应该是当前元素的顶部 Y 坐标（worldY 是底部，顶部 = 底部 + 高度）
        const childParentY = worldY + height;

        // 检查是否有布局组件
        const layout = entity.getComponent(UILayoutComponent);
        if (layout && layout.type !== UILayoutType.None) {
            this.layoutChildren(layout, transform, children);
        } else {
            // 无布局组件，直接递归处理子元素
            for (const child of children) {
                this.layoutEntity(
                    child,
                    worldX,
                    childParentY,
                    width,
                    height,
                    transform.worldAlpha
                );
            }
        }
    }

    /**
     * 根据布局组件布局子元素
     * Layout children according to layout component
     */
    private layoutChildren(
        layout: UILayoutComponent,
        parentTransform: UITransformComponent,
        children: Entity[]
    ): void {
        const contentStartX = parentTransform.worldX + layout.paddingLeft;
        // Y-up 系统：worldY 是底部，顶部 = worldY + height
        // contentStartY 是内容区域的顶部 Y（从顶部减去 paddingTop）
        const parentTopY = parentTransform.worldY + parentTransform.computedHeight;
        const contentStartY = parentTopY - layout.paddingTop;
        const contentWidth = parentTransform.computedWidth - layout.getHorizontalPadding();
        const contentHeight = parentTransform.computedHeight - layout.getVerticalPadding();

        switch (layout.type) {
            case UILayoutType.Horizontal:
                this.layoutHorizontal(layout, parentTransform, children, contentStartX, contentStartY, contentWidth, contentHeight);
                break;
            case UILayoutType.Vertical:
                this.layoutVertical(layout, parentTransform, children, contentStartX, contentStartY, contentWidth, contentHeight);
                break;
            case UILayoutType.Grid:
                this.layoutGrid(layout, parentTransform, children, contentStartX, contentStartY, contentWidth, contentHeight);
                break;
            default:
                // 默认按正常方式递归（传递顶部 Y）
                for (const child of children) {
                    this.layoutEntity(
                        child,
                        parentTransform.worldX,
                        parentTopY,
                        parentTransform.computedWidth,
                        parentTransform.computedHeight,
                        parentTransform.worldAlpha
                    );
                }
        }
    }

    /**
     * 水平布局
     * Horizontal layout
     */
    private layoutHorizontal(
        layout: UILayoutComponent,
        parentTransform: UITransformComponent,
        children: Entity[],
        startX: number,
        startY: number,
        contentWidth: number,
        contentHeight: number
    ): void {
        // 计算总子元素宽度
        const childSizes = children.map(child => {
            const t = child.getComponent(UITransformComponent)!;
            return { entity: child, width: t.width, height: t.height };
        });

        const totalChildWidth = childSizes.reduce((sum, c) => sum + c.width, 0);
        const totalGap = layout.gap * (children.length - 1);
        const totalWidth = totalChildWidth + totalGap;

        // 计算起始位置（基于 justifyContent）
        let offsetX = startX;
        let gap = layout.gap;

        switch (layout.justifyContent) {
            case UIJustifyContent.Center:
                offsetX = startX + (contentWidth - totalWidth) / 2;
                break;
            case UIJustifyContent.End:
                offsetX = startX + contentWidth - totalWidth;
                break;
            case UIJustifyContent.SpaceBetween:
                if (children.length > 1) {
                    gap = (contentWidth - totalChildWidth) / (children.length - 1);
                }
                break;
            case UIJustifyContent.SpaceAround:
                if (children.length > 0) {
                    const space = (contentWidth - totalChildWidth) / children.length;
                    gap = space;
                    offsetX = startX + space / 2;
                }
                break;
            case UIJustifyContent.SpaceEvenly:
                if (children.length > 0) {
                    const space = (contentWidth - totalChildWidth) / (children.length + 1);
                    gap = space;
                    offsetX = startX + space;
                }
                break;
        }

        // 布局每个子元素
        // startY 是内容区域的顶部 Y（Y-up 系统）
        for (let i = 0; i < children.length; i++) {
            const child = children[i]!;
            const childTransform = child.getComponent(UITransformComponent)!;
            const size = childSizes[i]!;

            // 计算子元素顶部 Y 位置（基于 alignItems）
            // startY 是内容区域顶部，向下布局意味着 Y 值减小
            let childTopY = startY;  // 默认从顶部开始
            let childHeight = size.height;

            switch (layout.alignItems) {
                case UIAlignItems.Center:
                    // 在内容区域垂直居中：顶部 Y = startY - (contentHeight - childHeight) / 2
                    childTopY = startY - (contentHeight - childHeight) / 2;
                    break;
                case UIAlignItems.End:
                    // 对齐到底部：顶部 Y = startY - contentHeight + childHeight
                    childTopY = startY - contentHeight + childHeight;
                    break;
                case UIAlignItems.Stretch:
                    childHeight = contentHeight;
                    break;
                // UIAlignItems.Start: 默认从顶部开始，不需要修改
            }

            // 直接设置子元素的世界坐标（worldY 是底部 Y）
            childTransform.worldX = offsetX;
            childTransform.worldY = childTopY - childHeight;  // 底部 Y = 顶部 Y - 高度
            childTransform.computedWidth = size.width;
            childTransform.computedHeight = childHeight;
            childTransform.worldAlpha = parentTransform.worldAlpha * childTransform.alpha;
            childTransform.layoutDirty = false;

            // 递归处理子元素的子元素
            this.processChildrenRecursive(child, childTransform);

            offsetX += size.width + gap;
        }
    }

    /**
     * 垂直布局
     * Vertical layout
     * Y-up 系统：startY 是内容区域的顶部，子元素从上往下排列（Y 值递减）
     */
    private layoutVertical(
        layout: UILayoutComponent,
        parentTransform: UITransformComponent,
        children: Entity[],
        startX: number,
        startY: number,
        contentWidth: number,
        contentHeight: number
    ): void {
        // 计算总子元素高度
        const childSizes = children.map(child => {
            const t = child.getComponent(UITransformComponent)!;
            return { entity: child, width: t.width, height: t.height };
        });

        const totalChildHeight = childSizes.reduce((sum, c) => sum + c.height, 0);
        const totalGap = layout.gap * (children.length - 1);
        const totalHeight = totalChildHeight + totalGap;

        // 计算第一个子元素的顶部 Y（Y-up 系统，从顶部开始向下）
        // startY 是内容区域顶部
        let currentTopY = startY;  // 从顶部开始
        let gap = layout.gap;

        switch (layout.justifyContent) {
            case UIJustifyContent.Center:
                // 垂直居中：第一个元素的顶部 Y = startY - (contentHeight - totalHeight) / 2
                currentTopY = startY - (contentHeight - totalHeight) / 2;
                break;
            case UIJustifyContent.End:
                // 对齐到底部：第一个元素的顶部 Y = startY - contentHeight + totalHeight
                currentTopY = startY - contentHeight + totalHeight;
                break;
            case UIJustifyContent.SpaceBetween:
                if (children.length > 1) {
                    gap = (contentHeight - totalChildHeight) / (children.length - 1);
                }
                break;
            case UIJustifyContent.SpaceAround:
                if (children.length > 0) {
                    const space = (contentHeight - totalChildHeight) / children.length;
                    gap = space;
                    currentTopY = startY - space / 2;
                }
                break;
            case UIJustifyContent.SpaceEvenly:
                if (children.length > 0) {
                    const space = (contentHeight - totalChildHeight) / (children.length + 1);
                    gap = space;
                    currentTopY = startY - space;
                }
                break;
        }

        // 布局每个子元素（从上往下）
        for (let i = 0; i < children.length; i++) {
            const child = children[i]!;
            const childTransform = child.getComponent(UITransformComponent)!;
            const size = childSizes[i]!;

            // 计算 X 位置
            let childX = startX;
            let childWidth = size.width;

            switch (layout.alignItems) {
                case UIAlignItems.Center:
                    childX = startX + (contentWidth - childWidth) / 2;
                    break;
                case UIAlignItems.End:
                    childX = startX + contentWidth - childWidth;
                    break;
                case UIAlignItems.Stretch:
                    childWidth = contentWidth;
                    break;
            }

            // worldY 是底部 Y = 顶部 Y - 高度
            childTransform.worldX = childX;
            childTransform.worldY = currentTopY - size.height;
            childTransform.computedWidth = childWidth;
            childTransform.computedHeight = size.height;
            childTransform.worldAlpha = parentTransform.worldAlpha * childTransform.alpha;
            childTransform.layoutDirty = false;

            this.processChildrenRecursive(child, childTransform);

            // 移动到下一个元素的顶部位置（向下 = Y 减小）
            currentTopY -= size.height + gap;
        }
    }

    /**
     * 网格布局
     * Grid layout
     * Y-up 系统：startY 是内容区域的顶部，网格从上往下、从左往右排列
     */
    private layoutGrid(
        layout: UILayoutComponent,
        parentTransform: UITransformComponent,
        children: Entity[],
        startX: number,
        startY: number,
        contentWidth: number,
        _contentHeight: number
    ): void {
        const columns = layout.columns;
        const gapX = layout.getHorizontalGap();
        const gapY = layout.getVerticalGap();

        // 计算单元格尺寸
        const cellWidth = layout.cellWidth > 0
            ? layout.cellWidth
            : (contentWidth - gapX * (columns - 1)) / columns;
        const cellHeight = layout.cellHeight > 0
            ? layout.cellHeight
            : cellWidth; // 默认正方形

        for (let i = 0; i < children.length; i++) {
            const child = children[i]!;
            const childTransform = child.getComponent(UITransformComponent)!;

            const col = i % columns;
            const row = Math.floor(i / columns);

            const x = startX + col * (cellWidth + gapX);
            // Y-up 系统：第一行在顶部，行号增加 Y 值减小
            // 单元格顶部 Y = startY - row * (cellHeight + gapY)
            // 单元格底部 Y = 顶部 Y - cellHeight
            const cellTopY = startY - row * (cellHeight + gapY);
            const y = cellTopY - cellHeight;  // worldY 是底部 Y

            childTransform.worldX = x;
            childTransform.worldY = y;
            childTransform.computedWidth = cellWidth;
            childTransform.computedHeight = cellHeight;
            childTransform.worldAlpha = parentTransform.worldAlpha * childTransform.alpha;
            childTransform.layoutDirty = false;

            this.processChildrenRecursive(child, childTransform);
        }
    }

    /**
     * 递归处理子元素
     * Recursively process children
     */
    private processChildrenRecursive(entity: Entity, parentTransform: UITransformComponent): void {
        const children = entity.children.filter(c => c.hasComponent(UITransformComponent));
        if (children.length === 0) return;

        // 计算子元素的父容器顶部 Y（worldY 是底部，顶部 = 底部 + 高度）
        const parentTopY = parentTransform.worldY + parentTransform.computedHeight;

        const layout = entity.getComponent(UILayoutComponent);
        if (layout && layout.type !== UILayoutType.None) {
            this.layoutChildren(layout, parentTransform, children);
        } else {
            for (const child of children) {
                this.layoutEntity(
                    child,
                    parentTransform.worldX,
                    parentTopY,
                    parentTransform.computedWidth,
                    parentTransform.computedHeight,
                    parentTransform.worldAlpha
                );
            }
        }
    }
}
