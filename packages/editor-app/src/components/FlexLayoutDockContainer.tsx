import { useCallback, ReactNode, useRef, useEffect, useState } from 'react';
import { Layout, Model, TabNode, IJsonModel, Actions, IJsonTabSetNode, IJsonRowNode, Action, IJsonTabNode, DockLocation } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import '../styles/FlexLayoutDock.css';

/**
 * 合并保存的布局和新的默认布局
 * 保留用户的布局调整（大小、位置等），同时添加新面板并移除已关闭的面板
 */
function mergeLayouts(savedLayout: IJsonModel, defaultLayout: IJsonModel, currentPanels: FlexDockPanel[]): IJsonModel {
    // 获取当前所有面板ID
    const currentPanelIds = new Set(currentPanels.map(p => p.id));

    // 收集保存布局中存在的面板ID
    const savedPanelIds = new Set<string>();
    const collectPanelIds = (node: any) => {
        if (node.type === 'tab' && node.id) {
            savedPanelIds.add(node.id);
        }
        if (node.children) {
            node.children.forEach((child: any) => collectPanelIds(child));
        }
    };
    collectPanelIds(savedLayout.layout);

    // 同时收集borders中的面板ID
    if (savedLayout.borders) {
        savedLayout.borders.forEach((border: any) => {
            if (border.children) {
                collectPanelIds({ children: border.children });
            }
        });
    }

    // 找出新增的面板和已移除的面板
    const newPanelIds = Array.from(currentPanelIds).filter(id => !savedPanelIds.has(id));
    const removedPanelIds = Array.from(savedPanelIds).filter(id => !currentPanelIds.has(id));

    // 克隆保存的布局
    const mergedLayout = JSON.parse(JSON.stringify(savedLayout));

    // 确保borders为空（不保留最小化状态）
    if (mergedLayout.borders) {
        mergedLayout.borders = mergedLayout.borders.map((border: any) => ({
            ...border,
            children: []
        }));
    }

    // 第一步：移除已关闭的面板
    if (removedPanelIds.length > 0) {
        const removePanels = (node: any): boolean => {
            if (!node.children) return false;

            // 过滤掉已移除的tab
            if (node.type === 'tabset' || node.type === 'row') {
                const originalLength = node.children.length;
                node.children = node.children.filter((child: any) => {
                    if (child.type === 'tab') {
                        return !removedPanelIds.includes(child.id);
                    }
                    return true;
                });

                // 如果有tab被移除，调整selected索引
                if (node.type === 'tabset' && node.children.length < originalLength) {
                    if (node.selected >= node.children.length) {
                        node.selected = Math.max(0, node.children.length - 1);
                    }
                }

                // 递归处理子节点
                node.children.forEach((child: any) => removePanels(child));

                return node.children.length < originalLength;
            }

            return false;
        };
        removePanels(mergedLayout.layout);
    }

    // 第二步：如果没有新面板，直接返回清理后的布局
    if (newPanelIds.length === 0) {
        return mergedLayout;
    }

    // 第三步：在默认布局中找到新面板的配置
    const newPanelTabs: IJsonTabNode[] = [];
    const findNewPanels = (node: any) => {
        if (node.type === 'tab' && node.id && newPanelIds.includes(node.id)) {
            newPanelTabs.push(node);
        }
        if (node.children) {
            node.children.forEach((child: any) => findNewPanels(child));
        }
    };
    findNewPanels(defaultLayout.layout);

    // 第四步：将新面板添加到中心区域的第一个tabset
    const addNewPanelsToCenter = (node: any): boolean => {
        if (node.type === 'tabset') {
            // 检查是否是中心区域的tabset（通过检查是否包含非hierarchy/asset/inspector/console面板）
            const hasNonSidePanel = node.children?.some((child: any) => {
                const id = child.id || '';
                return !id.includes('hierarchy') &&
                       !id.includes('asset') &&
                       !id.includes('inspector') &&
                       !id.includes('console');
            });

            if (hasNonSidePanel && node.children) {
                // 添加新面板到这个tabset
                node.children.push(...newPanelTabs);
                // 选中最后添加的面板
                node.selected = node.children.length - 1;
                return true;
            }
        }

        if (node.children) {
            for (const child of node.children) {
                if (addNewPanelsToCenter(child)) {
                    return true;
                }
            }
        }

        return false;
    };

    // 尝试添加新面板到中心区域
    if (!addNewPanelsToCenter(mergedLayout.layout)) {
        // 如果没有找到合适的tabset，使用默认布局
        return defaultLayout;
    }

    return mergedLayout;
}

export interface FlexDockPanel {
  id: string;
  title: string;
  content: ReactNode;
  closable?: boolean;
}

interface FlexLayoutDockContainerProps {
  panels: FlexDockPanel[];
  onPanelClose?: (panelId: string) => void;
  activePanelId?: string;
}

export function FlexLayoutDockContainer({ panels, onPanelClose, activePanelId }: FlexLayoutDockContainerProps) {
    const layoutRef = useRef<Layout>(null);
    const previousLayoutJsonRef = useRef<string | null>(null);
    const previousPanelIdsRef = useRef<string>('');
    const previousPanelTitlesRef = useRef<Map<string, string>>(new Map());

    const createDefaultLayout = useCallback((): IJsonModel => {
        const hierarchyPanels = panels.filter((p) => p.id.includes('hierarchy'));
        const assetPanels = panels.filter((p) => p.id.includes('asset'));
        const rightPanels = panels.filter((p) => p.id.includes('inspector'));
        const bottomPanels = panels.filter((p) => p.id.includes('console'));
        const centerPanels = panels.filter((p) =>
            !hierarchyPanels.includes(p) && !assetPanels.includes(p) && !rightPanels.includes(p) && !bottomPanels.includes(p)
        );

        // Build center column children
        const centerColumnChildren: (IJsonTabSetNode | IJsonRowNode)[] = [];
        if (centerPanels.length > 0) {
            // 找到要激活的tab的索引
            let activeTabIndex = 0;
            if (activePanelId) {
                const index = centerPanels.findIndex((p) => p.id === activePanelId);
                if (index !== -1) {
                    activeTabIndex = index;
                }
            }

            centerColumnChildren.push({
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
            centerColumnChildren.push({
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

        // Build main row children
        const mainRowChildren: (IJsonTabSetNode | IJsonRowNode)[] = [];

        // 左侧列：场景层级和资产面板垂直排列（五五分）
        if (hierarchyPanels.length > 0 || assetPanels.length > 0) {
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

            mainRowChildren.push({
                type: 'row',
                weight: 20,
                children: leftColumnChildren
            });
        }
        if (centerColumnChildren.length > 0) {
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

        return {
            global: {
                tabEnableClose: true,
                tabEnableRename: false,
                tabSetEnableMaximize: true,
                tabSetEnableDrop: true,
                tabSetEnableDrag: true,
                tabSetEnableDivide: true,
                borderEnableDrop: true,
                borderAutoSelectTabWhenOpen: true,
                borderAutoSelectTabWhenClosed: true
            },
            borders: [
                {
                    type: 'border',
                    location: 'bottom',
                    size: 200,
                    children: []
                },
                {
                    type: 'border',
                    location: 'right',
                    size: 300,
                    children: []
                }
            ],
            layout: {
                type: 'row',
                weight: 100,
                children: mainRowChildren
            }
        };
    }, [panels, activePanelId]);

    const [model, setModel] = useState<Model>(() => {
        try {
            return Model.fromJson(createDefaultLayout());
        } catch (error) {
            throw new Error(`Failed to create layout model: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    useEffect(() => {
        try {
            // 检查面板ID列表是否真的变化了（而不只是标题等属性变化）
            const currentPanelIds = panels.map(p => p.id).sort().join(',');
            const previousIds = previousPanelIdsRef.current;

            // 检查标题是否变化
            const currentTitles = new Map(panels.map(p => [p.id, p.title]));
            const titleChanges: Array<{ id: string; newTitle: string }> = [];

            for (const panel of panels) {
                const previousTitle = previousPanelTitlesRef.current.get(panel.id);
                if (previousTitle && previousTitle !== panel.title) {
                    titleChanges.push({ id: panel.id, newTitle: panel.title });
                }
            }

            // 更新标题引用
            previousPanelTitlesRef.current = currentTitles;

            // 如果只是标题变化，更新tab名称
            if (titleChanges.length > 0 && currentPanelIds === previousIds && model) {
                titleChanges.forEach(({ id, newTitle }) => {
                    const node = model.getNodeById(id);
                    if (node && node.getType() === 'tab') {
                        model.doAction(Actions.renameTab(id, newTitle));
                    }
                });
                return;
            }

            if (currentPanelIds === previousIds) {
                return;
            }

            // 计算新增和移除的面板
            const prevSet = new Set(previousIds.split(',').filter(id => id));
            const currSet = new Set(currentPanelIds.split(',').filter(id => id));
            const newPanelIds = Array.from(currSet).filter(id => !prevSet.has(id));
            const removedPanelIds = Array.from(prevSet).filter(id => !currSet.has(id));

            previousPanelIdsRef.current = currentPanelIds;

            // 如果已经有布局且只是添加新面板，使用Action动态添加
            if (model && newPanelIds.length > 0 && removedPanelIds.length === 0 && previousIds) {
                // 找到要添加的面板
                const newPanels = panels.filter(p => newPanelIds.includes(p.id));

                // 找到中心区域的tabset ID
                let centerTabsetId: string | null = null;

                model.visitNodes((node: any) => {
                    if (node.getType() === 'tabset') {
                        const tabset = node as any;
                        // 检查是否是中心tabset
                        const children = tabset.getChildren();
                        const hasNonSidePanel = children.some((child: any) => {
                            const id = child.getId();
                            return !id.includes('hierarchy') &&
                                   !id.includes('asset') &&
                                   !id.includes('inspector') &&
                                   !id.includes('console');
                        });
                        if (hasNonSidePanel && !centerTabsetId) {
                            centerTabsetId = tabset.getId();
                        }
                    }
                });

                if (centerTabsetId) {
                    // 动态添加tab到中心tabset
                    newPanels.forEach(panel => {
                        model.doAction(Actions.addNode(
                            {
                                type: 'tab',
                                name: panel.title,
                                id: panel.id,
                                component: panel.id,
                                enableClose: panel.closable !== false
                            },
                            centerTabsetId!,
                            DockLocation.CENTER,
                            -1 // 添加到末尾
                        ));
                    });

                    // 选中最后添加的面板
                    const lastPanel = newPanels[newPanels.length - 1];
                    if (lastPanel) {
                        setTimeout(() => {
                            const node = model.getNodeById(lastPanel.id);
                            if (node) {
                                model.doAction(Actions.selectTab(lastPanel.id));
                            }
                        }, 0);
                    }

                    return;
                }
            }

            // 否则完全重建布局
            const defaultLayout = createDefaultLayout();

            // 如果有保存的布局，尝试合并
            if (previousLayoutJsonRef.current && previousIds) {
                try {
                    const savedLayout = JSON.parse(previousLayoutJsonRef.current);
                    const mergedLayout = mergeLayouts(savedLayout, defaultLayout, panels);
                    const newModel = Model.fromJson(mergedLayout);
                    setModel(newModel);
                    return;
                } catch (error) {
                    // 合并失败，使用默认布局
                }
            }

            // 使用默认布局
            const newModel = Model.fromJson(defaultLayout);
            setModel(newModel);
        } catch (error) {
            throw new Error(`Failed to update layout model: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [createDefaultLayout, panels]);

    const factory = useCallback((node: TabNode) => {
        const component = node.getComponent();
        const panel = panels.find((p) => p.id === component);
        return panel?.content || <div>Panel not found</div>;
    }, [panels]);

    const onAction = useCallback((action: Action) => {
        if (action.type === Actions.DELETE_TAB) {
            const tabId = (action.data as { node: string }).node;
            if (onPanelClose) {
                onPanelClose(tabId);
            }
        }
        return action;
    }, [onPanelClose]);

    const onModelChange = useCallback((newModel: Model) => {
        // 保存布局状态以便在panels变化时恢复
        const layoutJson = newModel.toJson();
        previousLayoutJsonRef.current = JSON.stringify(layoutJson);
    }, []);

    return (
        <div className="flexlayout-dock-container">
            <Layout
                ref={layoutRef}
                model={model}
                factory={factory}
                onAction={onAction}
                onModelChange={onModelChange}
            />
        </div>
    );
}
