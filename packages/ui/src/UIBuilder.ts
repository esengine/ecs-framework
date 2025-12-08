import { Entity, Scene, HierarchySystem, HierarchyComponent } from '@esengine/esengine';
import { UITransformComponent, AnchorPreset } from './components/UITransformComponent';
import { UIRenderComponent, UIRenderType } from './components/UIRenderComponent';
import { UIInteractableComponent } from './components/UIInteractableComponent';
import { UITextComponent } from './components/UITextComponent';
import { UILayoutComponent, UILayoutType, UIJustifyContent, UIAlignItems } from './components/UILayoutComponent';
import { UIButtonComponent } from './components/widgets/UIButtonComponent';
import { UIProgressBarComponent } from './components/widgets/UIProgressBarComponent';
import { UISliderComponent } from './components/widgets/UISliderComponent';
import { UIScrollViewComponent } from './components/widgets/UIScrollViewComponent';

/**
 * 基础 UI 配置
 * Base UI configuration
 */
export interface UIBaseConfig {
    name?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    anchor?: AnchorPreset;
    visible?: boolean;
    alpha?: number;
    zIndex?: number;
}

/**
 * 按钮配置
 * Button configuration
 */
export interface UIButtonConfig extends UIBaseConfig {
    label: string;
    onClick?: () => void;
    onLongPress?: () => void;
    normalColor?: number;
    hoverColor?: number;
    pressedColor?: number;
    textColor?: number;
    fontSize?: number;
    borderRadius?: number;
    disabled?: boolean;
}

/**
 * 文本配置
 * Text configuration
 */
export interface UITextConfig extends UIBaseConfig {
    text: string;
    fontSize?: number;
    fontFamily?: string;
    color?: number;
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    wordWrap?: boolean;
}

/**
 * 图片配置
 * Image configuration
 */
export interface UIImageConfig extends UIBaseConfig {
    /** 纹理资产 GUID 或运行时 ID | Texture asset GUID or runtime ID */
    textureGuid: string | number;
    tint?: number;
}

/**
 * 进度条配置
 * Progress bar configuration
 */
export interface UIProgressBarConfig extends UIBaseConfig {
    value?: number;
    maxValue?: number;
    fillColor?: number;
    backgroundColor?: number;
    borderRadius?: number;
    showText?: boolean;
    transitionDuration?: number;
}

/**
 * 滑块配置
 * Slider configuration
 */
export interface UISliderConfig extends UIBaseConfig {
    value?: number;
    minValue?: number;
    maxValue?: number;
    step?: number;
    onChange?: (value: number) => void;
    trackColor?: number;
    fillColor?: number;
    handleColor?: number;
}

/**
 * 面板配置
 * Panel configuration
 */
export interface UIPanelConfig extends UIBaseConfig {
    backgroundColor?: number;
    backgroundAlpha?: number;
    borderWidth?: number;
    borderColor?: number;
    borderRadius?: number;
    padding?: number | { top: number; right: number; bottom: number; left: number };
    layout?: 'none' | 'horizontal' | 'vertical' | 'grid';
    gap?: number;
    justifyContent?: UIJustifyContent;
    alignItems?: UIAlignItems;
}

/**
 * 滚动视图配置
 * Scroll view configuration
 */
export interface UIScrollViewConfig extends UIBaseConfig {
    contentWidth?: number;
    contentHeight?: number;
    horizontalScroll?: boolean;
    verticalScroll?: boolean;
    backgroundColor?: number;
}

/**
 * UI 构建器
 * UI Builder - Simplified API for creating UI elements
 *
 * 提供简化的 API 来创建常用 UI 元素
 * Provides simplified API for creating common UI elements
 */
export class UIBuilder {
    private scene: Scene;
    private idCounter: number = 0;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * 创建基础 UI 实体
     * Create base UI entity with transform
     */
    private createBase(config: UIBaseConfig, defaultName: string): Entity {
        const entity = this.scene.createEntity(config.name ?? `${defaultName}_${this.idCounter++}`);

        // 添加 HierarchyComponent 支持层级结构
        entity.addComponent(new HierarchyComponent());

        const transform = entity.addComponent(new UITransformComponent());
        transform.x = config.x ?? 0;
        transform.y = config.y ?? 0;
        transform.width = config.width ?? 100;
        transform.height = config.height ?? 30;
        transform.visible = config.visible ?? true;
        transform.alpha = config.alpha ?? 1;
        transform.zIndex = config.zIndex ?? 0;

        if (config.anchor) {
            transform.setAnchorPreset(config.anchor);
        }

        return entity;
    }

    /**
     * 创建按钮
     * Create button
     */
    public button(config: UIButtonConfig): Entity {
        const entity = this.createBase(config, 'Button');

        // 渲染组件
        const render = entity.addComponent(new UIRenderComponent());
        render.type = UIRenderType.RoundedRect;
        render.backgroundColor = config.normalColor ?? 0x4A90D9;
        render.setCornerRadius(config.borderRadius ?? 4);

        // 交互组件
        const interactable = entity.addComponent(new UIInteractableComponent());
        interactable.cursor = 'pointer';
        interactable.onClick = config.onClick;

        // 按钮组件
        const button = entity.addComponent(new UIButtonComponent());
        button.label = config.label;
        button.onClick = config.onClick;
        button.onLongPress = config.onLongPress;
        button.disabled = config.disabled ?? false;

        if (config.normalColor !== undefined) button.normalColor = config.normalColor;
        if (config.hoverColor !== undefined) button.hoverColor = config.hoverColor;
        if (config.pressedColor !== undefined) button.pressedColor = config.pressedColor;
        if (config.textColor !== undefined) button.textColor = config.textColor;

        button.currentColor = button.normalColor;
        button.targetColor = button.normalColor;

        // 文本组件
        const text = entity.addComponent(new UITextComponent());
        text.text = config.label;
        text.fontSize = config.fontSize ?? 14;
        text.color = config.textColor ?? 0xFFFFFF;
        text.align = 'center';
        text.verticalAlign = 'middle';

        return entity;
    }

    /**
     * 创建文本
     * Create text label
     */
    public text(config: UITextConfig): Entity {
        const entity = this.createBase(config, 'Text');

        const text = entity.addComponent(new UITextComponent());
        text.text = config.text;
        text.fontSize = config.fontSize ?? 14;
        text.fontFamily = config.fontFamily ?? 'Arial, sans-serif';
        text.color = config.color ?? 0x000000;
        text.align = config.align ?? 'left';
        text.verticalAlign = config.verticalAlign ?? 'middle';
        text.wordWrap = config.wordWrap ?? false;

        return entity;
    }

    /**
     * 创建图片
     * Create image
     */
    public image(config: UIImageConfig): Entity {
        const entity = this.createBase(config, 'Image');

        const render = entity.addComponent(new UIRenderComponent());
        render.type = UIRenderType.Image;
        render.textureGuid = config.textureGuid;
        render.textureTint = config.tint ?? 0xFFFFFF;

        return entity;
    }

    /**
     * 创建进度条
     * Create progress bar
     */
    public progressBar(config: UIProgressBarConfig): Entity {
        const entity = this.createBase({
            ...config,
            height: config.height ?? 20
        }, 'ProgressBar');

        // 渲染组件（背景）
        const render = entity.addComponent(new UIRenderComponent());
        render.type = UIRenderType.RoundedRect;
        render.backgroundColor = config.backgroundColor ?? 0x333333;
        render.setCornerRadius(config.borderRadius ?? 4);

        // 进度条组件
        const progress = entity.addComponent(new UIProgressBarComponent());
        progress.value = config.value ?? 0;
        progress.targetValue = config.value ?? 0;
        progress.displayValue = config.value ?? 0;
        progress.maxValue = config.maxValue ?? 100;
        progress.fillColor = config.fillColor ?? 0x4CAF50;
        progress.backgroundColor = config.backgroundColor ?? 0x333333;
        progress.cornerRadius = config.borderRadius ?? 4;
        progress.showText = config.showText ?? false;
        progress.transitionDuration = config.transitionDuration ?? 0.3;

        return entity;
    }

    /**
     * 创建滑块
     * Create slider
     */
    public slider(config: UISliderConfig): Entity {
        const entity = this.createBase({
            ...config,
            height: config.height ?? 20
        }, 'Slider');

        // 渲染组件（轨道背景）
        const render = entity.addComponent(new UIRenderComponent());
        render.type = UIRenderType.RoundedRect;
        render.backgroundColor = config.trackColor ?? 0x444444;
        render.setCornerRadius(2);

        // 交互组件
        const interactable = entity.addComponent(new UIInteractableComponent());
        interactable.cursor = 'pointer';

        // 滑块组件
        const slider = entity.addComponent(new UISliderComponent());
        slider.value = config.value ?? 0;
        slider.targetValue = config.value ?? 0;
        slider.displayValue = config.value ?? 0;
        slider.minValue = config.minValue ?? 0;
        slider.maxValue = config.maxValue ?? 100;
        slider.step = config.step ?? 0;
        slider.onChange = config.onChange;

        if (config.trackColor !== undefined) slider.trackColor = config.trackColor;
        if (config.fillColor !== undefined) slider.fillColor = config.fillColor;
        if (config.handleColor !== undefined) slider.handleColor = config.handleColor;

        return entity;
    }

    /**
     * 创建面板/容器
     * Create panel/container
     */
    public panel(config: UIPanelConfig): Entity {
        const entity = this.createBase(config, 'Panel');

        // 渲染组件
        const render = entity.addComponent(new UIRenderComponent());
        render.type = config.borderRadius ? UIRenderType.RoundedRect : UIRenderType.Rect;
        render.backgroundColor = config.backgroundColor ?? 0xFFFFFF;
        render.backgroundAlpha = config.backgroundAlpha ?? 1;

        if (config.borderWidth) {
            render.setBorder(config.borderWidth, config.borderColor ?? 0x000000);
        }
        if (config.borderRadius) {
            render.setCornerRadius(config.borderRadius);
        }

        // 布局组件
        if (config.layout && config.layout !== 'none') {
            const layout = entity.addComponent(new UILayoutComponent());

            switch (config.layout) {
                case 'horizontal':
                    layout.type = UILayoutType.Horizontal;
                    break;
                case 'vertical':
                    layout.type = UILayoutType.Vertical;
                    break;
                case 'grid':
                    layout.type = UILayoutType.Grid;
                    break;
            }

            if (config.gap !== undefined) {
                layout.setGap(config.gap);
            }
            if (config.padding !== undefined) {
                layout.setPadding(config.padding);
            }
            if (config.justifyContent !== undefined) {
                layout.justifyContent = config.justifyContent;
            }
            if (config.alignItems !== undefined) {
                layout.alignItems = config.alignItems;
            }
        }

        return entity;
    }

    /**
     * 创建滚动视图
     * Create scroll view
     */
    public scrollView(config: UIScrollViewConfig): Entity {
        const entity = this.createBase(config, 'ScrollView');

        // 渲染组件
        const render = entity.addComponent(new UIRenderComponent());
        render.type = UIRenderType.Rect;
        render.backgroundColor = config.backgroundColor ?? 0xF0F0F0;

        // 交互组件
        entity.addComponent(new UIInteractableComponent());

        // 滚动视图组件
        const scrollView = entity.addComponent(new UIScrollViewComponent());
        scrollView.contentWidth = config.contentWidth ?? (config.width ?? 100);
        scrollView.contentHeight = config.contentHeight ?? (config.height ?? 100);
        scrollView.horizontalScroll = config.horizontalScroll ?? false;
        scrollView.verticalScroll = config.verticalScroll ?? true;

        return entity;
    }

    /**
     * 创建分隔线
     * Create divider/separator
     */
    public divider(config: UIBaseConfig & { color?: number; horizontal?: boolean }): Entity {
        const isHorizontal = config.horizontal ?? true;
        const entity = this.createBase({
            ...config,
            width: isHorizontal ? (config.width ?? 100) : 1,
            height: isHorizontal ? 1 : (config.height ?? 100)
        }, 'Divider');

        const render = entity.addComponent(new UIRenderComponent());
        render.type = UIRenderType.Rect;
        render.backgroundColor = config.color ?? 0xCCCCCC;

        return entity;
    }

    /**
     * 创建空白占位
     * Create spacer
     */
    public spacer(config: UIBaseConfig): Entity {
        const entity = this.createBase(config, 'Spacer');
        // 空白占位不需要渲染组件
        return entity;
    }

    /**
     * 将子元素添加到父元素
     * Add child to parent
     */
    public addChild(parent: Entity, child: Entity): Entity {
        const hierarchySystem = this.scene.getSystem(HierarchySystem);
        if (hierarchySystem) {
            hierarchySystem.setParent(child, parent);
        }
        return child;
    }

    /**
     * 批量添加子元素
     * Add multiple children to parent
     */
    public addChildren(parent: Entity, children: Entity[]): Entity[] {
        const hierarchySystem = this.scene.getSystem(HierarchySystem);
        if (hierarchySystem) {
            for (const child of children) {
                hierarchySystem.setParent(child, parent);
            }
        }
        return children;
    }
}
