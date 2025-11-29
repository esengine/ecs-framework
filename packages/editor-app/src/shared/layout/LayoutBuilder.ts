import type { IJsonModel, IJsonTabSetNode, IJsonRowNode } from 'flexlayout-react';
import type { FlexDockPanel } from './types';

// 固定宽度配置（像素）| Fixed width configuration (pixels)
const RIGHT_PANEL_WIDTH = 320;
const RIGHT_HIERARCHY_HEIGHT_RATIO = 40;
const RIGHT_INSPECTOR_HEIGHT_RATIO = 60;

export class LayoutBuilder {
    static createDefaultLayout(panels: FlexDockPanel[], activePanelId?: string): IJsonModel {
        const viewportPanels = panels.filter((p) => p.id === 'viewport');
        const hierarchyPanels = panels.filter((p) => p.id.includes('hierarchy'));
        const inspectorPanels = panels.filter((p) => p.id.includes('inspector'));
        const pluginPanels = panels.filter((p) =>
            !viewportPanels.includes(p) &&
            !hierarchyPanels.includes(p) &&
            !inspectorPanels.includes(p)
        );

        const mainRowChildren = this.buildLayout(
            viewportPanels,
            pluginPanels,
            hierarchyPanels,
            inspectorPanels,
            activePanelId
        );

        return {
            global: {
                tabEnableClose: true,
                tabEnableRename: false,
                tabSetEnableMaximize: true,
                borderSize: 200,
                tabSetMinWidth: 100,
                tabSetMinHeight: 100,
                splitterSize: 6,
                splitterExtra: 4
            },
            borders: [],
            layout: {
                type: 'row',
                weight: 100,
                children: mainRowChildren
            }
        };
    }

    private static buildLayout(
        viewportPanels: FlexDockPanel[],
        pluginPanels: FlexDockPanel[],
        hierarchyPanels: FlexDockPanel[],
        inspectorPanels: FlexDockPanel[],
        activePanelId?: string
    ): (IJsonTabSetNode | IJsonRowNode)[] {
        const mainRowChildren: (IJsonTabSetNode | IJsonRowNode)[] = [];

        const leftPanels = [...viewportPanels, ...pluginPanels];
        if (leftPanels.length > 0) {
            let activeTabIndex = 0;
            if (activePanelId) {
                const index = leftPanels.findIndex((p) => p.id === activePanelId);
                if (index !== -1) {
                    activeTabIndex = index;
                }
            }

            mainRowChildren.push({
                type: 'tabset',
                weight: 100, // 占据剩余空间
                selected: activeTabIndex,
                enableMaximize: true,
                children: leftPanels.map((p) => ({
                    type: 'tab',
                    name: p.title,
                    id: p.id,
                    component: p.id,
                    enableClose: p.closable !== false
                }))
            });
        }

        const rightColumnChildren: IJsonTabSetNode[] = [];

        if (hierarchyPanels.length > 0) {
            rightColumnChildren.push({
                type: 'tabset',
                weight: RIGHT_HIERARCHY_HEIGHT_RATIO,
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

        if (inspectorPanels.length > 0) {
            rightColumnChildren.push({
                type: 'tabset',
                weight: RIGHT_INSPECTOR_HEIGHT_RATIO,
                enableMaximize: true,
                children: inspectorPanels.map((p) => ({
                    type: 'tab',
                    name: p.title,
                    id: p.id,
                    component: p.id,
                    enableClose: p.closable !== false
                }))
            });
        }

        if (rightColumnChildren.length > 0) {
            mainRowChildren.push({
                type: 'row',
                width: RIGHT_PANEL_WIDTH, // 使用固定宽度而不是权重
                children: rightColumnChildren
            } as IJsonRowNode);
        }

        return mainRowChildren;
    }
}
