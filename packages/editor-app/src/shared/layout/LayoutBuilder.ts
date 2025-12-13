import type { IJsonModel, IJsonTabSetNode, IJsonRowNode } from 'flexlayout-react';
import type { FlexDockPanel } from './types';

// 布局比例配置 | Layout ratio configuration
const DEFAULT_RIGHT_PANEL_WEIGHT = 20;  // 右侧面板占 20%
const DEFAULT_LEFT_PANEL_WEIGHT = 80;   // 左侧面板占 80%
const DEFAULT_VIEWPORT_HEIGHT_RATIO = 80;  // Viewport 占 80%
const DEFAULT_BOTTOM_PANEL_HEIGHT_RATIO = 20;  // 底部面板占 20%
const DEFAULT_RIGHT_TOP_HEIGHT_RATIO = 40;
const DEFAULT_RIGHT_BOTTOM_HEIGHT_RATIO = 60;

export class LayoutBuilder {
    static createDefaultLayout(panels: FlexDockPanel[], activePanelId?: string): IJsonModel {
        // 根据布局配置分组面板 | Group panels by layout config
        const centerPanels = panels.filter((p) => !p.layout?.position || p.layout.position === 'center');
        const bottomPanels = panels.filter((p) => p.layout?.position === 'bottom');
        const rightTopPanels = panels.filter((p) => p.layout?.position === 'right-top');
        const rightBottomPanels = panels.filter((p) => p.layout?.position === 'right-bottom');

        const mainRowChildren = this.buildLayout(
            centerPanels,
            bottomPanels,
            rightTopPanels,
            rightBottomPanels,
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
        centerPanels: FlexDockPanel[],
        bottomPanels: FlexDockPanel[],
        rightTopPanels: FlexDockPanel[],
        rightBottomPanels: FlexDockPanel[],
        activePanelId?: string
    ): (IJsonTabSetNode | IJsonRowNode)[] {
        const mainRowChildren: (IJsonTabSetNode | IJsonRowNode)[] = [];

        // 构建左侧区域（Center + Bottom）| Build left area (Center + Bottom)
        const leftColumnChildren: (IJsonTabSetNode | IJsonRowNode)[] = [];

        // Center 面板 | Center panels
        if (centerPanels.length > 0) {
            let activeTabIndex = 0;
            if (activePanelId) {
                const index = centerPanels.findIndex((p) => p.id === activePanelId);
                if (index !== -1) {
                    activeTabIndex = index;
                }
            }

            // 计算底部面板的权重 | Calculate bottom panels weight
            const bottomWeight = bottomPanels.length > 0
                ? (bottomPanels[0]?.layout?.weight ?? DEFAULT_BOTTOM_PANEL_HEIGHT_RATIO)
                : 0;
            const centerWeight = bottomPanels.length > 0 ? (100 - bottomWeight) : 100;

            leftColumnChildren.push({
                type: 'tabset',
                weight: centerWeight,
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

        // Bottom 面板（独立 tabset）| Bottom panels (separate tabset)
        if (bottomPanels.length > 0) {
            const bottomWeight = bottomPanels[0]?.layout?.weight ?? DEFAULT_BOTTOM_PANEL_HEIGHT_RATIO;
            leftColumnChildren.push({
                type: 'tabset',
                weight: bottomWeight,
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

        // 如果有左侧内容，添加到主行 | If there's left content, add to main row
        if (leftColumnChildren.length > 0) {
            if (leftColumnChildren.length === 1) {
                // 只有一个面板组，直接添加 | Only one panel group, add directly
                const node = leftColumnChildren[0] as IJsonTabSetNode;
                node.weight = DEFAULT_LEFT_PANEL_WEIGHT;
                mainRowChildren.push(node);
            } else {
                // 多个面板组，包装成列 | Multiple panel groups, wrap in column
                mainRowChildren.push({
                    type: 'row',
                    weight: DEFAULT_LEFT_PANEL_WEIGHT,
                    children: leftColumnChildren
                } as IJsonRowNode);
            }
        }

        // 构建右侧区域（Right-Top + Right-Bottom）| Build right area
        const rightColumnChildren: IJsonTabSetNode[] = [];

        if (rightTopPanels.length > 0) {
            rightColumnChildren.push({
                type: 'tabset',
                weight: DEFAULT_RIGHT_TOP_HEIGHT_RATIO,
                enableMaximize: true,
                children: rightTopPanels.map((p) => ({
                    type: 'tab',
                    name: p.title,
                    id: p.id,
                    component: p.id,
                    enableClose: p.closable !== false
                }))
            });
        }

        if (rightBottomPanels.length > 0) {
            rightColumnChildren.push({
                type: 'tabset',
                weight: DEFAULT_RIGHT_BOTTOM_HEIGHT_RATIO,
                enableMaximize: true,
                children: rightBottomPanels.map((p) => ({
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
                weight: DEFAULT_RIGHT_PANEL_WEIGHT,
                children: rightColumnChildren
            } as IJsonRowNode);
        }

        return mainRowChildren;
    }
}
