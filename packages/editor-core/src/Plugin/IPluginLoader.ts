/**
 * 编辑器模块接口
 * Editor module interfaces
 *
 * 定义编辑器专用的模块接口和 UI 描述符类型。
 * Define editor-specific module interfaces and UI descriptor types.
 */

import type { ServiceContainer } from '@esengine/ecs-framework';

// 从 PluginDescriptor 重新导出（来源于 engine-core）
export type {
    PluginCategory,
    LoadingPhase,
    ModuleType,
    ModuleDescriptor,
    PluginDependency,
    PluginDescriptor,
    SystemContext,
    IRuntimeModule,
    IPlugin
} from './PluginDescriptor';

// ============================================================================
// UI 描述符类型 | UI Descriptor Types
// ============================================================================

/**
 * 面板位置
 * Panel position
 */
export enum PanelPosition {
    Left = 'left',
    Right = 'right',
    Bottom = 'bottom',
    Center = 'center'
}

/**
 * 面板描述符
 * Panel descriptor
 */
export interface PanelDescriptor {
    /** 面板ID | Panel ID */
    id: string;
    /** 面板标题 | Panel title */
    title: string;
    /** 面板图标 | Panel icon */
    icon?: string;
    /** 面板位置 | Panel position */
    position: PanelPosition;
    /** 渲染组件 | Render component */
    component?: any;
    /** 渲染函数 | Render function */
    render?: () => any;
    /** 默认大小 | Default size */
    defaultSize?: number;
    /** 是否可调整大小 | Is resizable */
    resizable?: boolean;
    /** 是否可关闭 | Is closable */
    closable?: boolean;
    /** 排序权重 | Order weight */
    order?: number;
    /** 是否为动态面板 | Is dynamic panel */
    isDynamic?: boolean;
}

/**
 * 菜单项描述符
 * Menu item descriptor
 */
export interface MenuItemDescriptor {
    /** 菜单ID | Menu ID */
    id: string;
    /** 菜单标签 | Menu label */
    label: string;
    /** 父菜单ID | Parent menu ID */
    parentId?: string;
    /** 图标 | Icon */
    icon?: string;
    /** 快捷键 | Shortcut */
    shortcut?: string;
    /** 执行函数 | Execute function */
    execute?: () => void;
    /** 子菜单 | Submenu items */
    children?: MenuItemDescriptor[];
}

/**
 * 工具栏项描述符
 * Toolbar item descriptor
 */
export interface ToolbarItemDescriptor {
    /** 工具栏项ID | Toolbar item ID */
    id: string;
    /** 标签 | Label */
    label: string;
    /** 图标 | Icon */
    icon: string;
    /** 提示 | Tooltip */
    tooltip?: string;
    /** 执行函数 | Execute function */
    execute: () => void;
}

/**
 * 组件检视器提供者
 * Component inspector provider
 */
export interface ComponentInspectorProviderDef {
    /** 组件类型名 | Component type name */
    componentType: string;
    /** 优先级 | Priority */
    priority?: number;
    /** 渲染函数 | Render function */
    render: (component: any, entity: any, onChange: (key: string, value: any) => void) => any;
}

/**
 * Gizmo 提供者注册
 * Gizmo provider registration
 */
export interface GizmoProviderRegistration {
    /** 组件类型 | Component type */
    componentType: any;
    /** 获取 Gizmo 数据 | Get gizmo data */
    getGizmoData: (component: any, entity: any, isSelected: boolean) => any[];
}

/**
 * 文件操作处理器
 * File action handler
 */
export interface FileActionHandler {
    /** 支持的文件扩展名 | Supported file extensions */
    extensions: string[];
    /** 双击处理 | Double click handler */
    onDoubleClick?: (filePath: string) => void | Promise<void>;
    /** 打开处理 | Open handler */
    onOpen?: (filePath: string) => void | Promise<void>;
    /** 获取上下文菜单 | Get context menu */
    getContextMenuItems?: (filePath: string, parentPath: string) => any[];
}

/**
 * 实体创建模板
 * Entity creation template
 */
export interface EntityCreationTemplate {
    /** 模板ID | Template ID */
    id: string;
    /** 标签 | Label */
    label: string;
    /** 图标组件 | Icon component */
    icon?: any;
    /** 分类 | Category */
    category?: string;
    /** 排序权重 | Order weight */
    order?: number;
    /** 创建函数 | Create function */
    create: (parentEntityId?: number) => number | Promise<number>;
}

/**
 * 组件操作
 * Component action
 */
export interface ComponentAction {
    /** 操作ID | Action ID */
    id: string;
    /** 组件名 | Component name */
    componentName: string;
    /** 标签 | Label */
    label: string;
    /** 图标 | Icon */
    icon?: any;
    /** 排序权重 | Order weight */
    order?: number;
    /** 执行函数 | Execute function */
    execute: (component: any, entity: any) => void | Promise<void>;
}

/**
 * 序列化器接口
 * Serializer interface
 */
export interface ISerializer<T = any> {
    /** 获取支持的类型 | Get supported type */
    getSupportedType(): string;
    /** 序列化数据 | Serialize data */
    serialize(data: T): Uint8Array;
    /** 反序列化数据 | Deserialize data */
    deserialize(data: Uint8Array): T;
}

/**
 * 文件创建模板
 * File creation template
 */
export interface FileCreationTemplate {
    /** 模板ID | Template ID */
    id: string;
    /** 标签 | Label */
    label: string;
    /** 扩展名 | Extension */
    extension: string;
    /** 图标 | Icon */
    icon?: string;
    /** 分类 | Category */
    category?: string;
    /**
     * 获取文件内容 | Get file content
     * @param fileName 文件名（不含路径，含扩展名）
     * @returns 文件内容字符串
     */
    getContent: (fileName: string) => string | Promise<string>;
}

// ============================================================================
// 编辑器模块接口 | Editor Module Interface
// ============================================================================

/**
 * 编辑器模块加载器
 * Editor module loader
 */
export interface IEditorModuleLoader {
    /**
     * 安装编辑器模块
     * Install editor module
     */
    install(services: ServiceContainer): Promise<void>;

    /**
     * 卸载编辑器模块
     * Uninstall editor module
     */
    uninstall?(): Promise<void>;

    /**
     * 返回面板描述列表
     * Get panel descriptors
     */
    getPanels?(): PanelDescriptor[];

    /**
     * 返回菜单项列表
     * Get menu items
     */
    getMenuItems?(): MenuItemDescriptor[];

    /**
     * 返回工具栏项列表
     * Get toolbar items
     */
    getToolbarItems?(): ToolbarItemDescriptor[];

    /**
     * 返回检视器提供者列表
     * Get inspector providers
     */
    getInspectorProviders?(): ComponentInspectorProviderDef[];

    /**
     * 返回 Gizmo 提供者列表
     * Get gizmo providers
     */
    getGizmoProviders?(): GizmoProviderRegistration[];

    /**
     * 返回文件操作处理器列表
     * Get file action handlers
     */
    getFileActionHandlers?(): FileActionHandler[];

    /**
     * 返回实体创建模板列表
     * Get entity creation templates
     */
    getEntityCreationTemplates?(): EntityCreationTemplate[];

    /**
     * 返回组件操作列表
     * Get component actions
     */
    getComponentActions?(): ComponentAction[];

    /**
     * 返回文件创建模板列表
     * Get file creation templates
     */
    getFileCreationTemplates?(): FileCreationTemplate[];

    // ===== 生命周期钩子 | Lifecycle hooks =====

    /** 编辑器就绪 | Editor ready */
    onEditorReady?(): void | Promise<void>;

    /** 项目打开 | Project open */
    onProjectOpen?(projectPath: string): void | Promise<void>;

    /** 项目关闭 | Project close */
    onProjectClose?(): void | Promise<void>;

    /** 场景加载 | Scene loaded */
    onSceneLoaded?(scenePath: string): void;

    /** 场景保存前 | Before scene save */
    onSceneSaving?(scenePath: string): boolean | void;

    /** 设置语言 | Set locale */
    setLocale?(locale: string): void;
}

// ============================================================================
// 类型别名（向后兼容）| Type Aliases (backward compatibility)
// ============================================================================

/**
 * IPluginLoader 类型别名
 *
 * @deprecated 使用 IPlugin 代替。IPluginLoader 只是 IPlugin 的别名。
 * @deprecated Use IPlugin instead. IPluginLoader is just an alias for IPlugin.
 */
export type { IPlugin as IPluginLoader } from './PluginDescriptor';

/**
 * IRuntimeModuleLoader 类型别名
 *
 * @deprecated 使用 IRuntimeModule 代替。
 * @deprecated Use IRuntimeModule instead.
 */
export type { IRuntimeModule as IRuntimeModuleLoader } from './PluginDescriptor';
