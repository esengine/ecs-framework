/**
 * FlexLayoutDockContainer - Dockable panel container based on FlexLayout
 * FlexLayoutDockContainer - 基于 FlexLayout 的可停靠面板容器
 */

import { useCallback, useRef, useEffect, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Layout, Model, TabNode, TabSetNode, IJsonModel, Actions, Action, DockLocation } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import '../styles/FlexLayoutDock.css';
import { LayoutMerger, LayoutBuilder, FlexDockPanel } from '../shared/layout';

export type { FlexDockPanel };

/** LocalStorage key for persisting layout | 持久化布局的 localStorage 键 */
const LAYOUT_STORAGE_KEY = 'esengine-editor-layout';

/** Layout version for migration | 布局版本用于迁移 */
const LAYOUT_VERSION = 1;

/** Saved layout data structure | 保存的布局数据结构 */
interface SavedLayoutData {
    version: number;
    layout: IJsonModel;
    timestamp: number;
}

/**
 * Save layout to localStorage.
 * 保存布局到 localStorage。
 */
function saveLayoutToStorage(layout: IJsonModel): void {
    try {
        const data: SavedLayoutData = {
            version: LAYOUT_VERSION,
            layout,
            timestamp: Date.now()
        };
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.warn('Failed to save layout to localStorage:', error);
    }
}

/**
 * Load layout from localStorage.
 * 从 localStorage 加载布局。
 */
function loadLayoutFromStorage(): IJsonModel | null {
    try {
        const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
        if (!saved) return null;

        const data: SavedLayoutData = JSON.parse(saved);

        // Version check for future migrations
        if (data.version !== LAYOUT_VERSION) {
            console.info('Layout version mismatch, using default layout');
            return null;
        }

        return data.layout;
    } catch (error) {
        console.warn('Failed to load layout from localStorage:', error);
        return null;
    }
}

/**
 * Clear saved layout from localStorage.
 * 从 localStorage 清除保存的布局。
 */
function clearLayoutStorage(): void {
    try {
        localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } catch (error) {
        console.warn('Failed to clear layout from localStorage:', error);
    }
}

/**
 * Public handle for FlexLayoutDockContainer.
 * FlexLayoutDockContainer 的公开句柄。
 */
export interface FlexLayoutDockContainerHandle {
    /** Reset layout to default | 重置布局到默认状态 */
    resetLayout: () => void;
}

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

export const FlexLayoutDockContainer = forwardRef<FlexLayoutDockContainerHandle, FlexLayoutDockContainerProps>(
    function FlexLayoutDockContainer({ panels, onPanelClose, activePanelId, messageHub }, ref) {
    const layoutRef = useRef<Layout>(null);
    const previousLayoutJsonRef = useRef<string | null>(null);
    const previousPanelIdsRef = useRef<string>('');
    const previousPanelTitlesRef = useRef<Map<string, string>>(new Map());
    /** Skip saving on next model change (used when resetting layout) | 下次模型变化时跳过保存（重置布局时使用） */
    const skipNextSaveRef = useRef(false);

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

    /**
     * Try to load saved layout and merge with current panels.
     * 尝试加载保存的布局并与当前面板合并。
     */
    const loadSavedLayoutOrDefault = useCallback((): IJsonModel => {
        const savedLayout = loadLayoutFromStorage();
        if (savedLayout) {
            try {
                // Merge saved layout with current panels (handle new/removed panels)
                const defaultLayout = createDefaultLayout();
                const mergedLayout = LayoutMerger.merge(savedLayout, defaultLayout, panels);
                return mergedLayout;
            } catch (error) {
                console.warn('Failed to merge saved layout, using default:', error);
            }
        }
        return createDefaultLayout();
    }, [createDefaultLayout, panels]);

    const [model, setModel] = useState<Model>(() => {
        try {
            return Model.fromJson(loadSavedLayoutOrDefault());
        } catch (error) {
            console.warn('Failed to load saved layout, using default:', error);
            return Model.fromJson(createDefaultLayout());
        }
    });

    /**
     * Reset layout to default and clear saved layout.
     * 重置布局到默认状态并清除保存的布局。
     */
    const resetLayout = useCallback(() => {
        clearLayoutStorage();
        skipNextSaveRef.current = true;
        previousLayoutJsonRef.current = null;
        previousPanelIdsRef.current = '';
        const defaultLayout = createDefaultLayout();
        setModel(Model.fromJson(defaultLayout));
    }, [createDefaultLayout]);

    // Expose resetLayout method via ref | 通过 ref 暴露 resetLayout 方法
    useImperativeHandle(ref, () => ({
        resetLayout
    }), [resetLayout]);

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
            // 检查新面板是否需要独立 tabset（如 bottom 位置的面板）
            // Check if new panels require separate tabset (e.g., bottom position panels)
            const newPanelsWithConfig = panels.filter((p) => newPanelIds.includes(p.id));
            const hasSpecialLayoutPanels = newPanelsWithConfig.some((p) =>
                p.layout?.requiresSeparateTabset || p.layout?.position === 'bottom'
            );
            if (model && newPanelIds.length > 0 && removedPanelIds.length === 0 && previousIds && !hasSpecialLayoutPanels) {
                // 找到要添加的面板
                const newPanels = panels.filter((p) => newPanelIds.includes(p.id));

                // 构建面板位置映射 | Build panel position map
                const panelPositionMap = new Map(panels.map((p) => [p.id, p.layout?.position || 'center']));

                // 找到中心区域的tabset ID | Find center tabset ID
                let centerTabsetId: string | null = null;

                model.visitNodes((node: any) => {
                    if (node.getType() === 'tabset') {
                        const tabset = node as any;
                        // 检查是否是中心tabset（包含 center 位置的面板）
                        // Check if this is center tabset (contains center position panels)
                        const children = tabset.getChildren();
                        const hasCenterPanel = children.some((child: any) => {
                            const id = child.getId();
                            const position = panelPositionMap.get(id);
                            return position === 'center' || position === undefined;
                        });
                        if (hasCenterPanel && !centerTabsetId) {
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
            // 注意：如果新面板需要特殊布局（独立 tabset），直接使用默认布局
            // Note: If new panels need special layout (separate tabset), use default layout directly
            if (previousLayoutJsonRef.current && previousIds && !hasSpecialLayoutPanels) {
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

        // Save to localStorage (unless skipped) | 保存到 localStorage（除非跳过）
        if (skipNextSaveRef.current) {
            skipNextSaveRef.current = false;
        } else {
            saveLayoutToStorage(layoutJson);
        }

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
});

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
