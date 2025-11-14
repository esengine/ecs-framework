import type { IJsonModel, IJsonTabSetNode, IJsonRowNode } from 'flexlayout-react';
import type { FlexDockPanel } from './types';

export class LayoutBuilder {
    static createDefaultLayout(panels: FlexDockPanel[], activePanelId?: string): IJsonModel {
        const hierarchyPanels = panels.filter((p) => p.id.includes('hierarchy'));
        const assetPanels = panels.filter((p) => p.id.includes('asset'));
        const rightPanels = panels.filter((p) => p.id.includes('inspector'));
        const bottomPanels = panels.filter((p) => p.id.includes('console'));
        const centerPanels = panels.filter((p) =>
            !hierarchyPanels.includes(p) && !assetPanels.includes(p) && !rightPanels.includes(p) && !bottomPanels.includes(p)
        );

        const centerColumnChildren = this.buildCenterColumn(centerPanels, bottomPanels, activePanelId);
        const mainRowChildren = this.buildMainRow(hierarchyPanels, assetPanels, centerColumnChildren, rightPanels);

        return {
            global: {
                tabEnableClose: true,
                tabEnableRename: false,
                tabSetEnableMaximize: true,
                borderSize: 200,
                tabSetMinWidth: 100,
                tabSetMinHeight: 100
            },
            borders: [],
            layout: {
                type: 'row',
                weight: 100,
                children: mainRowChildren
            }
        };
    }

    private static buildCenterColumn(
        centerPanels: FlexDockPanel[],
        bottomPanels: FlexDockPanel[],
        activePanelId?: string
    ): (IJsonTabSetNode | IJsonRowNode)[] {
        const children: (IJsonTabSetNode | IJsonRowNode)[] = [];

        if (centerPanels.length > 0) {
            let activeTabIndex = 0;
            if (activePanelId) {
                const index = centerPanels.findIndex((p) => p.id === activePanelId);
                if (index !== -1) {
                    activeTabIndex = index;
                }
            }

            children.push({
                type: 'tabset',
                weight: 70,
                selected: activeTabIndex,
                enableMaximize: true,
                children: centerPanels.map((p) => ({
                    type: 'tab',
                    name: p.title,
                    id: p.id,
                    component: p.id,
                    enableClose: p.closable !== false
                }))
            });
        }

        if (bottomPanels.length > 0) {
            children.push({
                type: 'tabset',
                weight: 30,
                enableMaximize: true,
                children: bottomPanels.map((p) => ({
                    type: 'tab',
                    name: p.title,
                    id: p.id,
                    component: p.id,
                    enableClose: p.closable !== false
                }))
            });
        }

        return children;
    }

    private static buildMainRow(
        hierarchyPanels: FlexDockPanel[],
        assetPanels: FlexDockPanel[],
        centerColumnChildren: (IJsonTabSetNode | IJsonRowNode)[],
        rightPanels: FlexDockPanel[]
    ): (IJsonTabSetNode | IJsonRowNode)[] {
        const mainRowChildren: (IJsonTabSetNode | IJsonRowNode)[] = [];

        if (hierarchyPanels.length > 0 || assetPanels.length > 0) {
            const leftColumnChildren = this.buildLeftColumn(hierarchyPanels, assetPanels);
            mainRowChildren.push({
                type: 'row',
                weight: 20,
                children: leftColumnChildren
            });
        }

        if (centerColumnChildren.length > 0) {
            this.addCenterColumn(mainRowChildren, centerColumnChildren);
        }

        if (rightPanels.length > 0) {
            mainRowChildren.push({
                type: 'tabset',
                weight: 20,
                enableMaximize: true,
                children: rightPanels.map((p) => ({
                    type: 'tab',
                    name: p.title,
                    id: p.id,
                    component: p.id,
                    enableClose: p.closable !== false
                }))
            });
        }

        return mainRowChildren;
    }

    private static buildLeftColumn(
        hierarchyPanels: FlexDockPanel[],
        assetPanels: FlexDockPanel[]
    ): IJsonTabSetNode[] {
        const leftColumnChildren: IJsonTabSetNode[] = [];

        if (hierarchyPanels.length > 0) {
            leftColumnChildren.push({
                type: 'tabset',
                weight: 50,
                enableMaximize: true,
                children: hierarchyPanels.map((p) => ({
                    type: 'tab',
                    name: p.title,
                    id: p.id,
                    component: p.id,
                    enableClose: p.closable !== false
                }))
            });
        }

        if (assetPanels.length > 0) {
            leftColumnChildren.push({
                type: 'tabset',
                weight: 50,
                enableMaximize: true,
                children: assetPanels.map((p) => ({
                    type: 'tab',
                    name: p.title,
                    id: p.id,
                    component: p.id,
                    enableClose: p.closable !== false
                }))
            });
        }

        return leftColumnChildren;
    }

    private static addCenterColumn(
        mainRowChildren: (IJsonTabSetNode | IJsonRowNode)[],
        centerColumnChildren: (IJsonTabSetNode | IJsonRowNode)[]
    ): void {
        if (centerColumnChildren.length === 1) {
            const centerChild = centerColumnChildren[0];
            if (centerChild && centerChild.type === 'tabset') {
                mainRowChildren.push({
                    type: 'tabset',
                    weight: 60,
                    enableMaximize: true,
                    children: centerChild.children
                } as IJsonTabSetNode);
            } else if (centerChild) {
                mainRowChildren.push({
                    type: 'row',
                    weight: 60,
                    children: centerChild.children
                } as IJsonRowNode);
            }
        } else {
            mainRowChildren.push({
                type: 'row',
                weight: 60,
                children: centerColumnChildren
            });
        }
    }
}
