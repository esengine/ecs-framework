/**
 * FlexLayoutDockContainer - Dockable panel container based on FlexLayout
 * FlexLayoutDockContainer - 基于 FlexLayout 的可停靠面板容器
 */

import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { Layout, Model, TabNode, TabSetNode, IJsonModel, Actions, Action, DockLocation } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import '../styles/FlexLayoutDock.css';
import { LayoutMerger, LayoutBuilder, FlexDockPanel } from '../shared/layout';

export type { FlexDockPanel };

/**
 * Panel IDs that should persist in DOM when switching tabs.
 * These panels contain WebGL canvas or other stateful content that cannot be unmounted.
 * 切换 tab 时需要保持 DOM 存在的面板 ID。
 * 这些面板包含 WebGL canvas 或其他不能卸载的有状态内容。
 */
const PERSISTENT_PANEL_IDS = ['viewport'];

/** Tab header height in pixels | Tab 标签栏高度（像素） */
const TAB_HEADER_HEIGHT = 28;

interface PanelRect {
    domRect: DOMRect;
    isSelected: boolean;
    isVisible?: boolean;
}

/**
 * Get panel rectangle from FlexLayout model.
 * 从 FlexLayout 模型获取面板矩形。
 */
function getPanelRectFromModel(model: Model, panelId: string): PanelRect | null {
    const node = model.getNodeById(panelId);
    if (!node || node.getType() !== 'tab') return null;

    const parent = node.getParent();
    if (!parent || parent.getType() !== 'tabset') return null;

    const tabset = parent as any;
    const selectedNode = tabset.getSelectedNode();
    const isSelected = selectedNode?.getId() === panelId;
    const tabsetRect = tabset.getRect();

    if (!tabsetRect) return null;

    return {
        domRect: new DOMRect(
            tabsetRect.x,
            tabsetRect.y + TAB_HEADER_HEIGHT,
            tabsetRect.width,
            tabsetRect.height - TAB_HEADER_HEIGHT
        ),
        isSelected
    };
}

/**
 * Get panel rectangle from DOM placeholder element.
 * 从 DOM 占位符元素获取面板矩形。
 */
function getPanelRectFromDOM(panelId: string): PanelRect | null {
    const placeholder = document.querySelector(`[data-panel-id="${panelId}"]`);
    if (!placeholder) return null;

    const placeholderRect = placeholder.getBoundingClientRect();
    if (placeholderRect.width <= 0 || placeholderRect.height <= 0) return null;

    const container = document.querySelector('.flexlayout-dock-container');
    if (!container) return null;

    const containerRect = container.getBoundingClientRect();
    const parentTab = placeholder.closest('.flexlayout__tabset_content');
    const isVisible = parentTab ? (parentTab as HTMLElement).offsetParent !== null : false;

    return {
        domRect: new DOMRect(
            placeholderRect.x - containerRect.x,
            placeholderRect.y - containerRect.y,
            placeholderRect.width,
            placeholderRect.height
        ),
        isSelected: false,
        isVisible
    };
}

interface FlexLayoutDockContainerProps {
    panels: FlexDockPanel[];
    onPanelClose?: (panelId: string) => void;
    activePanelId?: string;
    messageHub?: { subscribe: (event: string, callback: (data: any) => void) => () => void } | null;
}

export function FlexLayoutDockContainer({ panels, onPanelClose, activePanelId, messageHub }: FlexLayoutDockContainerProps) {
    const layoutRef = useRef<Layout>(null);
    const previousLayoutJsonRef = useRef<string | null>(null);
    const previousPanelIdsRef = useRef<string>('');
    const previousPanelTitlesRef = useRef<Map<string, string>>(new Map());

    // Persistent panel state | 持久化面板状态
    const [persistentPanelRects, setPersistentPanelRects] = useState<Map<string, DOMRect>>(new Map());
    const [visiblePersistentPanels, setVisiblePersistentPanels] = useState<Set<string>>(
        () => new Set(PERSISTENT_PANEL_IDS)
    );
    const [isAnyTabsetMaximized, setIsAnyTabsetMaximized] = useState(false);

    const persistentPanels = useMemo(
        () => panels.filter((p) => PERSISTENT_PANEL_IDS.includes(p.id)),
        [panels]
    );

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
            const currentPanelIds = panels.map((p) => p.id).sort().join(',');
            const previousIds = previousPanelIdsRef.current;

            // 检查标题是否变化
            const currentTitles = new Map(panels.map((p) => [p.id, p.title]));
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
            const prevSet = new Set(previousIds.split(',').filter((id) => id));
            const currSet = new Set(currentPanelIds.split(',').filter((id) => id));
            const newPanelIds = Array.from(currSet).filter((id) => !prevSet.has(id));
            const removedPanelIds = Array.from(prevSet).filter((id) => !currSet.has(id));

            previousPanelIdsRef.current = currentPanelIds;

            // 如果已经有布局且只是添加新面板，使用Action动态添加
            if (model && newPanelIds.length > 0 && removedPanelIds.length === 0 && previousIds) {
                // 找到要添加的面板
                const newPanels = panels.filter((p) => newPanelIds.includes(p.id));

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
                    newPanels.forEach((panel) => {
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

    /**
     * Track persistent panel positions and visibility.
     * Uses FlexLayout model to determine if panel tab is selected,
     * falls back to DOM measurement if model data unavailable.
     * 追踪持久化面板的位置和可见性。
     * 使用 FlexLayout 模型判断面板 tab 是否被选中，
     * 如果模型数据不可用则回退到 DOM 测量。
     */
    useEffect(() => {
        if (!model) return;

        const updatePersistentPanelPositions = () => {
            const newRects = new Map<string, DOMRect>();
            const newVisible = new Set<string>();

            for (const panelId of PERSISTENT_PANEL_IDS) {
                // Try to get position from FlexLayout model
                const rect = getPanelRectFromModel(model, panelId);
                if (rect) {
                    newRects.set(panelId, rect.domRect);
                    if (rect.isSelected) {
                        newVisible.add(panelId);
                    }
                    continue;
                }

                // Fallback: measure placeholder element in DOM
                const placeholderRect = getPanelRectFromDOM(panelId);
                if (placeholderRect) {
                    newRects.set(panelId, placeholderRect.domRect);
                    if (placeholderRect.isVisible) {
                        newVisible.add(panelId);
                    }
                }
            }

            setPersistentPanelRects(newRects);
            setVisiblePersistentPanels(newVisible);
        };

        // Initial update after DOM render
        requestAnimationFrame(updatePersistentPanelPositions);

        // Observe layout changes
        const container = document.querySelector('.flexlayout-dock-container');
        if (!container) return;

        const mutationObserver = new MutationObserver(() => {
            requestAnimationFrame(updatePersistentPanelPositions);
        });
        mutationObserver.observe(container, { childList: true, subtree: true, attributes: true });

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updatePersistentPanelPositions);
        });
        resizeObserver.observe(container);

        return () => {
            mutationObserver.disconnect();
            resizeObserver.disconnect();
        };
    }, [model]);

    const factory = useCallback((node: TabNode) => {
        const componentId = node.getComponent() || '';

        // Persistent panels render as placeholder, actual content is in overlay
        // 持久化面板渲染为占位符，实际内容在覆盖层中
        if (PERSISTENT_PANEL_IDS.includes(componentId)) {
            return <div className="persistent-panel-placeholder" data-panel-id={componentId} />;
        }

        const panel = panels.find((p) => p.id === componentId);
        return panel?.content ?? <div>Panel not found</div>;
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

        // Check if any tabset is maximized
        let hasMaximized = false;
        newModel.visitNodes((node) => {
            if (node.getType() === 'tabset') {
                const tabset = node as TabSetNode;
                if (tabset.isMaximized()) {
                    hasMaximized = true;
                }
            }
        });
        setIsAnyTabsetMaximized(hasMaximized);
    }, []);

    useEffect(() => {
        if (!messageHub || !model) return;

        const unsubscribe = messageHub.subscribe('panel:select', (data: { panelId: string }) => {
            const { panelId } = data;
            const node = model.getNodeById(panelId);
            if (node && node.getType() === 'tab') {
                model.doAction(Actions.selectTab(panelId));
            }
        });

        return () => unsubscribe?.();
    }, [messageHub, model]);

    return (
        <div className="flexlayout-dock-container">
            <Layout
                ref={layoutRef}
                model={model}
                factory={factory}
                onAction={onAction}
                onModelChange={onModelChange}
            />

            {/* Persistent panel overlay - always mounted, visibility controlled by CSS */}
            {/* 持久化面板覆盖层 - 始终挂载，通过 CSS 控制可见性 */}
            {persistentPanels.map((panel) => (
                <PersistentPanelContainer
                    key={panel.id}
                    panel={panel}
                    rect={persistentPanelRects.get(panel.id)}
                    isVisible={visiblePersistentPanels.has(panel.id)}
                    isMaximized={isAnyTabsetMaximized}
                />
            ))}
        </div>
    );
}

/**
 * Container for persistent panel content.
 * 持久化面板内容容器。
 */
function PersistentPanelContainer({
    panel,
    rect,
    isVisible,
    isMaximized
}: {
    panel: FlexDockPanel;
    rect?: DOMRect;
    isVisible: boolean;
    isMaximized: boolean;
}) {
    const hasValidRect = rect && rect.width > 0 && rect.height > 0;

    // Hide persistent panel completely when another tabset is maximized
    // (unless this panel itself is in the maximized tabset)
    const shouldHide = isMaximized && !isVisible;

    return (
        <div
            className="persistent-panel-container"
            style={{
                position: 'absolute',
                left: hasValidRect ? rect.x : 0,
                top: hasValidRect ? rect.y : 0,
                width: hasValidRect ? rect.width : '100%',
                height: hasValidRect ? rect.height : '100%',
                visibility: (isVisible && !shouldHide) ? 'visible' : 'hidden',
                pointerEvents: (isVisible && !shouldHide) ? 'auto' : 'none',
                // 使用较低的 z-index，确保不会遮挡 FlexLayout 的 tab bar
                zIndex: 0,
                overflow: 'hidden'
            }}
        >
            {panel.content}
        </div>
    );
}
