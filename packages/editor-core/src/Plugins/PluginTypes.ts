/**
 * 统一插件类型定义
 * Unified plugin type definitions
 */

import type { ComponentType } from '@esengine/ecs-framework';
import type { ComponentType as ReactComponentType } from 'react';

/**
 * 组件注册配置
 * Component registration configuration
 */
export interface ComponentRegistration {
    /** 组件类型 */
    type: ComponentType;
    /** 自定义检查器组件 */
    inspector?: ReactComponentType<any>;
    /** 图标名称 */
    icon?: string;
    /** 分类 */
    category?: string;
    /** 显示名称 */
    displayName?: string;
    /** 组件操作（如右键菜单） */
    actions?: ComponentActionDefinition[];
}

/**
 * 组件操作定义（用于声明式 API）
 * Component action definition (for declarative API)
 */
export interface ComponentActionDefinition {
    /** 操作ID */
    id: string;
    /** 显示标签 */
    label: string;
    /** 图标 */
    icon?: string;
    /** 执行函数 */
    execute: (componentData: any, entityId: number) => void | Promise<void>;
}

/**
 * 菜单项注册配置
 * Menu item registration configuration
 */
export interface MenuItemRegistration {
    /** 菜单路径，如 "GameObject/2D Object/Tilemap" */
    path: string;
    /** 执行动作 */
    action: () => void | number | Promise<void> | Promise<number>;
    /** 图标 */
    icon?: string;
    /** 快捷键 */
    shortcut?: string;
    /** 优先级（数字越小越靠前） */
    priority?: number;
}

/**
 * 面板注册配置
 * Panel registration configuration
 */
export interface PanelRegistration {
    /** 面板ID */
    id: string;
    /** 面板组件 */
    component: ReactComponentType<any>;
    /** 标题 */
    title: string;
    /** 图标 */
    icon?: string;
    /** 默认位置 */
    defaultPosition?: 'left' | 'right' | 'bottom' | 'float';
    /** 默认是否可见 */
    defaultVisible?: boolean;
}

/**
 * 工具栏项注册配置
 * Toolbar item registration configuration
 */
export interface ToolbarItemRegistration {
    /** 工具ID */
    id: string;
    /** 显示标签 */
    label: string;
    /** 图标 */
    icon: string;
    /** 工具提示 */
    tooltip?: string;
    /** 执行动作 */
    action: () => void;
    /** 分组 */
    group?: string;
    /** 优先级 */
    priority?: number;
}

/**
 * 实体创建模板注册配置
 */
export interface EntityTemplateRegistration {
    /** 模板ID */
    id: string;
    /** 显示名称 */
    label: string;
    /** 分类路径，如 "2D Object" */
    category?: string;
    /** 图标 */
    icon?: string;
    /** 排序优先级 */
    priority?: number;
    /** 创建实体函数，返回实体ID */
    create: (parentEntityId?: number) => number | Promise<number>;
}

/**
 * 资产处理器注册配置
 * Asset handler registration configuration
 */
export interface AssetHandlerRegistration {
    /** 文件扩展名列表 */
    extensions: string[];
    /** 处理器名称 */
    name: string;
    /** 图标 */
    icon?: string;
    /** 打开资产 */
    onOpen?: (assetPath: string) => void | Promise<void>;
    /** 预览资产 */
    onPreview?: (assetPath: string) => ReactComponentType<any> | null;
    /** 创建资产 */
    onCreate?: () => Promise<string | null>;
}

/**
 * 编辑器插件定义
 * Editor plugin definition
 */
export interface EditorPluginDefinition {
    /** 插件唯一ID */
    id: string;
    /** 插件显示名称 */
    name: string;
    /** 版本号 */
    version?: string;
    /** 描述 */
    description?: string;
    /** 依赖的其他插件ID */
    dependencies?: string[];

    // === 注册配置 ===

    /** 组件注册 */
    components?: ComponentRegistration[];

    /** 菜单项注册 */
    menuItems?: MenuItemRegistration[];

    /** 面板注册 */
    panels?: PanelRegistration[];

    /** 工具栏项注册 */
    toolbarItems?: ToolbarItemRegistration[];

    /** 资产处理器注册 */
    assetHandlers?: AssetHandlerRegistration[];

    /** 实体创建模板 */
    entityTemplates?: EntityTemplateRegistration[];

    // === 生命周期钩子 ===

    /** 插件激活时调用 */
    onActivate?: () => void | Promise<void>;

    /** 插件停用时调用 */
    onDeactivate?: () => void;

    /** 编辑器准备就绪时调用 */
    onEditorReady?: () => void | Promise<void>;

    /** 场景加载后调用 */
    onSceneLoaded?: (scenePath: string) => void;

    /** 场景保存前调用 */
    onSceneSaving?: (scenePath: string) => boolean | void;
}

/**
 * 插件状态
 * Plugin state
 */
export type PluginState = 'inactive' | 'activating' | 'active' | 'deactivating' | 'error';

/**
 * 已注册的插件信息
 * Registered plugin info
 */
export interface RegisteredPlugin {
    /** 插件定义 */
    definition: EditorPluginDefinition;
    /** 当前状态 */
    state: PluginState;
    /** 错误信息（如果有） */
    error?: string;
    /** 激活时间 */
    activatedAt?: number;
}

/**
 * 菜单树节点
 * Menu tree node
 */
export interface MenuTreeNode {
    /** 节点名称 */
    name: string;
    /** 完整路径 */
    path: string;
    /** 子节点 */
    children: Map<string, MenuTreeNode>;
    /** 菜单项（叶子节点） */
    item?: MenuItemRegistration;
    /** 来源插件ID */
    pluginId?: string;
}
