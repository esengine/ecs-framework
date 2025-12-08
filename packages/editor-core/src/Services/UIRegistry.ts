import type { IService } from '@esengine/ecs-framework';
import { Injectable } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';
import type { MenuItem, ToolbarItem, PanelDescriptor } from '../Types/UITypes';

const logger = createLogger('UIRegistry');

/**
 * UI 注册表
 *
 * 管理所有编辑器 UI 扩展点的注册和查询。
 */
@Injectable()
export class UIRegistry implements IService {
    private menus: Map<string, MenuItem> = new Map();
    private toolbarItems: Map<string, ToolbarItem> = new Map();
    private panels: Map<string, PanelDescriptor> = new Map();

    /**
     * 注册菜单项
     */
    public registerMenu(item: MenuItem): void {
        if (this.menus.has(item.id)) {
            logger.warn(`Menu item ${item.id} is already registered`);
            return;
        }

        this.menus.set(item.id, item);
        logger.debug(`Registered menu item: ${item.id}`);
    }

    /**
     * 批量注册菜单项
     */
    public registerMenus(items: MenuItem[]): void {
        for (const item of items) {
            this.registerMenu(item);
        }
    }

    /**
     * 注销菜单项
     */
    public unregisterMenu(id: string): boolean {
        const result = this.menus.delete(id);
        if (result) {
            logger.debug(`Unregistered menu item: ${id}`);
        }
        return result;
    }

    /**
     * 获取菜单项
     */
    public getMenu(id: string): MenuItem | undefined {
        return this.menus.get(id);
    }

    /**
     * 获取所有菜单项
     */
    public getAllMenus(): MenuItem[] {
        return Array.from(this.menus.values()).sort((a, b) => {
            return (a.order ?? 0) - (b.order ?? 0);
        });
    }

    /**
     * 获取指定父菜单的子菜单
     */
    public getChildMenus(parentId: string): MenuItem[] {
        return this.getAllMenus()
            .filter((item) => item.parentId === parentId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    /**
     * 注册工具栏项
     */
    public registerToolbarItem(item: ToolbarItem): void {
        if (this.toolbarItems.has(item.id)) {
            logger.warn(`Toolbar item ${item.id} is already registered`);
            return;
        }

        this.toolbarItems.set(item.id, item);
        logger.debug(`Registered toolbar item: ${item.id}`);
    }

    /**
     * 批量注册工具栏项
     */
    public registerToolbarItems(items: ToolbarItem[]): void {
        for (const item of items) {
            this.registerToolbarItem(item);
        }
    }

    /**
     * 注销工具栏项
     */
    public unregisterToolbarItem(id: string): boolean {
        const result = this.toolbarItems.delete(id);
        if (result) {
            logger.debug(`Unregistered toolbar item: ${id}`);
        }
        return result;
    }

    /**
     * 获取工具栏项
     */
    public getToolbarItem(id: string): ToolbarItem | undefined {
        return this.toolbarItems.get(id);
    }

    /**
     * 获取所有工具栏项
     */
    public getAllToolbarItems(): ToolbarItem[] {
        return Array.from(this.toolbarItems.values()).sort((a, b) => {
            return (a.order ?? 0) - (b.order ?? 0);
        });
    }

    /**
     * 获取指定组的工具栏项
     */
    public getToolbarItemsByGroup(groupId: string): ToolbarItem[] {
        return this.getAllToolbarItems()
            .filter((item) => item.groupId === groupId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    /**
     * 注册面板
     */
    public registerPanel(panel: PanelDescriptor): void {
        if (this.panels.has(panel.id)) {
            logger.warn(`Panel ${panel.id} is already registered`);
            return;
        }

        this.panels.set(panel.id, panel);
        logger.debug(`Registered panel: ${panel.id}`);
    }

    /**
     * 批量注册面板
     */
    public registerPanels(panels: PanelDescriptor[]): void {
        for (const panel of panels) {
            this.registerPanel(panel);
        }
    }

    /**
     * 注销面板
     */
    public unregisterPanel(id: string): boolean {
        const result = this.panels.delete(id);
        if (result) {
            logger.debug(`Unregistered panel: ${id}`);
        }
        return result;
    }

    /**
     * 获取面板
     */
    public getPanel(id: string): PanelDescriptor | undefined {
        return this.panels.get(id);
    }

    /**
     * 获取所有面板
     */
    public getAllPanels(): PanelDescriptor[] {
        return Array.from(this.panels.values()).sort((a, b) => {
            return (a.order ?? 0) - (b.order ?? 0);
        });
    }

    /**
     * 获取指定位置的面板
     */
    public getPanelsByPosition(position: string): PanelDescriptor[] {
        return this.getAllPanels()
            .filter((panel) => panel.position === position)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    /**
     * 释放资源
     */
    public dispose(): void {
        this.menus.clear();
        this.toolbarItems.clear();
        this.panels.clear();
        logger.info('UIRegistry disposed');
    }
}
