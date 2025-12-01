import { useRef, useCallback, useMemo, useEffect, CommandManager } from '@esengine/editor-runtime';

/**
 * 撤销/重做功能 Hook
 */
export function useCommandHistory() {
    const commandManagerRef = useRef<CommandManager>(new CommandManager());

    const commandManager = commandManagerRef.current;

    const canUndo = useCallback(() => {
        return commandManager.canUndo();
    }, [commandManager]);

    const canRedo = useCallback(() => {
        return commandManager.canRedo();
    }, [commandManager]);

    const undo = useCallback(() => {
        if (commandManager.canUndo()) {
            commandManager.undo();
        }
    }, [commandManager]);

    const redo = useCallback(() => {
        if (commandManager.canRedo()) {
            commandManager.redo();
        }
    }, [commandManager]);

    const getUndoHistory = useCallback(() => {
        return commandManager.getUndoHistory();
    }, [commandManager]);

    const getRedoHistory = useCallback(() => {
        return commandManager.getRedoHistory();
    }, [commandManager]);

    const clear = useCallback(() => {
        commandManager.clear();
    }, [commandManager]);

    // 键盘快捷键
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

            if (isCtrlOrCmd && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if (isCtrlOrCmd && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    return {
        commandManager,
        canUndo: canUndo(),
        canRedo: canRedo(),
        undo,
        redo,
        getUndoHistory,
        getRedoHistory,
        clear
    };
}
