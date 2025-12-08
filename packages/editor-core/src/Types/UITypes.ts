/**
 * 菜单项配置
 */
export interface MenuItem {
    /**
     * 菜单项唯一标识
     */
    id: string;

    /**
     * 显示文本
     */
    label: string;

    /**
     * 父菜单ID，用于构建层级菜单
     */
    parentId?: string;

    /**
     * 点击回调
     */
    onClick?: () => void;

    /**
     * 键盘快捷键
     */
    shortcut?: string;

    /**
     * 图标
     */
    icon?: string;

    /**
     * 是否禁用
     */
    disabled?: boolean;

    /**
     * 分隔符
     */
    separator?: boolean;

    /**
     * 排序权重
     */
    order?: number;
}

/**
 * 工具栏项配置
 */
export interface ToolbarItem {
    /**
     * 工具栏项唯一标识
     */
    id: string;

    /**
     * 显示文本
     */
    label: string;

    /**
     * 工具栏组ID
     */
    groupId: string;

    /**
     * 点击回调
     */
    onClick?: () => void;

    /**
     * 图标
     */
    icon?: string;

    /**
     * 是否禁用
     */
    disabled?: boolean;

    /**
     * 排序权重
     */
    order?: number;
}

// Re-export PanelPosition and PanelDescriptor from Plugin system
export { PanelPosition, type PanelDescriptor } from '../Plugin/EditorModule';

/**
 * UI 扩展点类型
 */
export enum UIExtensionType {
    Menu = 'menu',
    Toolbar = 'toolbar',
    Panel = 'panel',
    Inspector = 'inspector',
    StatusBar = 'statusbar'
}

// Re-export EntityCreationTemplate from Plugin system
export type { EntityCreationTemplate } from '../Plugin/EditorModule';
