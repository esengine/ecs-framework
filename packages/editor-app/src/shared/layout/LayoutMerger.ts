import type { IJsonModel, IJsonTabNode } from 'flexlayout-react';
import type { FlexDockPanel } from './types';

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
        const collect = (node: any) => {
            if (node.type === 'tab' && node.id) {
                panelIds.add(node.id);
            }
            if (node.children) {
                node.children.forEach((child: any) => collect(child));
            }
        };

        collect(layout.layout);

        if (layout.borders) {
            layout.borders.forEach((border: any) => {
                if (border.children) {
                    collect({ children: border.children });
                }
            });
        }

        return panelIds;
    }

    private static clearBorders(layout: IJsonModel): void {
        if (layout.borders) {
            layout.borders = layout.borders.map((border: any) => ({
                ...border,
                children: []
            }));
        }
    }

    private static removePanels(node: any, removedPanelIds: string[]): boolean {
        if (!node.children) return false;

        if (node.type === 'tabset' || node.type === 'row') {
            const originalLength = node.children.length;
            node.children = node.children.filter((child: any) => {
                if (child.type === 'tab') {
                    return !removedPanelIds.includes(child.id);
                }
                return true;
            });

            if (node.type === 'tabset' && node.children.length < originalLength) {
                if (node.selected >= node.children.length) {
                    node.selected = Math.max(0, node.children.length - 1);
                }
            }

            node.children.forEach((child: any) => this.removePanels(child, removedPanelIds));

            return node.children.length < originalLength;
        }

        return false;
    }

    private static findNewPanels(node: any, newPanelIds: string[]): IJsonTabNode[] {
        const newPanelTabs: IJsonTabNode[] = [];
        const find = (n: any) => {
            if (n.type === 'tab' && n.id && newPanelIds.includes(n.id)) {
                newPanelTabs.push(n);
            }
            if (n.children) {
                n.children.forEach((child: any) => find(child));
            }
        };
        find(node);
        return newPanelTabs;
    }

    private static addNewPanelsToCenter(node: any, newPanelTabs: IJsonTabNode[]): boolean {
        if (node.type === 'tabset') {
            const hasNonSidePanel = node.children?.some((child: any) => {
                const id = child.id || '';
                return !id.includes('hierarchy') &&
                       !id.includes('asset') &&
                       !id.includes('inspector') &&
                       !id.includes('console');
            });

            if (hasNonSidePanel && node.children) {
                node.children.push(...newPanelTabs);
                node.selected = node.children.length - 1;
                return true;
            }
        }

        if (node.children) {
            for (const child of node.children) {
                if (this.addNewPanelsToCenter(child, newPanelTabs)) {
                    return true;
                }
            }
        }

        return false;
    }
}
