import { create } from 'zustand';

/**
 * 编辑器交互状态
 * 管理编辑器的交互状态（连接、框选、菜单等）
 */
interface EditorState {
    /**
     * 正在连接的源节点ID
     */
    connectingFrom: string | null;

    /**
     * 正在连接的源属性
     */
    connectingFromProperty: string | null;

    /**
     * 连接目标位置（鼠标位置）
     */
    connectingToPos: { x: number; y: number } | null;

    /**
     * 是否正在框选
     */
    isBoxSelecting: boolean;

    /**
     * 框选起始位置
     */
    boxSelectStart: { x: number; y: number } | null;

    /**
     * 框选结束位置
     */
    boxSelectEnd: { x: number; y: number } | null;

    // Actions
    setConnectingFrom: (nodeId: string | null) => void;
    setConnectingFromProperty: (propertyName: string | null) => void;
    setConnectingToPos: (pos: { x: number; y: number } | null) => void;
    clearConnecting: () => void;

    setIsBoxSelecting: (isSelecting: boolean) => void;
    setBoxSelectStart: (pos: { x: number; y: number } | null) => void;
    setBoxSelectEnd: (pos: { x: number; y: number } | null) => void;
    clearBoxSelect: () => void;
}

/**
 * Editor Store
 */
export const useEditorStore = create<EditorState>((set) => ({
    connectingFrom: null,
    connectingFromProperty: null,
    connectingToPos: null,

    isBoxSelecting: false,
    boxSelectStart: null,
    boxSelectEnd: null,

    setConnectingFrom: (nodeId: string | null) => set({ connectingFrom: nodeId }),

    setConnectingFromProperty: (propertyName: string | null) =>
        set({ connectingFromProperty: propertyName }),

    setConnectingToPos: (pos: { x: number; y: number } | null) => set({ connectingToPos: pos }),

    clearConnecting: () =>
        set({
            connectingFrom: null,
            connectingFromProperty: null,
            connectingToPos: null
        }),

    setIsBoxSelecting: (isSelecting: boolean) => set({ isBoxSelecting: isSelecting }),

    setBoxSelectStart: (pos: { x: number; y: number } | null) => set({ boxSelectStart: pos }),

    setBoxSelectEnd: (pos: { x: number; y: number } | null) => set({ boxSelectEnd: pos }),

    clearBoxSelect: () =>
        set({
            isBoxSelecting: false,
            boxSelectStart: null,
            boxSelectEnd: null
        })
}));
