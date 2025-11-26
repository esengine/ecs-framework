import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import { UITransformComponent } from '../components/UITransformComponent';
import { UILayoutComponent, UILayoutType, UIJustifyContent, UIAlignItems } from '../components/UILayoutComponent';

/**
 * UI 布局系统
 * UI Layout System - Computes layout for UI elements
 *
 * 计算 UI 元素的世界坐标和尺寸
 * Computes world coordinates and sizes for UI elements
 */
@ECSSystem('UILayout')
export class UILayoutSystem extends EntitySystem {
    /**
     * 视口宽度
     * Viewport width
     */
    public viewportWidth: number = 1920;

    /**
     * 视口高度
     * Viewport height
     */
    public viewportHeight: number = 1080;

    constructor() {
        super(Matcher.empty().all(UITransformComponent));
    }

    /**
     * 设置视口尺寸
     * Set viewport size
     */
    public setViewport(width: number, height: number): void {
        this.viewportWidth = width;
        this.viewportHeight = height;

        // 标记所有元素需要重新布局
        for (const entity of this.entities) {
            const transform = entity.getComponent(UITransformComponent);
            if (transform) {
                transform.layoutDirty = true;
            }
        }
    }

    protected process(entities: readonly Entity[]): void {
        // 首先处理根元素（没有父元素的）
        const rootEntities = entities.filter(e => !e.parent || !e.parent.hasComponent(UITransformComponent));

        for (const entity of rootEntities) {
            this.layoutEntity(entity, 0, 0, this.viewportWidth, this.viewportHeight, 1);
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
        const anchorMinX = parentX + parentWidth * transform.anchorMinX;
        const anchorMinY = parentY + parentHeight * transform.anchorMinY;
        const anchorMaxX = parentX + parentWidth * transform.anchorMaxX;
        const anchorMaxY = parentY + parentHeight * transform.anchorMaxY;

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
            height = anchorMaxY - anchorMinY - transform.y;
        }

        // 应用尺寸约束
        if (transform.minWidth > 0) width = Math.max(width, transform.minWidth);
        if (transform.maxWidth > 0) width = Math.min(width, transform.maxWidth);
        if (transform.minHeight > 0) height = Math.max(height, transform.minHeight);
        if (transform.maxHeight > 0) height = Math.min(height, transform.maxHeight);

        // 计算世界位置
        let worldX: number;
        let worldY: number;

        if (transform.anchorMinX === transform.anchorMaxX) {
            // 固定锚点模式
            worldX = anchorMinX + transform.x - width * transform.pivotX;
        } else {
            // 拉伸模式
            worldX = anchorMinX + transform.x;
        }

        if (transform.anchorMinY === transform.anchorMaxY) {
            worldY = anchorMinY + transform.y - height * transform.pivotY;
        } else {
            worldY = anchorMinY + transform.y;
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
                    worldY,
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
        const contentStartY = parentTransform.worldY + layout.paddingTop;
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
                // 默认按正常方式递归
                for (const child of children) {
                    this.layoutEntity(
                        child,
                        parentTransform.worldX,
                        parentTransform.worldY,
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
        for (let i = 0; i < children.length; i++) {
            const child = children[i]!;
            const childTransform = child.getComponent(UITransformComponent)!;
            const size = childSizes[i]!;

            // 计算 Y 位置（基于 alignItems）
            let childY = startY;
            let childHeight = size.height;

            switch (layout.alignItems) {
                case UIAlignItems.Center:
                    childY = startY + (contentHeight - childHeight) / 2;
                    break;
                case UIAlignItems.End:
                    childY = startY + contentHeight - childHeight;
                    break;
                case UIAlignItems.Stretch:
                    childHeight = contentHeight;
                    break;
            }

            // 直接设置子元素的世界坐标
            childTransform.worldX = offsetX;
            childTransform.worldY = childY;
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

        // 计算起始位置
        let offsetY = startY;
        let gap = layout.gap;

        switch (layout.justifyContent) {
            case UIJustifyContent.Center:
                offsetY = startY + (contentHeight - totalHeight) / 2;
                break;
            case UIJustifyContent.End:
                offsetY = startY + contentHeight - totalHeight;
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
                    offsetY = startY + space / 2;
                }
                break;
            case UIJustifyContent.SpaceEvenly:
                if (children.length > 0) {
                    const space = (contentHeight - totalChildHeight) / (children.length + 1);
                    gap = space;
                    offsetY = startY + space;
                }
                break;
        }

        // 布局每个子元素
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

            childTransform.worldX = childX;
            childTransform.worldY = offsetY;
            childTransform.computedWidth = childWidth;
            childTransform.computedHeight = size.height;
            childTransform.worldAlpha = parentTransform.worldAlpha * childTransform.alpha;
            childTransform.layoutDirty = false;

            this.processChildrenRecursive(child, childTransform);

            offsetY += size.height + gap;
        }
    }

    /**
     * 网格布局
     * Grid layout
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
            const y = startY + row * (cellHeight + gapY);

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

        const layout = entity.getComponent(UILayoutComponent);
        if (layout && layout.type !== UILayoutType.None) {
            this.layoutChildren(layout, parentTransform, children);
        } else {
            for (const child of children) {
                this.layoutEntity(
                    child,
                    parentTransform.worldX,
                    parentTransform.worldY,
                    parentTransform.computedWidth,
                    parentTransform.computedHeight,
                    parentTransform.worldAlpha
                );
            }
        }
    }
}
