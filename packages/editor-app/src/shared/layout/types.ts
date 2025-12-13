import type { ReactNode } from 'react';

/**
 * 面板布局位置
 * Panel layout position
 */
export type PanelLayoutPosition =
    | 'center'      // 中心区域（Viewport 所在的 tabset）| Center area (Viewport's tabset)
    | 'bottom'      // 中心区域下方独立 tabset | Separate tabset below center
    | 'right-top'   // 右侧上方（Hierarchy）| Right top area
    | 'right-bottom'; // 右侧下方（Inspector）| Right bottom area

/**
 * 面板布局配置
 * Panel layout configuration
 */
export interface PanelLayoutConfig {
    /**
     * 布局位置
     * Layout position
     *
     * @default 'center'
     */
    position?: PanelLayoutPosition;

    /**
     * 布局权重（百分比）
     * Layout weight (percentage)
     *
     * 仅对 'bottom' 位置有效，表示占父容器的高度比例
     * Only effective for 'bottom' position, represents height ratio of parent container
     *
     * @default 20
     */
    weight?: number;

    /**
     * 是否需要独立的 tabset（不与其他面板共享）
     * Whether needs a separate tabset (not shared with other panels)
     *
     * 当为 true 时，重新添加面板会使用默认布局而不是合并
     * When true, re-adding panel will use default layout instead of merging
     *
     * @default false
     */
    requiresSeparateTabset?: boolean;
}

/**
 * 可停靠面板描述符
 * Dockable panel descriptor
 */
export interface FlexDockPanel {
    /** 面板唯一标识 | Panel unique ID */
    id: string;

    /** 面板标题 | Panel title */
    title: string;

    /** 面板内容 | Panel content */
    content: ReactNode;

    /** 是否可关闭 | Whether closable */
    closable?: boolean;

    /**
     * 布局配置
     * Layout configuration
     *
     * 定义面板在布局中的位置和行为
     * Defines panel's position and behavior in layout
     */
    layout?: PanelLayoutConfig;
}
