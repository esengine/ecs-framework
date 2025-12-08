import { IService } from '@esengine/esengine';
import type { FileActionHandler, FileCreationTemplate } from '../Plugin/EditorModule';

// Re-export for backwards compatibility
export type { FileCreationTemplate } from '../Plugin/EditorModule';

/**
 * 资产创建消息映射
 * Asset creation message mapping
 *
 * 定义扩展名到创建消息的映射，用于 PropertyInspector 中的资产字段创建按钮
 */
export interface AssetCreationMapping {
    /** 文件扩展名（包含点号，如 '.tilemap'）| File extension (with dot) */
    extension: string;
    /** 创建资产时发送的消息名 | Message name to publish when creating asset */
    createMessage: string;
    /** 是否支持创建（可选，默认 true）| Whether creation is supported */
    canCreate?: boolean;
}

/**
 * FileActionRegistry 服务标识符
 * FileActionRegistry service identifier
 */
export const IFileActionRegistry = Symbol.for('IFileActionRegistry');

/**
 * 文件操作注册表服务
 *
 * 管理插件注册的文件操作处理器和文件创建模板
 */
export class FileActionRegistry implements IService {
    private actionHandlers: Map<string, FileActionHandler[]> = new Map();
    private creationTemplates: FileCreationTemplate[] = [];
    private assetCreationMappings: Map<string, AssetCreationMapping> = new Map();

    /**
     * 注册文件操作处理器
     */
    registerActionHandler(handler: FileActionHandler): void {
        for (const ext of handler.extensions) {
            const handlers = this.actionHandlers.get(ext) || [];
            handlers.push(handler);
            this.actionHandlers.set(ext, handlers);
        }
    }

    /**
     * 注销文件操作处理器
     */
    unregisterActionHandler(handler: FileActionHandler): void {
        for (const ext of handler.extensions) {
            const handlers = this.actionHandlers.get(ext);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index !== -1) {
                    handlers.splice(index, 1);
                }
                if (handlers.length === 0) {
                    this.actionHandlers.delete(ext);
                }
            }
        }
    }

    /**
     * 注册文件创建模板
     */
    registerCreationTemplate(template: FileCreationTemplate): void {
        this.creationTemplates.push(template);
    }

    /**
     * 注销文件创建模板
     */
    unregisterCreationTemplate(template: FileCreationTemplate): void {
        const index = this.creationTemplates.indexOf(template);
        if (index !== -1) {
            this.creationTemplates.splice(index, 1);
        }
    }

    /**
     * 获取文件扩展名的处理器
     */
    getHandlersForExtension(extension: string): FileActionHandler[] {
        return this.actionHandlers.get(extension) || [];
    }

    /**
     * 获取文件的处理器
     */
    getHandlersForFile(filePath: string): FileActionHandler[] {
        const extension = this.getFileExtension(filePath);
        return extension ? this.getHandlersForExtension(extension) : [];
    }

    /**
     * 获取所有文件创建模板
     */
    getCreationTemplates(): FileCreationTemplate[] {
        return this.creationTemplates;
    }

    /**
     * 处理文件双击
     */
    async handleDoubleClick(filePath: string): Promise<boolean> {
        const handlers = this.getHandlersForFile(filePath);

        for (const handler of handlers) {
            if (handler.onDoubleClick) {
                await handler.onDoubleClick(filePath);
                return true;
            }
        }
        return false;
    }

    /**
     * 处理文件打开
     */
    async handleOpen(filePath: string): Promise<boolean> {
        const handlers = this.getHandlersForFile(filePath);
        for (const handler of handlers) {
            if (handler.onOpen) {
                await handler.onOpen(filePath);
                return true;
            }
        }
        return false;
    }

    /**
     * 注册资产创建消息映射
     * Register asset creation message mapping
     */
    registerAssetCreationMapping(mapping: AssetCreationMapping): void {
        const normalizedExt = mapping.extension.startsWith('.')
            ? mapping.extension.toLowerCase()
            : `.${mapping.extension.toLowerCase()}`;
        this.assetCreationMappings.set(normalizedExt, {
            ...mapping,
            extension: normalizedExt
        });
    }

    /**
     * 注销资产创建消息映射
     * Unregister asset creation message mapping
     */
    unregisterAssetCreationMapping(extension: string): void {
        const normalizedExt = extension.startsWith('.')
            ? extension.toLowerCase()
            : `.${extension.toLowerCase()}`;
        this.assetCreationMappings.delete(normalizedExt);
    }

    /**
     * 获取扩展名对应的资产创建消息映射
     * Get asset creation mapping for extension
     */
    getAssetCreationMapping(extension: string): AssetCreationMapping | undefined {
        const normalizedExt = extension.startsWith('.')
            ? extension.toLowerCase()
            : `.${extension.toLowerCase()}`;
        return this.assetCreationMappings.get(normalizedExt);
    }

    /**
     * 检查扩展名是否支持创建资产
     * Check if extension supports asset creation
     */
    canCreateAsset(extension: string): boolean {
        const mapping = this.getAssetCreationMapping(extension);
        return mapping?.canCreate !== false;
    }

    /**
     * 获取所有资产创建映射
     * Get all asset creation mappings
     */
    getAllAssetCreationMappings(): AssetCreationMapping[] {
        return Array.from(this.assetCreationMappings.values());
    }

    /**
     * 清空所有注册
     */
    clear(): void {
        this.actionHandlers.clear();
        this.creationTemplates = [];
        this.assetCreationMappings.clear();
    }

    /**
     * 释放资源
     */
    dispose(): void {
        this.clear();
    }

    private getFileExtension(filePath: string): string | null {
        const lastDot = filePath.lastIndexOf('.');
        if (lastDot === -1) return null;
        return filePath.substring(lastDot + 1).toLowerCase();
    }
}
