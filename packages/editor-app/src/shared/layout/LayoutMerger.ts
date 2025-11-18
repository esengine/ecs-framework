import type { IJsonModel, IJsonTabNode } from 'flexlayout-react';
import type { FlexDockPanel } from './types';
import type { IJsonLayoutNode, IJsonBorderNode, IJsonTabsetNode } from './FlexLayoutTypes';
import { hasChildren, isTabNode, isTabsetNode } from './FlexLayoutTypes';

export class LayoutMerger {
    static merge(savedLayout: IJsonModel, defaultLayout: IJsonModel, currentPanels: FlexDockPanel[]): IJsonModel {
        const currentPanelIds = new Set(currentPanels.map(p => p.id));
        const savedPanelIds = this.collectPanelIds(savedLayout);
        const newPanelIds = Array.from(currentPanelIds).filter(id => !savedPanelIds.has(id));
        const removedPanelIds = Array.from(savedPanelIds).filter(id => !currentPanelIds.has(id));

        const mergedLayout = JSON.parse(JSON.stringify(savedLayout));

        this.clearBorders(mergedLayout);

        if (removedPanelIds.length > 0) {
            this.removePanels(mergedLayout.layout, removedPanelIds);
        }

        if (newPanelIds.length === 0) {
            return mergedLayout;
        }

        const newPanelTabs = this.findNewPanels(defaultLayout.layout, newPanelIds);

        if (!this.addNewPanelsToCenter(mergedLayout.layout, newPanelTabs)) {
            return defaultLayout;
        }

        return mergedLayout;
    }

    private static collectPanelIds(layout: IJsonModel): Set<string> {
        const panelIds = new Set<string>();
        const collect = (node: IJsonLayoutNode) => {
            if (isTabNode(node) && node.id) {
                panelIds.add(node.id);
            }
            if (hasChildren(node)) {
                node.children.forEach((child) => collect(child as IJsonLayoutNode));
            }
        };

        if (layout.layout) {
            collect(layout.layout as IJsonLayoutNode);
        }

        if (layout.borders) {
            layout.borders.forEach((border: IJsonBorderNode) => {
                if (border.children) {
                    border.children.forEach((child) => collect(child as IJsonLayoutNode));
                }
            });
        }

        return panelIds;
    }

    private static clearBorders(layout: IJsonModel): void {
        if (layout.borders) {
            layout.borders = layout.borders.map((border: IJsonBorderNode) => ({
                ...border,
                children: []
            }));
        }
    }

    private static removePanels(node: IJsonLayoutNode, removedPanelIds: string[]): boolean {
        if (!hasChildren(node)) return false;

        const originalLength = node.children.length;
        node.children = node.children.filter((child) => {
            if (isTabNode(child)) {
                return !removedPanelIds.includes(child.id || '');
            }
            return true;
        }) as any;

        if (isTabsetNode(node) && node.children.length < originalLength) {
            if (node.selected !== undefined && node.selected >= node.children.length) {
                node.selected = Math.max(0, node.children.length - 1);
            }
        }

        node.children.forEach((child) => this.removePanels(child as IJsonLayoutNode, removedPanelIds));

        return node.children.length < originalLength;
    }

    private static findNewPanels(node: IJsonLayoutNode, newPanelIds: string[]): IJsonTabNode[] {
        const newPanelTabs: IJsonTabNode[] = [];
        const find = (n: IJsonLayoutNode) => {
            if (isTabNode(n) && n.id && newPanelIds.includes(n.id)) {
                newPanelTabs.push(n);
            }
            if (hasChildren(n)) {
                n.children.forEach((child) => find(child as IJsonLayoutNode));
            }
        };
        find(node);
        return newPanelTabs;
    }

    private static addNewPanelsToCenter(node: IJsonLayoutNode, newPanelTabs: IJsonTabNode[]): boolean {
        if (isTabsetNode(node)) {
            const hasNonSidePanel = node.children?.some((child) => {
                const id = child.id || '';
                return (
                    !id.includes('hierarchy') &&
                    !id.includes('asset') &&
                    !id.includes('inspector') &&
                    !id.includes('console')
                );
            });

            if (hasNonSidePanel && node.children) {
                node.children.push(...newPanelTabs);
                node.selected = node.children.length - 1;
                return true;
            }
        }

        if (hasChildren(node)) {
            for (const child of node.children) {
                if (this.addNewPanelsToCenter(child as IJsonLayoutNode, newPanelTabs)) {
                    return true;
                }
            }
        }

        return false;
    }
}
