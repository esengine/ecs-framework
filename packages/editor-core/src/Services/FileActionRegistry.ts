import { IService } from '@esengine/ecs-framework';
import type { FileActionHandler, FileCreationTemplate } from '../Plugin/IPluginLoader';

// Re-export for backwards compatibility
export type { FileCreationTemplate } from '../Plugin/IPluginLoader';

/**
 * 文件操作注册表服务
 *
 * 管理插件注册的文件操作处理器和文件创建模板
 */
export class FileActionRegistry implements IService {
    private actionHandlers: Map<string, FileActionHandler[]> = new Map();
    private creationTemplates: FileCreationTemplate[] = [];

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
     * 清空所有注册
     */
    clear(): void {
        this.actionHandlers.clear();
        this.creationTemplates = [];
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
