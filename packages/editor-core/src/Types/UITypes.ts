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

/**
 * 面板位置
 */
export enum PanelPosition {
    Left = 'left',
    Right = 'right',
    Bottom = 'bottom',
    Center = 'center'
}

/**
 * 面板描述符
 */
export interface PanelDescriptor {
    /**
     * 面板唯一标识
     */
    id: string;

    /**
     * 显示标题
     */
    title: string;

    /**
     * 面板位置
     */
    position: PanelPosition;

    /**
     * 渲染组件或HTML
     */
    component?: any;

    /**
     * 默认宽度/高度（像素）
     */
    defaultSize?: number;

    /**
     * 是否可调整大小
     */
    resizable?: boolean;

    /**
     * 是否可关闭
     */
    closable?: boolean;

    /**
     * 图标
     */
    icon?: string;

    /**
     * 排序权重
     */
    order?: number;

    /**
     * 是否为动态面板（不默认显示，需要手动打开）
     */
    isDynamic?: boolean;
}

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
