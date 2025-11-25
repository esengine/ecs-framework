import type { IPlugin } from '@esengine/ecs-framework';
import type { MenuItem, ToolbarItem, PanelDescriptor, EntityCreationTemplate } from '../Types/UITypes';
import type { ComponentAction } from '../Services/ComponentActionRegistry';
import type { ReactNode } from 'react';

/**
 * 编辑器插件类别
 */
export enum EditorPluginCategory {
    /**
     * 工具插件
     */
    Tool = 'tool',

    /**
     * 窗口插件
     */
    Window = 'window',

    /**
     * 检视器插件
     */
    Inspector = 'inspector',

    /**
     * 系统插件
     */
    System = 'system',

    /**
     * 导入导出插件
     */
    ImportExport = 'import-export'
}

/**
 * 序列化器接口
 */
export interface ISerializer<T = any> {
    /**
     * 序列化为二进制数据
     */
    serialize(data: T): Uint8Array;

    /**
     * 从二进制数据反序列化
     */
    deserialize(data: Uint8Array): T;

    /**
     * 获取序列化器支持的数据类型
     */
    getSupportedType(): string;
}

/**
 * 文件上下文菜单项
 */
export interface FileContextMenuItem {
    /**
     * 菜单项标签
     */
    label: string;

    /**
     * 图标
     */
    icon?: ReactNode;

    /**
     * 点击处理函数
     */
    onClick: (filePath: string, parentPath: string) => void | Promise<void>;

    /**
     * 是否禁用
     */
    disabled?: boolean;

    /**
     * 是否为分隔符
     */
    separator?: boolean;
}

/**
 * 文件创建模板
 */
export interface FileCreationTemplate {
    /**
     * 模板名称
     */
    label: string;

    /**
     * 文件扩展名（不含点）
     */
    extension: string;

    /**
     * 默认文件名
     */
    defaultFileName: string;

    /**
     * 图标
     */
    icon?: ReactNode;

    /**
     * 创建文件内容的函数
     */
    createContent: (fileName: string) => string | Promise<string>;
}

/**
 * 文件操作处理器
 */
export interface FileActionHandler {
    /**
     * 支持的文件扩展名列表
     */
    extensions: string[];

    /**
     * 双击处理函数
     */
    onDoubleClick?: (filePath: string) => void | Promise<void>;

    /**
     * 打开文件处理函数
     */
    onOpen?: (filePath: string) => void | Promise<void>;

    /**
     * 获取上下文菜单项
     */
    getContextMenuItems?: (filePath: string, parentPath: string) => FileContextMenuItem[];
}

/**
 * 编辑器插件接口
 *
 * 扩展了运行时插件接口，添加了编辑器特定的功能。
 */
export interface IEditorPlugin extends IPlugin {
    /**
     * 插件显示名称
     */
    readonly displayName: string;

    /**
     * 插件类别
     */
    readonly category: EditorPluginCategory;

    /**
     * 插件描述
     */
    readonly description?: string;

    /**
     * 插件图标
     */
    readonly icon?: string;

    /**
     * 注册菜单项
     */
    registerMenuItems?(): MenuItem[];

    /**
     * 注册工具栏项
     */
    registerToolbar?(): ToolbarItem[];

    /**
     * 注册面板
     */
    registerPanels?(): PanelDescriptor[];

    /**
     * 提供序列化器
     */
    getSerializers?(): ISerializer[];

    /**
     * 编辑器就绪回调
     */
    onEditorReady?(): void | Promise<void>;

    /**
     * 项目打开回调
     */
    onProjectOpen?(projectPath: string): void | Promise<void>;

    /**
     * 项目关闭回调
     */
    onProjectClose?(): void | Promise<void>;

    /**
     * 文件保存前回调
     */
    onBeforeSave?(filePath: string, data: any): void | Promise<void>;

    /**
     * 文件保存后回调
     */
    onAfterSave?(filePath: string): void | Promise<void>;

    /**
     * 设置插件语言
     */
    setLocale?(locale: string): void;

    /**
     * 获取行为树节点模板
     */
    getNodeTemplates?(): any[];

    /**
     * 注册文件操作处理器
     */
    registerFileActionHandlers?(): FileActionHandler[];

    /**
     * 注册文件创建模板
     */
    registerFileCreationTemplates?(): FileCreationTemplate[];

    /**
     * 注册实体创建模板
     */
    registerEntityCreationTemplates?(): EntityCreationTemplate[];

    /**
     * 注册组件操作
     */
    registerComponentActions?(): ComponentAction[];
}

/**
 * 编辑器插件元数据
 */
export interface IEditorPluginMetadata {
    /**
     * 插件名称
     */
    name: string;

    /**
     * 显示名称
     */
    displayName: string;

    /**
     * 版本
     */
    version: string;

    /**
     * 类别
     */
    category: EditorPluginCategory;

    /**
     * 描述
     */
    description?: string;

    /**
     * 图标
     */
    icon?: string;

    /**
     * 是否已启用
     */
    enabled: boolean;

    /**
     * 安装时间戳
     */
    installedAt?: number;
}
