import { useCallback, useRef, useEffect, useState } from 'react';
import { Layout, Model, TabNode, IJsonModel, Actions, Action, DockLocation } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import '../styles/FlexLayoutDock.css';
import { LayoutMerger, LayoutBuilder, FlexDockPanel } from '../shared/layout';

export type { FlexDockPanel };

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
        return LayoutBuilder.createDefaultLayout(panels, activePanelId);
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
                    const mergedLayout = LayoutMerger.merge(savedLayout, defaultLayout, panels);
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
